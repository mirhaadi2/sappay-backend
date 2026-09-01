import crypto from 'crypto';
import { OtpType } from '../../admin/customers/otp.model';
import { createOtp, findOtpByContact, deleteOtp, cleanupExpiredOtps } from './repository';
import { AppError } from '../../../utils/AppError';
import { awsSNSService, emailService, whatsappService } from '../../notifications';
import { sendEmail } from '../../../utils/sendEmail';
import { verificationOtpTemplate } from '../../templates/VerificationOtpTemplate';

export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpToEmail = async (
    email: string,
    type: OtpType = OtpType.REGISTRATION,
): Promise<string> => {
    return sendOtp(email, 'email', type);
};

export const sendOtp = async (
    contact: string,
    contactType: 'email' | 'phone' | 'whatsapp',
    type: OtpType = OtpType.REGISTRATION,
): Promise<string> => {
    // Clean up expired OTPs first
    await cleanupExpiredOtps();

    // Generate OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await createOtp({
        contact,
        contactType,
        code,
        type,
        expiresAt,
    });

    // Send OTP via appropriate channel
    const otpMessage = `Your OTP code is: ${code}. Valid for 10 minutes.`;

    try {
        switch (contactType) {
            case 'email':
                await sendEmail({
                    to: contact,
                    subject: 'Your Sappey Verification Code',
                    html: verificationOtpTemplate(code),
                    text: otpMessage,
                });
                console.log(`✅ OTP sent to email: ${contact}`);
                break;
            case 'phone':
                await awsSNSService.sendSMS(contact, otpMessage);
                console.log(`✅ OTP sent to phone: ${contact}`);
                break;
            case 'whatsapp':
                await whatsappService.sendMessage(contact, otpMessage);
                console.log(`✅ OTP sent to WhatsApp: ${contact}`);
                break;
            default:
                throw new AppError(
                    'UnsupportedContactType',
                    400,
                    `Unsupported contact type: ${contactType}`,
                );
        }
    } catch (error) {
        console.error(`❌ Failed to send OTP to ${contactType}: ${contact}:`, error);
        // Don't throw error - OTP is still stored in DB
    }

    return code; // In production, don't return the code
};

export const verifyOtp = async (
    contact: string,
    contactType: 'email' | 'phone' | 'whatsapp',
    code: string,
    type: OtpType = OtpType.REGISTRATION,
): Promise<boolean> => {
    const otp = await findOtpByContact(contact, contactType, type);
    console.log(otp, 'otp');

    if (!otp) {
        throw new AppError('ValidationError', 400, 'Invalid or expired OTP');
    }

    if ((otp?.expiresAt || otp?.dataValues?.expiresAt) < new Date()) {
        await deleteOtp(otp?.id || otp?.dataValues?.id);
        throw new AppError('ValidationError', 400, 'OTP has expired');
    }

    if ((otp?.code || otp?.dataValues?.code) !== code) {
        throw new AppError('ValidationError', 400, 'Invalid OTP code');
    }

    // OTP is valid, delete it
    await deleteOtp(otp?.id || otp?.dataValues?.id);

    return true;
};
