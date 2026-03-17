import crypto from 'crypto';
import { OtpType } from './otp.model';
import { createOtp, findOtpByEmail, deleteOtp, cleanupExpiredOtps } from './repository';
import { AppError } from '../../utils/AppError';
import { sendOtpToEmail as sendOtpEmail } from '../../utils/sendEmail';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpToEmail = async (email: string, type: OtpType = OtpType.REGISTRATION): Promise<string> => {
  // Clean up expired OTPs first
  await cleanupExpiredOtps();

  // Generate OTP
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store OTP in database
  await createOtp({
    email,
    code,
    type,
    expiresAt,
  });

  // Send OTP via email if email is provided
  if (email) {
    try {
      await sendOtpEmail(email, code);
      console.log(`✅ OTP sent to email: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error);
      // Don't throw error - OTP is still stored in DB
    }
  }

  // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
  // For now, we'll just log it
  console.log(`OTP for ${email}: ${code} (expires: ${expiresAt})`);

  return code; // In production, don't return the code
};

export const verifyOtp = async (email: string, code: string, type: OtpType = OtpType.REGISTRATION): Promise<boolean> => {
  const otp = await findOtpByEmail(email, type);

  if (!otp) {
    throw new AppError('ValidationError', 400, 'Invalid or expired OTP');
  }

  if (otp.expiresAt < new Date()) {
    await deleteOtp(otp.id);
    throw new AppError('ValidationError', 400, 'OTP has expired');
  }

  if (otp.code !== code) {
    throw new AppError('ValidationError', 400, 'Invalid OTP code');
  }

  // OTP is valid, delete it
  await deleteOtp(otp.id);

  return true;
};