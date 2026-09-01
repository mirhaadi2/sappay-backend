import { Address, AddressType } from '../../admin/address/model';
import { Op, Transaction } from 'sequelize';
import logger from '../../../utils/logger';

export const create = async (
    addressData: {
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
    },
    transaction?: Transaction,
) => {
    const address = await Address.create(
        {
            ...addressData,
            isDefault: addressData.isDefault || false,
        },
        { transaction },
    );
    logger.info('Address created', { addressId: address.id, customerId: addressData.customerId });
    return address;
};

export const findByIdAndCustomerId = async (
    id: string,
    customerId: string,
    transaction?: Transaction,
) => {
    return await Address.findOne({
        where: { id, customerId },
        transaction,
    });
};

export const findAllByCustomerId = async (customerId: string) => {
    return await Address.findAll({
        where: { customerId },
        order: [
            ['isDefault', 'DESC'],
            ['createdAt', 'DESC'],
        ],
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
    }>,
    transaction?: Transaction,
) => {
    const address = await findByIdAndCustomerId(id, customerId, transaction);
    if (!address) return null;

    const updated = await address.update(addressData, { transaction });
    logger.info('Address updated', { addressId: id, customerId });
    return updated;
};

export const deleteAddress = async (id: string, customerId: string, transaction?: Transaction) => {
    const address = await findByIdAndCustomerId(id, customerId, transaction);
    if (!address) return false;

    await address.destroy({ transaction });
    logger.info('Address deleted', { addressId: id, customerId });
    return true;
};

export const clearDefaultAddressesForCustomer = async (
    customerId: string,
    transaction?: Transaction,
) => {
    await Address.update(
        { isDefault: false },
        {
            where: { customerId, isDefault: true },
            transaction,
        },
    );
};

export const setAsDefault = async (id: string, customerId: string, transaction?: Transaction) => {
    await clearDefaultAddressesForCustomer(customerId, transaction);

    const address = await findByIdAndCustomerId(id, customerId, transaction);
    if (!address) return null;

    const updated = await address.update({ isDefault: true }, { transaction });
    logger.info('Address set as default', { addressId: id, customerId });
    return updated;
};

export const deleteAllByCustomerId = async (customerId: string, transaction?: Transaction) => {
    const result = await Address.destroy({
        where: { customerId },
        transaction,
    });
    logger.info('All addresses deleted for user', { customerId, count: result });
    return result;
};

export const countByCustomerId = async (customerId: string) => {
    return await Address.count({
        where: { customerId },
    });
};
