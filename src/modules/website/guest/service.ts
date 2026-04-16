import logger from '../../../utils/logger';
import { config } from '../../../config';
import * as jwt from 'jsonwebtoken';
import { SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, GuestCheckoutData } from './types';
import { redisClient as baseRedisClient } from '../../../config/session';
import { AppError } from '../../../utils/AppError';
import { awsSNSService, emailService, whatsappService } from '../../notifications';
import { findCustomerByEmail, findCustomerByPhone, findCustomerByWhatsapp } from '../guests/customer.service';
import { findCustomerAddresses } from '../orders/shipping-address.repository';
import Order from '../../admin/orders/order.model';

// Type-safe Redis client
const redisClient = baseRedisClient as any;

const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 5;

// Helper functions
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateContact = (contact: string, contactType: string): void => {
  switch (contactType) {
    case 'email':
      if (!isValidEmail(contact)) {
        throw new AppError('InvalidEmail', 400, 'Invalid email format');
      }
      break;
    case 'phone':
      if (!isValidPhone(contact)) {
        throw new AppError('InvalidPhone', 400, 'Invalid phone number format');
      }
      break;
    case 'whatsapp':
      if (!isValidPhone(contact)) {
        throw new AppError('InvalidWhatsApp', 400, 'Invalid WhatsApp number format');
      }
      break;
    default:
      throw new AppError('InvalidContactType', 400, 'Invalid contact type');
  }
};

