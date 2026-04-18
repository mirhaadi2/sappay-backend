import { Address, AddressType } from "../../admin/address/model";
import { Op } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import logger from "../../../utils/logger";

export const create = async (addressData: {
  customerId: string;
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
    logger.info('Address created', { addressId: address.id, customerId: addressData.customerId });
    return address;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating address', { customerId: addressData.customerId, error });
    throw error;
  }
};

export const findByIdAndCustomerId = async (id: string, customerId: string) => {
  return await Address.findOne({
    where: { id, customerId },
  });
};

export const findAllByCustomerId = async (customerId: string) => {
  return await Address.findAll({
    where: { customerId },
    order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
  });
};

export const findDefaultByCustomerId = async (customerId: string) => {
  return await Address.findOne({
    where: { customerId, isDefault: true },
  });
};

export const update = async (
  id: string,
  customerId: string,
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
    const address = await findByIdAndCustomerId(id, customerId);
    if (!address) return null;

    const updated = await address.update(addressData, { transaction });
    await transaction.commit();
    logger.info('Address updated', { addressId: id, customerId });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating address', { addressId: id, customerId, error });
    throw error;
  }
};

export const deleteAddress = async (id: string, customerId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await findByIdAndCustomerId(id, customerId);
    if (!address) return false;

    await address.destroy({ transaction });
    await transaction.commit();
    logger.info('Address deleted', { addressId: id, customerId });
    return true;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting address', { addressId: id, customerId, error });
    throw error;
  }
};

export const setAsDefault = async (id: string, customerId: string) => {
  const transaction = await sequelize.transaction();
  try {
    await Address.update(
      { isDefault: false },
      {
        where: { customerId, isDefault: true },
        transaction
      }
    );

    const address = await findByIdAndCustomerId(id, customerId);
    if (!address) return null;

    const updated = await address.update({ isDefault: true }, { transaction });
    await transaction.commit();
    logger.info('Address set as default', { addressId: id, customerId });
    return updated;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error setting address as default', { addressId: id, customerId, error });
    throw error;
  }
};

export const deleteAllByCustomerId = async (customerId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await Address.destroy({
      where: { customerId },
      transaction
    });
    await transaction.commit();
    logger.info('All addresses deleted for user', { customerId, count: result });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting all addresses', { customerId, error });
    throw error;
  }
};

export const countByCustomerId = async (customerId: string) => {
  return await Address.count({
    where: { customerId },
  });
};
