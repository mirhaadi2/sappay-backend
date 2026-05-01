import { Router, Request, Response, NextFunction } from 'express';
import { generateOtp } from '../customers/otp.service';
import { OtpType } from '../../admin/customers/otp.model';
import { AppError } from '../../../utils/AppError';
// import { sendOtpToPhone } from '../../../utils/sendSms';
import { sendOtpToEmail as sendOtpViaEmail } from '../../../utils/sendEmail';
import { signJwt } from '../../../config/jwt';
import logger from '../../../utils/logger';

const router = Router();

/**
 * POST /api/website/guest/send-otp
 * Send OTP to email, phone, or WhatsApp for guest checkout verification
 */
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contact, type } = req.body;

    if (!contact || !type || !['email', 'phone', 'whatsapp'].includes(type)) {
      throw new AppError(
        'ValidationError',
        400,
        'Invalid request. Provide contact and type (email|phone|whatsapp)'
      );
    }

    // Rate limiting: prevent multiple OTP requests within 30 seconds
    const sessionData = req.session as any;
    if (sessionData?.lastOtpSent) {
      const timeSinceLastOtp = Date.now() - sessionData.lastOtpSent.timestamp;
      if (timeSinceLastOtp < 30000) {
        throw new AppError(
          'TooManyRequests',
          429,
          `Please wait ${Math.ceil((30000 - timeSinceLastOtp) / 1000)} seconds before requesting another OTP`
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Send OTP via appropriate channel
    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
        throw new AppError('ValidationError', 400, 'Invalid email address');
      }
      await sendOtpViaEmail(contact, otp);
      logger.info('OTP sent to email', { email: contact });
    } else if (type === 'phone' || type === 'whatsapp') {
      if (!/^\d{10}$/.test(contact.replace(/\D/g, ''))) {
        throw new AppError('ValidationError', 400, 'Invalid phone number');
      }
      // For now, just log it. In production, integrate with SMS service
      // TODO: Integrate with Twilio or AWS SNS
      logger.info(`OTP sent to ${type}`, { contact, otp });
      console.log(`📱 [${type.toUpperCase()}] OTP for ${contact}: ${otp}`);
    }

    // Store OTP in session for verification
    if (!req.session) {
      (req as any).session = {};
    }
    ((req as any).session).lastOtpSent = {
      contact,
      type: type as 'email' | 'phone' | 'whatsapp',
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      message: `OTP sent to ${type}`,
      data: {
        contact,
        type,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/website/guest/verify-otp
 * Verify OTP and return guest token for checkout
 */
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contact, otp, type } = req.body;

    if (!contact || !otp || !type) {
      throw new AppError('ValidationError', 400, 'Missing required fields: contact, otp, type');
    }

    // For development: accept test OTP '000000'
    if (otp !== '000000') {
      // In production, verify against database
      // For now, we'll just accept the OTP
      // await verifyOtp(contact, otp, OtpType.CHECKOUT);
    }

    logger.info('OTP verified for guest checkout', { contact, type });

    // Generate guest token for authentication
    const guestToken = signJwt({
      isGuest: true,
      contact,
      contactType: type,
      iat: Math.floor(Date.now() / 1000),
    });

    // Store verified guest info in session
    if (!req.session) {
      (req as any).session = {};
    }
    ((req as any).session).guestCheckout = {
      contact,
      type,
      verifiedAt: new Date(),
    };

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true,
        contact,
        type,
        guestToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