const maskContact = (contact: string, type: string): string => {
  if (type === 'email') {
    const [local, domain] = contact.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
  return `***${contact.substring(contact.length - 4)}`;
};

const generateGuestToken = (contact: string, contactType: string): string => {
  const payload = {
    contact,
    contactType,
    isGuest: true,
    iat: Date.now(),
  };

  return jwt.sign(payload, config.jwt.secret || 'change_me', {
    expiresIn: '1h',
  });
};

const sendOTPViaChannel = async (contact: string, contactType: string, otp: string): Promise<void> => {
  const otpMessage = `Your OTP for checkout is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  const htmlContent = `<p>Your OTP for checkout is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p><p>Do not share this with anyone.</p>`;
  const activeChannel = config.notificationChannel?.toLowerCase() || 'email';

  try {
    switch (activeChannel) {
      case 'email': {
        if (contactType !== 'email') {
          throw new AppError('ChannelMismatch', 400, 'Email channel requires email contact type');
        }
        logger.info('[EMAIL] Sending OTP', { recipient: maskContact(contact, 'email') });
        await emailService.sendEmail(contact, 'Your OTP Code for Checkout', htmlContent, otpMessage);
        break;
      }

      case 'sms': {
        if (contactType !== 'phone') {
          throw new AppError('ChannelMismatch', 400, 'SMS channel requires phone contact type');
        }
        logger.info('[SMS] Sending OTP', { recipient: maskContact(contact, 'phone') });
        await awsSNSService.sendSMS(contact, otpMessage);
        break;
      }

      case 'whatsapp': {
        if (contactType !== 'whatsapp') {
          throw new AppError('ChannelMismatch', 400, 'WhatsApp channel requires whatsapp contact type');
        }
        logger.info('[WHATSAPP] Sending OTP', { recipient: maskContact(contact, 'whatsapp') });
        await whatsappService.sendMessage(contact, otpMessage);
        break;
      }

      default:
        throw new AppError('UnsupportedChannel', 400, `Unsupported notification channel: ${activeChannel}`);
    }
  } catch (error) {
    logger.error('✗ Failed to send OTP via channel', { channel: activeChannel, error });
    throw new AppError('OTPSendFailed', 500, `Failed to send OTP via ${activeChannel}. Please try again.`);
  }
};

export const findCustomerByContact = async (
  contact: string,
  contactType: 'email' | 'phone' | 'whatsapp'
): Promise<{ customer: any | null; addresses: any[]; orderCount: number }> => {
  validateContact(contact, contactType);

  let customer = null;

  if (contactType === 'email') {
    customer = await findCustomerByEmail(contact);
  } else if (contactType === 'phone') {
    customer = await findCustomerByPhone(contact);
  } else if (contactType === 'whatsapp') {
    customer = await findCustomerByWhatsapp(contact);
  }

  if (!customer) {
    return { customer: null, addresses: [], orderCount: 0 };
  }

  const addresses = await findCustomerAddresses(customer.id);
  const orderCount = await Order.count({ where: { customerId: customer.id } });

  return {
    customer,
    addresses,
    orderCount,
  };
};

/**
 * Send OTP to contact
 */
export const sendOTP = async (request: SendOTPRequest): Promise<SendOTPResponse> => {
  try {
    const { contact, contactType } = request;

    // Validate contact format
    validateContact(contact, contactType);

    // Check if OTP already sent recently (cooldown)
    const cooldownKey = `otp:cooldown:${contact}`;
    const existingOtp = await redisClient.get(cooldownKey);
    if (existingOtp) {
      throw new AppError('OTPCooldownActive', 429, 'OTP already sent. Please wait 1 minute before requesting again.');
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `otp:${contact}`;
    const attemptsKey = `otp:attempts:${contact}`;

    // Store OTP in Redis with proper redis v5 API
    await redisClient.set(otpKey, otp, { EX: OTP_EXPIRY });
    await redisClient.set(attemptsKey, '0', { EX: OTP_EXPIRY });
    await redisClient.set(cooldownKey, '1', { EX: 60 });

    // Send OTP via configured notification channel
    await sendOTPViaChannel(contact, contactType, otp);

    logger.info(`✓ OTP sent to ${contactType}: ${maskContact(contact, contactType)}`, {
      contactType,
    });

    return {
      success: true,
      message: `OTP sent to your ${contactType}. Valid for 10 minutes.`,
      expiresIn: OTP_EXPIRY,
    };
  } catch (error) {
    logger.error('✗ Failed to send OTP', { error });
    throw error;
  }
};

/**
 * Verify OTP and return guest token
 */
export const verifyOTP = async (request: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    const { contact, contactType, otp } = request;

    // Validate OTP format
    if (!otp || otp.length !== OTP_LENGTH) {
      throw new AppError('InvalidOTPFormat', 400, `OTP must be ${OTP_LENGTH} digits`);
    }

    const otpKey = `otp:${contact}`;
    const attemptsKey = `otp:attempts:${contact}`;

    // Check attempts
    const attempts = await redisClient.get(attemptsKey);
    if (attempts && parseInt(attempts as string) >= MAX_OTP_ATTEMPTS) {
      await redisClient.del(otpKey);
      throw new AppError('MaxAttemptsExceeded', 429, 'Maximum OTP verification attempts exceeded. Request a new OTP.');
    }

    // Get stored OTP
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp) {
      throw new AppError('OTPNotFound', 400, 'OTP expired or not found. Please request a new OTP.');
    }

    // Verify OTP
    if (storedOtp !== otp) {
      const newAttempts = attempts ? parseInt(attempts as string) + 1 : 1;
      await redisClient.set(attemptsKey, newAttempts.toString(), { EX: OTP_EXPIRY });
      throw new AppError('InvalidOTP', 401, `Invalid OTP. ${MAX_OTP_ATTEMPTS - newAttempts} attempts remaining.`);
    }

    // OTP verified - generate guest token
    const guestToken = generateGuestToken(contact, contactType);

    // Clean up
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
    await redisClient.del(`otp:cooldown:${contact}`);

    logger.info(`✓ OTP verified for ${maskContact(contact, contactType)}`, {
      contactType,
    });

    return {
      success: true,
      guestToken,
      message: 'OTP verified successfully. You can now proceed to checkout.',
    };
  } catch (error) {
    logger.error('✗ OTP verification failed', { error });
    throw error;
  }
};

/**
 * Verify guest token from checkout requests
 */
export const verifyGuestToken = async (token: string): Promise<GuestCheckoutData> => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret || 'change_me') as any;

    if (!decoded.isGuest || !decoded.contact || !decoded.contactType) {
      throw new AppError('InvalidGuestToken', 401, 'Invalid guest token');
    }

    return {
      contact: decoded.contact,
      contactType: decoded.contactType,
      isGuest: true,
    };
  } catch (error) {
    logger.error('✗ Guest token verification failed', { error });
    throw new AppError('InvalidGuestToken', 401, 'Invalid or expired guest token');
  }
};

