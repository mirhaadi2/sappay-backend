/**
 * Seller Authentication Service
 * Handles seller login, registration, and profile management
 */

import { comparePassword, hashPassword } from '../../../utils/password';
import { withTransaction } from '../../../utils/transaction';
import { AppError } from '../../../utils/AppError';
import { sendWelcomeEmail, sendOtpToEmail } from '../../../infrastructure/email';
import { SellerStatus } from '../model';
import { create, findById, findByEmail } from '../repository';
import { SellerLoginCredentials, SellerRegisterCredentials } from './types';
import {
    sendOtpToEmail as sendSellerOtp,
    verifyOtp as verifySellerOtp,
} from '../../website/customers/otp.service';
import { OtpType } from '../../admin/customers/otp.model';

export const initiateSellerRegistration = async (email: string, ownerName: string) => {
    // Check if seller already exists
    const existingSeller = await findByEmail(email);
    if (existingSeller) {
        throw new AppError(
            'Conflict',
            409,
            'Email already registered. Please login or use a different email.',
        );
    }

    // Send OTP to email
    const otp = await sendSellerOtp(email, OtpType.REGISTRATION);

    return {
        message: 'Verification code sent to your email. Please check your inbox.',
        email,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only show in dev
    };
};

export const completeSellerRegistration = async (
    email: string,
    otp: string,
    data: SellerRegisterCredentials,
) => {
    return withTransaction(async (transaction) => {
        const {
            password,
            businessName,
            businessRegistrationNo,
            businessType,
            businessIdType,
            gstNumber,
            businessAddress,
            businessPhone,
            ownerName,
            ownerEmail,
            bankAccountName,
            bankAccountNumber,
            bankIfscCode,
        } = data;

        // Verify OTP
        try {
            await verifySellerOtp(email, 'email', otp, OtpType.REGISTRATION);
        } catch (err: any) {
            throw new AppError('ValidationError', 400, err.message || 'Invalid or expired OTP');
        }

        // Double-check seller doesn't exist
        const existingSeller = await findByEmail(ownerEmail);
        if (existingSeller) {
            throw new AppError('Conflict', 409, 'Seller with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create seller
        const seller = await create(
            {
                ownerEmail,
                ownerName,
                businessName,
                businessRegistrationNo,
                businessType,
                businessIdType,
                gstNumber,
                businessAddress,
                businessPhone,
                bankAccountName,
                bankAccountNumber,
                bankIfscCode,
                password: hashedPassword,
                status: 'PENDING' as SellerStatus,
            },
            transaction,
        );

        // Send welcome email (async, don't wait)
        // sendWelcomeEmail(ownerEmail, ownerName).catch(err =>
        //   console.error('Failed to send welcome email:', err)
        // );

        return {
            id: seller.id,
            status: seller.status,
            ownerEmail: seller.ownerEmail,
            ownerName: seller.ownerName,
            businessName: seller.businessName,
            message:
                'Registration successful! Your account is under review. Please wait for admin approval.',
        };
    });
};

export const registerSellerService = async (data: SellerRegisterCredentials) => {
    return withTransaction(async (transaction) => {
        const {
            password,
            businessName,
            businessRegistrationNo,
            businessType,
            businessIdType,
            gstNumber,
            businessAddress,
            businessPhone,
            ownerName,
            ownerEmail,
            bankAccountName,
            bankAccountNumber,
            bankIfscCode,
        } = data;

        // Check if seller already exists
        const existingSeller = await findByEmail(ownerEmail);
        if (existingSeller) {
            throw new AppError('Conflict', 409, 'Seller with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create seller
        const seller = await create(
            {
                ownerEmail,
                ownerName,
                businessName,
                businessRegistrationNo,
                businessType,
                businessIdType,
                gstNumber,
                businessAddress,
                businessPhone,
                bankAccountName,
                bankAccountNumber,
                bankIfscCode,
                password: hashedPassword,
                status: 'PENDING' as SellerStatus,
            },
            transaction,
        );

        // Send welcome email (async, don't wait)
        // sendWelcomeEmail(ownerEmail, ownerName).catch(err =>
        //   console.error('Failed to send welcome email:', err)
        // );

        return seller;
    });
};

export const loginSellerService = async (email: string, password: string) => {
    // Find seller by email
    const seller = await findByEmail(email);
    if (!seller) {
        throw new AppError('Unauthorized', 401, 'Invalid email or password');
    }

    // Check password
    if (!seller.password) {
        throw new AppError('Unauthorized', 401, 'Invalid email or password');
    }

    const isValidPassword = await comparePassword(password, seller.password);
    if (!isValidPassword) {
        throw new AppError('Unauthorized', 401, 'Invalid email or password');
    }

    // Check seller status
    if (seller.status === 'SUSPENDED') {
        throw new AppError('Forbidden', 403, 'Your seller account has been suspended');
    }

    if (seller.status === 'REJECTED') {
        throw new AppError('Forbidden', 403, 'Your seller application has been rejected');
    }

    if (seller.status === 'PENDING') {
        throw new AppError('Forbidden', 403, 'Your seller application is still under review');
    }

    return { seller };
};

export const getSellerProfileService = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found');
    }

    return seller;
};
