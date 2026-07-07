import { Transaction } from 'sequelize';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import { Farmer, FarmerStatus } from './model';
import { FarmerBankDetails } from './bank-details/model';
import { FarmerProduct } from './products/model';

export const create = async (payload: {
    fullName: string;
    mobileNumber: string;
    email?: string | null;
    village: string;
    district: string;
    aadhaarNumber?: string | null;
    password?: string | null;
    status?: FarmerStatus;
    metadata?: Record<string, any>;
}, transaction?: Transaction) => {
    const farmer = await Farmer.create(payload, { transaction });
    logger.info('Farmer created', { farmerId: farmer.id, mobileNumber: payload.mobileNumber });
    return farmer;
};

export const createBankDetails = async (farmerId: string, payload: {
    accountHolderName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    bankName?: string | null;
}, transaction?: Transaction) => {
    const existing = await FarmerBankDetails.findOne({ where: { farmerId }, transaction });
    if (existing) {
        await existing.update(payload, { transaction });
        return existing;
    }

    try {
        const bankDetails = await FarmerBankDetails.create({ farmerId, ...payload }, { transaction });
        logger.info('Farmer bank details created', { farmerId });
        return bankDetails;
    } catch (err) {
        logger.error('Failed to create farmer bank details', { farmerId, error: err });
        throw err;
    }
};

export const createProduct = async (farmerId: string, payload: {
    name: string;
    category?: string;
    unit?: string;
    pricePerUnit?: number | null;
    description?: string | null;
    isActive?: boolean;
}, transaction?: Transaction) => {
    const product = await FarmerProduct.create({
        farmerId,
        name: payload.name,
        category: payload.category || 'general',
        unit: payload.unit || 'kg',
        pricePerUnit: payload.pricePerUnit ?? null,
        description: payload.description || null,
        isActive: payload.isActive ?? true,
    }, { transaction });

    logger.info('Farmer product created', { farmerId, productName: payload.name });
    return product;
};

export const findById = async (farmerId: string, transaction?: Transaction) => {
    return Farmer.findByPk(farmerId, { transaction });
};

export const findByMobile = async (mobileNumber: string) => {
    return Farmer.findOne({ where: { mobileNumber }, paranoid: true, raw: true });
};

export const findByEmail = async (email: string) => {
    return Farmer.findOne({ where: { email }, paranoid: true, raw: true });
};

export const findAll = async (filters: { status?: string; limit?: number; offset?: number; sortBy?: string } = {}) => {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const order: any[] = [];
    if (filters.sortBy === 'recent') order.push(['createdAt', 'DESC']);

    return Farmer.findAndCountAll({ where, limit, offset, order: order.length ? order : undefined, paranoid: true });
};

export const update = async (farmerId: string, data: Partial<any>, transaction?: Transaction) => {
    const farmer = await Farmer.findByPk(farmerId, { transaction });
    if (!farmer) throw new AppError('NotFound', 404, 'Farmer not found');
    const updated = await farmer.update(data, { transaction });
    logger.info('Farmer updated', { farmerId });
    return updated;
};

export const deleteFarmer = async (farmerId: string, transaction?: Transaction) => {
    const farmer = await Farmer.findByPk(farmerId, { transaction });
    if (!farmer) throw new AppError('NotFound', 404, 'Farmer not found');
    await farmer.destroy({ transaction });
    logger.info('Farmer deleted', { farmerId });
};
