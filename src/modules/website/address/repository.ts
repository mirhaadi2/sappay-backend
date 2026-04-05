import { Address, AddressType } from "../../admin/address/model";
import { Op } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import logger from "../../../utils/logger";

export const create = async (addressData: {
  userId: string;
  type: AddressType;
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await Address.create(
      {
        ...addressData,
        isDefault: addressData.isDefault || false,
      },
      { transaction }
    );
    await transaction.commit();
    logger.info('Address created', { addressId: address.id, userId: addressData.userId });
    return address;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating address', { userId: addressData.userId, error });
    throw error;
  }
};

export const findByIdAndUserId = async (id: string, userId: string) => {
  return await Address.findOne({
    where: { id, userId },
  });
};

export const findAllByUserId = async (userId: string) => {
  return await Address.findAll({
    where: { userId },
    order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
  });
};

export const findDefaultByUserId = async (userId: string) => {
  return await Address.findOne({
    where: { userId, isDefault: true },
  });
};

export const update = async (
  id: string,
  userId: string,
  addressData: Partial<{
    type: AddressType;
    name?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }>
) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await findByIdAndUserId(id, userId);
    if (!address) return null;

    const updated = await address.update(addressData, { transaction });
    await transaction.commit();
    logger.info('Address updated', { addressId: id, userId });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating address', { addressId: id, userId, error });
    throw error;
  }
};

export const deleteAddress = async (id: string, userId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await findByIdAndUserId(id, userId);
    if (!address) return false;

    await address.destroy({ transaction });
    await transaction.commit();
    logger.info('Address deleted', { addressId: id, userId });
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting address', { addressId: id, userId, error });
    throw error;
  }
};

export const setAsDefault = async (id: string, userId: string) => {
  const transaction = await sequelize.transaction();
  try {
    await Address.update(
      { isDefault: false },
      {
        where: { userId, isDefault: true },
        transaction
      }
    );

    const address = await findByIdAndUserId(id, userId);
    if (!address) return null;

    const updated = await address.update({ isDefault: true }, { transaction });
    await transaction.commit();
    logger.info('Address set as default', { addressId: id, userId });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error setting address as default', { addressId: id, userId, error });
    throw error;
  }
};

export const deleteAllByUserId = async (userId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await Address.destroy({
      where: { userId },
      transaction
    });
    await transaction.commit();
    logger.info('All addresses deleted for user', { userId, count: result });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting all addresses', { userId, error });
    throw error;
  }
};

export const countByUserId = async (userId: string) => {
  return await Address.count({
    where: { userId },
  });
};
