import { User, UserRole } from "../../admin/customers/models";
import { Otp, OtpType } from "../../admin/customers/otp.model";
import { sequelize } from '../../../db/sequelize';
import logger from '../../../utils/logger';

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.create(data, { transaction });
    await transaction.commit();
    logger.info('User created', { userId: user.id, email: data.email });
    return user;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating user', { email: data.email, error });
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  return User.findOne({ where: { email } });
};

export const findUserByPhone = async (phone: string) => {
  return User.findOne({ where: { phone } });
};

export const findUserById = async (id: string) => {
  return User.findByPk(id);
};

// OTP functions
export const createOtp = async (data: {
  email: string;
  code: string;
  type: OtpType;
  expiresAt: Date;
}) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Creating OTP:", data);
    const otp = await Otp.create(data, { transaction });
    await transaction.commit();
    logger.info('OTP created', { email: data.email, type: data.type });
    return otp;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating OTP', { email: data.email, error });
    throw error;
  }
};

export const findOtpByEmail = async (email: string, type: OtpType) => {
  return Otp.findOne({
    where: {
      email,
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
