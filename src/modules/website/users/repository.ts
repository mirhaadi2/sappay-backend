import { User, UserRole } from "../../admin/users/models";
import { Otp, OtpType } from "../../admin/users/otp.model";

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}) => {
  return User.create(data);
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
  console.log("Creating OTP:", data);

  return Otp.create(data);
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
  return Otp.destroy({ where: { id } });
};

export const cleanupExpiredOtps = async () => {
  return Otp.destroy({
    where: {
      expiresAt: {
        [require('sequelize').Op.lt]: new Date(),
      },
    },
  });
};
