import { AppError } from '../../utils/AppError';
import { comparePassword, hashPassword } from '../../utils/password';
import { signJwt } from '../../config/jwt';
import { withTransaction } from '../../utils/transaction';
import {
    findById,
    findByEmail,
    // findByUserId,
    findByBusinessReg,
    create,
    update,
    updateStatus,
    findAll,
    getSellerStats,
} from './repository';
import {
    sendSellerApprovalEmail,
    sendSellerRejectionEmail,
    sendSellerReapplyConfirmationEmail,
} from '../../infrastructure/email';

export const registerSeller = async (sellerData: {
    password: string; // This should be already hashed by controller
    businessName: string;
    businessRegistrationNo: string;
    businessType: string;
    businessIdType?: string;
    gstNumber?: string;
    businessAddress: string;
    businessPhone: string;
    ownerName: string;
    ownerEmail: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
}) => {
    // Check if business is already registered
    const existingBusiness = await findByBusinessReg(sellerData.businessRegistrationNo);
    if (existingBusiness) {
        throw new AppError(
            'BadRequest',
            400,
            'This business registration number is already registered',
        );
    }

    // Validate required business information
    if (!sellerData.businessName || !sellerData.businessAddress) {
        throw new AppError('BadRequest', 400, 'Missing required seller information');
    }

    // Store businessIdType in metadata for easy access and future features
    const metadata = sellerData.businessIdType ? { businessIdType: sellerData.businessIdType } : {};

    // Create seller record with hashed password
    const seller = await create({
        businessName: sellerData.businessName,
        businessRegistrationNo: sellerData.businessRegistrationNo,
        businessType: sellerData.businessType,
        businessIdType: sellerData.businessIdType,
        // gstNumber: sellerData.gstNumber,
        businessAddress: sellerData.businessAddress,
        businessPhone: sellerData.businessPhone,
        ownerName: sellerData.ownerName,
        ownerEmail: sellerData.ownerEmail,
        password: sellerData.password, // Already hashed by controller
        bankAccountName: sellerData.bankAccountName,
        bankAccountNumber: sellerData.bankAccountNumber,
        bankIfscCode: sellerData.bankIfscCode,
        // metadata,
    });

    // Return registration success response
    return {
        id: seller.id,
        status: seller.status,
        onboardingStep: seller.onboardingStep,
        message: 'Seller account created successfully. Check your email for further instructions.',
    };
};

export const getSellerProfile = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found');
    }

    return {
        id: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        gstNumber: seller.gstNumber,
        status: seller.status,
        commissionRate: seller.commissionRate,
        onboardingStep: seller.onboardingStep,
        approvedAt: seller.approvedAt,
        createdAt: seller.createdAt,
    };
};

export const updateProfile = async (sellerId: string, userId: string, updates: any) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        // if (seller.userId !== userId) {
        //   throw new AppError('Forbidden', 403, 'Unauthorized: Cannot update another seller profile');
        // }

        const allowedFields = [
            'businessAddress',
            'businessPhone',
            'bankAccountName',
            'bankAccountNumber',
            'bankIfscCode',
            'ownerName',
            'ownerEmail',
        ];

        const updateData: any = {};
        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        return await update(sellerId, updateData, transaction);
    });
};

export const getDashboardStats = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found');
    }

    const stats = await getSellerStats(sellerId);

    return {
        seller: {
            id: seller.id,
            businessName: seller.businessName,
            commissionRate: seller.commissionRate,
        },
        stats,
        onboardingStatus: {
            step: seller.onboardingStep,
            completed: seller.onboardingStep === 100,
        },
    };
};

export const approveSeller = async (sellerId: string, approvalData?: any) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        if (seller.status !== 'PENDING') {
            throw new AppError(
                'BadRequest',
                400,
                `Cannot approve seller with status: ${seller.status}`,
            );
        }

        const updated = await updateStatus(sellerId, 'APPROVED', {}, transaction);
        return {
            id: updated.id,
            status: updated.status,
            message: 'Seller has been approved',
        };
    });
};

