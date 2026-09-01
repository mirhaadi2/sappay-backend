import { Transaction } from 'sequelize';
import logger from '../../../utils/logger';
import {
    countCustomerOrdersRecord,
    findCustomerByEmailRecord,
    findCustomerByIdRecord,
    findCustomerByPhoneRecord,
    findCustomerByWhatsappRecord,
    getOrCreateCustomerRecord,
    markCustomerVerifiedRecord,
} from './repository';

/**
 * Get or create customer based on contact info
 * Returns customer ID
 */
export const getOrCreateCustomer = async (
    email?: string,
    phone?: string,
    whatsapp?: string,
    name?: string,
    transaction?: Transaction,
): Promise<string> => {
    return getOrCreateCustomerRecord(email, phone, whatsapp, name, transaction);
};

/**
 * Update customer verification status
 */
export const markCustomerVerified = async (customerId: string) => {
    try {
        const customer = await markCustomerVerifiedRecord(customerId);

        logger.info('Customer marked as verified', { customerId });
        return customer;
    } catch (error) {
        logger.error('Error marking customer as verified', { error, customerId });
        throw error;
    }
};

/**
 * Find customer by email
 */
export const findCustomerByEmail = async (email: string, transaction?: Transaction) => {
    return await findCustomerByEmailRecord(email, transaction);
};

/**
 * Find customer by phone
 */
export const findCustomerByPhone = async (phone: string, transaction?: Transaction) => {
    return await findCustomerByPhoneRecord(phone, transaction);
};

/**
 * Find customer by WhatsApp
 */
export const findCustomerByWhatsapp = async (whatsapp: string, transaction?: Transaction) => {
    return await findCustomerByWhatsappRecord(whatsapp, transaction);
};

/**
 * Find customer by ID
 */
export const findCustomerById = async (id: string, transaction?: Transaction) => {
    return await findCustomerByIdRecord(id, transaction);
};
