import { Customer } from "../guests/customer.model";
import { Otp, OtpType } from "../../admin/customers/otp.model";
import { sequelize } from "../../../db/sequelize";
import logger from "../../../utils/logger";
import { Transaction } from "sequelize";

export const createUser = async (
  data: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    role: "D2C_CUSTOMER" | "B2C_CUSTOMER";
  },
  transaction?: Transaction,
) => {
  let txn = transaction;
  const needsCommit = !transaction;

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const user = await Customer.create(data, { transaction: txn });

    if (needsCommit) {
      await txn!.commit();
    }

    logger.info("Customer created", { customerId: user.id, email: data.email });
    return user;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback().catch((rollbackError: any) => {
        logger.error("Error rolling back transaction", {
          error: rollbackError,
        });
      });
    }
    logger.error("Error creating customer", { email: data.email, error });
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

export const updateUser = async (
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
  },
  transaction?: Transaction,
) => {
  let txn = transaction;
  const needsCommit = !transaction;

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const [updatedRows] = await Customer.update(data, {
      where: { id },
      transaction: txn,
    });

    if (updatedRows === 0) {
      if (needsCommit) {
        await txn!.rollback();
      }
      return null;
    }

    const updatedUser = await Customer.findByPk(id, { transaction: txn });

    if (needsCommit) {
      await txn!.commit();
    }

    logger.info("Customer profile updated", {
      customerId: id,
      updatedFields: Object.keys(data),
    });

    return updatedUser;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback().catch((rollbackError: any) => {
        logger.error("Error rolling back transaction", {
          error: rollbackError,
        });
      });
    }
    logger.error("Error updating customer profile", { customerId: id, error });
    throw error;
  }
};

// OTP functions
export const createOtp = async (
  data: {
    contact: string;
    contactType: "email" | "phone" | "whatsapp";
    code: string;
    type: OtpType;
    expiresAt: Date;
  },
  transaction?: Transaction,
) => {
  let txn = transaction;
  const needsCommit = !transaction;

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const otp = await Otp.create(
      {
        ...data,
        email: data.contactType === "email" ? data.contact : undefined, // Backward compatibility
      },
      { transaction: txn },
    );

    if (needsCommit) {
      await txn!.commit();
    }

    logger.info("OTP created", { contact: data.contact, type: data.type });
    return otp;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback().catch((rollbackError: any) => {
        logger.error("Error rolling back transaction", {
          error: rollbackError,
        });
      });
    }
    logger.error("Error creating OTP", { contact: data.contact, error });
    throw error;
  }
};

export const findOtpByContact = async (
  contact: string,
  contactType: "email" | "phone" | "whatsapp",
  type: OtpType,
) => {
  return Otp.findOne({
    where: {
      contact,
      contactType,
      type,
    },
    order: [["createdAt", "DESC"]],
  });
};

export const deleteOtp = async (id: string, transaction?: Transaction) => {
  let txn = transaction;
  const needsCommit = !transaction;

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const result = await Otp.destroy({ where: { id }, transaction: txn });

    if (needsCommit) {
      await txn!.commit();
    }

    logger.info("OTP deleted", { otpId: id });
    return result;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback().catch((rollbackError: any) => {
        logger.error("Error rolling back transaction", {
          error: rollbackError,
        });
      });
    }
    logger.error("Error deleting OTP", { otpId: id, error });
    throw error;
  }
};

export const cleanupExpiredOtps = async (transaction?: Transaction) => {
  let txn = transaction;
  const needsCommit = !transaction;

  try {
    if (needsCommit) {
      txn = await sequelize.transaction();
    }

    const result = await Otp.destroy({
      where: {
        expiresAt: {
          [require("sequelize").Op.lt]: new Date(),
        },
      },
      transaction: txn,
    });

    if (needsCommit) {
      await txn!.commit();
    }

    logger.info("Expired OTPs cleaned up", { count: result });
    return result;
  } catch (error) {
    if (needsCommit && txn) {
      await txn.rollback().catch((rollbackError: any) => {
        logger.error("Error rolling back transaction", {
          error: rollbackError,
        });
      });
    }
    logger.error("Error cleaning up expired OTPs", { error });
    throw error;
  }
};