export const rejectSeller = async (sellerId: string, reason: string) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        if (seller.status !== 'PENDING') {
            throw new AppError(
                'BadRequest',
                400,
                `Cannot reject seller with status: ${seller.status}`,
            );
        }

        const updated = await updateStatus(sellerId, 'REJECTED', { reason }, transaction);

        // Notify seller
        sendSellerRejectionEmail(
            seller.ownerEmail,
            seller.ownerName,
            reason || 'Rejected by admin',
        ).catch((err) => console.error('Failed to send rejection email:', err));

        return {
            id: updated.id,
            status: updated.status,
            message: 'Seller registration has been rejected',
        };
    });
};

export const reapplySeller = async (sellerId: string) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        if (seller.status !== 'REJECTED') {
            throw new AppError('BadRequest', 400, 'Only rejected sellers can reapply');
        }

        const metadata = seller.metadata || {};
        metadata.rejectionReason = null;
        metadata.rejectedAt = null;
        metadata.reappliedAt = new Date().toISOString();

        const updated = await updateStatus(
            sellerId,
            'PENDING',
            {
                rejectedReason: null,
                metadata,
            },
            transaction,
        );

        sendSellerReapplyConfirmationEmail(seller.ownerEmail, seller.ownerName).catch((err) =>
            console.error('Failed to send reapply confirmation email:', err),
        );

        return {
            id: updated.id,
            status: updated.status,
            message: 'Reapplication submitted. Your account is now pending review.',
        };
    });
};

export const getSellerForReapply = async (email: string) => {
    const seller = await findByEmail(email);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found with this email');
    }

    if (seller.status === 'APPROVED') {
        throw new AppError('BadRequest', 400, 'This seller account is already approved');
    }

    if (seller.status === 'SUSPENDED') {
        throw new AppError('BadRequest', 400, 'This seller account is suspended');
    }

    // Return seller data for reapply form
    return {
        id: seller.id,
        email: seller.ownerEmail,
        ownerName: seller.ownerName,
        businessName: seller.businessName,
        businessRegistrationNo: seller.businessRegistrationNo,
        businessType: seller.businessType,
        businessIdType: seller.businessIdType,
        gstNumber: seller.gstNumber,
        businessAddress: seller.businessAddress,
        businessPhone: seller.businessPhone,
        bankAccountName: seller.bankAccountName,
        bankAccountNumber: seller.bankAccountNumber,
        bankIfscCode: seller.bankIfscCode,
        status: seller.status,
        rejectionReason: seller.rejectedReason,
    };
};

export const updateSellerForReapply = async (sellerId: string, updateData: any) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        if (seller.status === 'APPROVED') {
            throw new AppError('BadRequest', 400, 'Cannot update approved seller');
        }

        if (seller.status === 'SUSPENDED') {
            throw new AppError('BadRequest', 400, 'Cannot update suspended seller');
        }

        // Update seller data
        const updated = await update(sellerId, updateData, transaction);

        // If status was REJECTED, change to PENDING for reapply
        if (seller.status === 'REJECTED') {
            await updateStatus(
                sellerId,
                'PENDING',
                {
                    rejectedReason: null,
                    metadata: { ...seller.metadata, reappliedAt: new Date().toISOString() },
                },
                transaction,
            );

            // Send reapply confirmation email
            sendSellerReapplyConfirmationEmail(seller.ownerEmail, seller.ownerName).catch((err) =>
                console.error('Failed to send reapply confirmation email:', err),
            );
        }

        return {
            id: updated.id,
            status: updated.status,
            message:
                seller.status === 'REJECTED'
                    ? 'Reapplication submitted successfully'
                    : 'Information updated successfully',
        };
    });
};

export const suspendSeller = async (sellerId: string, reason: string) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        if (seller.status === 'SUSPENDED') {
            throw new AppError('BadRequest', 400, 'Seller is already suspended');
        }

        const updated = await updateStatus(sellerId, 'SUSPENDED', { reason }, transaction);

        return {
            id: updated.id,
            status: updated.status,
            message: 'Seller account has been suspended',
        };
    });
};

export const listSellersByFilter = async (filters: any) => {
    return await findAll(filters);
};

export const listSellers = listSellersByFilter;

export const validateSellerStatus = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found');
    }

    if (seller.status !== 'APPROVED') {
        throw new AppError('Forbidden', 403, `Seller cannot operate with status: ${seller.status}`);
    }

    return true;
};

/**
 * Seller Login Service
 * Authenticates seller by email and password
 * Returns JWT tokens with portal-scoped authentication
 */
