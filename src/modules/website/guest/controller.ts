import { Request, Response, NextFunction } from 'express';
import * as guestService from './service';
import { SendOTPRequest, VerifyOTPRequest } from './types';
import { config } from '../../../config';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

/**
 * Get active notification channel
 * Determines which contact field to show to guest users
 */
export const getConfigHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const channel = config.notificationChannel || 'email';

    res.json({
      success: true,
      notificationChannel: channel,
      contactType: mapChannelToContactType(channel),
      label: getContactLabel(channel),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP to guest contact
 */
export const sendOTPHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contact } = req.body;

    if (!contact || typeof contact !== 'string') {
      throw new AppError('MissingContact', 400, 'Contact is required');
    }

    // Determine contact type from .env config
    const contactType = mapChannelToContactType(config.notificationChannel);

    const otpRequest: SendOTPRequest = {
      contact: contact.trim(),
      contactType,
    };

    const result = await guestService.sendOTP(otpRequest);

    logger.info('✓ OTP send request successful', { contactType });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and return guest token
 */
export const verifyOTPHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contact, otp } = req.body;

    if (!contact || typeof contact !== 'string') {
      throw new AppError('MissingContact', 400, 'Contact is required');
    }

    if (!otp || typeof otp !== 'string') {
      throw new AppError('MissingOTP', 400, 'OTP is required');
    }

    const contactType = mapChannelToContactType(config.notificationChannel);

    const verifyRequest: VerifyOTPRequest = {
      contact: contact.trim(),
      otp: otp.trim(),
      contactType,
    };

    const result = await guestService.verifyOTP(verifyRequest);

    logger.info('✓ OTP verified successfully');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Map notification channel to contact type
 */
function mapChannelToContactType(channel: string): 'email' | 'phone' | 'whatsapp' {
  switch (channel?.toLowerCase()) {
    case 'email':
      return 'email';
    case 'sms':
      return 'phone';
    case 'whatsapp':
      return 'whatsapp';
    default:
      return 'email';
  }
}

/**
 * Helper: Get user-friendly label for contact type
 */
function getContactLabel(channel: string): string {
  switch (channel?.toLowerCase()) {
    case 'email':
      return 'Email Address';
    case 'sms':
      return 'Phone Number';
    case 'whatsapp':
      return 'WhatsApp Number';
    default:
      return 'Contact';
  }
}


// End of file
