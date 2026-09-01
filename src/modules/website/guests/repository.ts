import { Transaction } from 'sequelize';
import { Customer } from './customer.model';
import { Order } from '../../admin/orders/order.model';
import logger from '../../../utils/logger';

export const findCustomerByEmailRecord = async (email: string, transaction?: Transaction) => {
    return Customer.findOne({ where: { email }, transaction });
};

export const findCustomerByPhoneRecord = async (phone: string, transaction?: Transaction) => {
    return Customer.findOne({ where: { phone }, transaction });
};

export const findCustomerByWhatsappRecord = async (whatsapp: string, transaction?: Transaction) => {
    return Customer.findOne({ where: { whatsapp }, transaction });
};

export const findCustomerByIdRecord = async (id: string, transaction?: Transaction) => {
    return Customer.findByPk(id, { transaction });
};

export const markCustomerVerifiedRecord = async (customerId: string) => {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }
    return customer;
};

export const countCustomerOrdersRecord = async (customerId: string) => {
    return Order.count({
        where: { customerId },
    });
};

export const getOrCreateCustomerRecord = async (
    email?: string,
    phone?: string,
    whatsapp?: string,
    name?: string,
    transaction?: Transaction,
): Promise<string> => {
    try {
        if (email) {
            const existingByEmail = await findCustomerByEmailRecord(email, transaction);
            if (existingByEmail) {
                logger.info('Customer found by email', {
                    email,
                    customerId: existingByEmail.id,
                });
                return existingByEmail.id;
            }
        }

        if (phone) {
            const existingByPhone = await findCustomerByPhoneRecord(phone, transaction);
            if (existingByPhone) {
                logger.info('Customer found by phone', {
                    phone,
                    customerId: existingByPhone.id,
                });
                return existingByPhone.id;
            }
        }

        if (whatsapp) {
            const existingByWhatsapp = await findCustomerByWhatsappRecord(whatsapp, transaction);
            if (existingByWhatsapp) {
                logger.info('Customer found by whatsapp', {
                    whatsapp,
                    customerId: existingByWhatsapp.id,
                });
                return existingByWhatsapp.id;
            }
        }

        const customer = await Customer.create(
            {
                email: email || undefined,
                phone: phone || undefined,
                whatsapp: whatsapp || undefined,
                name: name || undefined,
                role: 'D2C_CUSTOMER',
            },
            { transaction },
        );

        logger.info('New customer created', {
            customerId: customer?.id || customer?.dataValues?.id,
            email,
            phone,
            whatsapp,
        });
        return customer?.id || customer?.dataValues?.id;
    } catch (error) {
        logger.error('Error getting or creating customer', {
            error,
            email,
            phone,
            whatsapp,
        });
        throw error;
    }
};
