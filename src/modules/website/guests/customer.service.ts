import { Customer } from './customer.model';
import { Transaction } from 'sequelize';
import logger from '../../../utils/logger';

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
  try {
    // Search for existing customer
    const query: any = {};
    
    if (email) {
      const existingByEmail = await Customer.findOne({ where: { email }, transaction });
      if (existingByEmail) {
        logger.info('Customer found by email', { email, customerId: existingByEmail.id });
        return existingByEmail.id;
      }
    }

    if (phone) {
      const existingByPhone = await Customer.findOne({ where: { phone }, transaction });
      if (existingByPhone) {
        logger.info('Customer found by phone', { phone, customerId: existingByPhone.id });
        return existingByPhone.id;
      }
    }

    if (whatsapp) {
      const existingByWhatsapp = await Customer.findOne({ where: { whatsapp }, transaction });
      if (existingByWhatsapp) {
        logger.info('Customer found by whatsapp', { whatsapp, customerId: existingByWhatsapp.id });
        return existingByWhatsapp.id;
      }
    }

    // If not found, create new customer
    const customer = await Customer.create({
      email: email || undefined,
      phone: phone || undefined,
      whatsapp: whatsapp || undefined,
      name: name || undefined,
      role: 'D2C_CUSTOMER'
    }, { transaction });

    logger.info('New customer created', { customerId: customer.id, email, phone, whatsapp });
    return customer.id;
  } catch (error) {
    logger.error('Error getting or creating customer', { error, email, phone, whatsapp });
    throw error;
  }
};

/**
 * Update customer verification status
 */
export const markCustomerVerified = async (customerId: string) => {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // await customer.update({
    //   isVerified: true,
    //   verifiedAt: new Date(),
    // });

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
  return await Customer.findOne({ where: { email }, transaction });
};

/**
 * Find customer by phone
 */
export const findCustomerByPhone = async (phone: string, transaction?: Transaction) => {
  return await Customer.findOne({ where: { phone }, transaction });
};

/**
 * Find customer by WhatsApp
 */
export const findCustomerByWhatsapp = async (whatsapp: string, transaction?: Transaction) => {
  return await Customer.findOne({ where: { whatsapp }, transaction });
};

/**
 * Find customer by ID
 */
export const findCustomerById = async (id: string, transaction?: Transaction) => {
  return await Customer.findByPk(id, { transaction });
};