export const loginSeller = async (email: string, password: string) => {
    // Find seller by email
    const seller = await findByEmail(email);
    if (!seller || !seller.password) {
        throw new AppError('Unauthorized', 401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, seller.password);
    if (!isPasswordValid) {
        throw new AppError('Unauthorized', 401, 'Invalid email or password');
    }

    // Check seller status
    if (seller.status === 'PENDING') {
        throw new AppError(
            'Forbidden',
            403,
            'Your seller account is pending approval. Please check your email for updates or reapply.',
        );
    }

    if (seller.status === 'REJECTED') {
        throw new AppError(
            'Forbidden',
            403,
            'Your seller account has been rejected. You can reapply with updated information.',
        );
    }

    if (seller.status === 'SUSPENDED') {
        throw new AppError('Forbidden', 403, 'Your seller account has been suspended');
    }

    // Generate JWT tokens with seller/portal context
    const accessToken = signJwt({
        sub: seller.id,
        email: seller.ownerEmail,
        role: 'SELLER' as any,
    });

    const refreshToken = signJwt({
        sub: seller.id,
        email: seller.ownerEmail,
        role: 'SELLER' as any,
    });

    return {
        seller: {
            id: seller.id,
            businessName: seller.businessName,
            ownerName: seller.ownerName,
            ownerEmail: seller.ownerEmail,
            status: seller.status,
            businessType: seller.businessType,
        },
        tokens: {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 hours
        },
    };
};

/**
 * Get Current Seller Profile
 * Returns complete seller profile for authenticated seller
 */
export const getCurrentSellerProfile = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller profile not found');
    }

    return {
        id: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        businessIdType: seller.metadata?.businessIdType,
        gstNumber: seller.gstNumber,
        businessAddress: seller.businessAddress,
        businessPhone: seller.businessPhone,
        ownerName: seller.ownerName,
        ownerEmail: seller.ownerEmail,
        bankAccountName: seller.bankAccountName,
        bankAccountNumber: seller.bankAccountNumber,
        bankIfscCode: seller.bankIfscCode,
        status: seller.status,
        commissionRate: seller.commissionRate,
        onboardingStep: seller.onboardingStep,
        approvedAt: seller.approvedAt,
        createdAt: seller.createdAt,
    };
};

/**
 * Change Seller Password
 * Updates seller password after validating current password
 */
export const changeSellerPassword = async (
    sellerId: string,
    currentPassword: string,
    newPassword: string,
) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, seller?.password ?? '');
        if (!isValidPassword) {
            throw new AppError('Unauthorized', 401, 'Current password is incorrect');
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword);
        const updated = await update(sellerId, { password: hashedPassword }, transaction);

        return {
            id: updated.id,
            message: 'Password changed successfully',
        };
    });
};

/**
 * Get Seller Notification Preferences
 * Returns seller's notification preference settings
 */
export const getSellerNotificationPreferences = async (sellerId: string) => {
    const seller = await findById(sellerId);
    if (!seller) {
        throw new AppError('NotFound', 404, 'Seller not found');
    }

    const preferences = seller.metadata?.notificationPreferences || {
        emailOrders: true,
        emailProducts: true,
        emailPromotions: false,
        smsAlerts: false,
    };

    return preferences;
};

/**
 * Update Seller Notification Preferences
 * Updates seller's notification preference settings
 */
export const updateSellerNotificationPreferences = async (
    sellerId: string,
    preferences: {
        emailOrders?: boolean;
        emailProducts?: boolean;
        emailPromotions?: boolean;
        smsAlerts?: boolean;
    },
) => {
    return withTransaction(async (transaction) => {
        const seller = await findById(sellerId);
        if (!seller) {
            throw new AppError('NotFound', 404, 'Seller not found');
        }

        const currentMetadata = seller.metadata || {};
        const updatedMetadata = {
            ...currentMetadata,
            notificationPreferences: {
                emailOrders: preferences.emailOrders ?? true,
                emailProducts: preferences.emailProducts ?? true,
                emailPromotions: preferences.emailPromotions ?? false,
                smsAlerts: preferences.smsAlerts ?? false,
            },
        };

        const updated = await update(sellerId, { metadata: updatedMetadata }, transaction);

        return updatedMetadata.notificationPreferences;
    });
};
