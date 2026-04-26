import { Address, AddressType } from '../../admin/address/model';
import { Op } from 'sequelize';

/**
 * Find existing shipping address for customer by address details
 * Used to avoid creating duplicate addresses
 */
export const findExistingCustomerAddress = async (
    customerId: string,
    addressLine1: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
    transaction?: any
): Promise<Address | null> => {
    return Address.findOne({
        where: {
            customerId,
            addressLine1,
            city,
            state,
            postalCode: postalCode.toString(),
            country,
        },
        transaction,
    });
};

/**
 * Find default shipping address for customer
 */
export const findCustomerDefaultAddress = async (customerId: string, transaction?: any): Promise<Address | null> => {
    return Address.findOne({
        where: {
            customerId,
            isDefault: true,
        },
        transaction,
    });
};

/**
 * Find all shipping addresses for customer
 */
export const findCustomerAddresses = async (customerId: string, transaction?: any): Promise<Address[]> => {
    return Address.findAll({
        where: { customerId },
        order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
        transaction,
    });
};

/**
 * Create new shipping address for customer
 */
export const createCustomerAddress = async (
    customerId: string,
    addressData: {
        name?: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        type?: AddressType;
        isDefault?: boolean;
    },
    transaction?: any
): Promise<Address> => {
    // If this is the first address, make it default
    const existingCount = await Address.count({
        where: { customerId },
        transaction,
    });

    const isDefault = addressData.isDefault ?? (existingCount === 0);

    // If making this default, unset other defaults
    if (isDefault) {
        await Address.update(
            { isDefault: false },
            {
                where: {
                    customerId,
                    isDefault: true,
                },
                transaction,
            }
        );
    }

    const address = await Address.create({
        customerId,
        name: addressData.name,
        phone: addressData.phone,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode.toString(),
        country: addressData.country,
        type: addressData.type || AddressType.HOME,
        isDefault,
    }, { transaction });

    return address;
};

/**
 * Find or create shipping address for customer
 * Returns existing address if found, otherwise creates new one
 */
export const findOrCreateCustomerAddress = async (
    customerId: string,
    addressData: {
        name?: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    },
    transaction?: any
): Promise<Address> => {
    // Try to find existing address
    const existing = await findExistingCustomerAddress(
        customerId,
        addressData.addressLine1,
        addressData.city,
        addressData.state,
        addressData.postalCode,
        addressData.country,
        transaction
    );

    if (existing) {
        return existing;
    }

    // Create new address
    return createCustomerAddress(customerId, addressData, transaction);
};

/**
 * Update shipping address
 */
export const updateCustomerAddress = async (
    addressId: string,
    customerId: string,
    addressData: Partial<{
        name?: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
    }>,
    transaction?: any
): Promise<Address> => {
    const address = await Address.findOne({
        where: {
            id: addressId,
            customerId,
        },
        transaction,
    });

    if (!address) {
        throw new Error(`Address ${addressId} not found for customer ${customerId}`);
    }

    // If making this default, unset other defaults
    if (addressData.isDefault === true) {
        await Address.update(
            { isDefault: false },
            {
                where: {
                    customerId,
                    isDefault: true,
                },
                transaction,
            }
        );
    }

    await address.update(addressData, { transaction });
    return address;
};
