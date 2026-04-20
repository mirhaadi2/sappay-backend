import { Customer } from "../guests/customer.model";
import { Otp, OtpType } from "../../admin/customers/otp.model";
import { sequelize } from '../../../db/sequelize';
import logger from '../../../utils/logger';

export const createUser = async (data: {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  role: 'D2C_CUSTOMER' | 'B2C_CUSTOMER';
}) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await Customer.create(data, { transaction });
    await transaction.commit();
    logger.info('Customer created', { customerId: user.id, email: data.email });
    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating customer', { email: data.email, error });
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  return Customer.findOne({ where: { email } });
};

export const findUserByPhone = async (phone: string) => {
  return Customer.findOne({ where: { phone } });
};

export const findUserByWhatsapp = async (whatsapp: string) => {
  return Customer.findOne({ where: { whatsapp } });
};

export const findUserById = async (id: string) => {
  return Customer.findByPk(id);
};

export const updateUser = async (id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
}) => {
  const transaction = await sequelize.transaction();
  try {
    const [updatedRows] = await Customer.update(data, {
      where: { id },
      transaction
    });

    if (updatedRows === 0) {
      await transaction.rollback();
      return null;
    }

    const updatedUser = await Customer.findByPk(id, { transaction });
    await transaction.commit();

    logger.info('Customer profile updated', {
      customerId: id,
      updatedFields: Object.keys(data)
    });

    return updatedUser;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating customer profile', { customerId: id, error });
    throw error;
  }
};

// OTP functions
export const createOtp = async (data: {
  contact: string;
  contactType: 'email' | 'phone' | 'whatsapp';
  code: string;
  type: OtpType;
  expiresAt: Date;
}) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Creating OTP:", data);
    const otp = await Otp.create({
      ...data,
      email: data.contactType === 'email' ? data.contact : undefined, // Backward compatibility
    }, { transaction });
    await transaction.commit();
    logger.info('OTP created', { contact: data.contact, type: data.type });
    return otp;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating OTP', { contact: data.contact, error });
    throw error;
  }
};

export const findOtpByContact = async (contact: string, contactType: 'email' | 'phone' | 'whatsapp', type: OtpType) => {
  return Otp.findOne({
    where: {
      contact,
      contactType,
      type,
    },
    order: [['createdAt', 'DESC']],
  });
};

export const deleteOtp = async (id: string) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await Otp.destroy({ where: { id }, transaction });
    await transaction.commit();
    logger.info('OTP deleted', { otpId: id });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting OTP', { otpId: id, error });
    throw error;
  }
};

export const cleanupExpiredOtps = async () => {
  const transaction = await sequelize.transaction();
  try {
    const result = await Otp.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date(),
        },
      },
      transaction
    });
    await transaction.commit();
    logger.info('Expired OTPs cleaned up', { count: result });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error cleaning up expired OTPs', { error });
    throw error;
  }
};
