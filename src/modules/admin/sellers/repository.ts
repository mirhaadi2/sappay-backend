import { Op, Transaction } from 'sequelize';
import { Seller, SellerStatus } from '../../sellers/model';

export const findSellers = async ({
    whereClause = {},
    offset = 0,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    transaction,
}: {
    whereClause?: any;
    offset?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'businessName';
    sortOrder?: string;
    transaction?: Transaction;
}) => {
    return Seller.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [[sortBy, sortOrder]],
        attributes: { exclude: ['password'] },
        transaction,
    });
};

export const findSellerById = async (id: string, transaction?: Transaction) => {
    return Seller.findByPk(id, {
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const findSellerByIdWithDeleted = async (id: string, transaction?: Transaction) => {
    return Seller.findByPk(id, {
        paranoid: false,
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const findSellerByEmailOrBusinessLicense = async (
    email: string,
    businessLicense: string,
    transaction?: Transaction,
) => {
    return Seller.findOne({
        where: {
            [Op.or]: [{ ownerEmail: email }, { businessRegistrationNo: businessLicense }],
        },
        transaction,
    });
};

export const findSellerByEmail = async (email: string, transaction?: Transaction) => {
    return Seller.findOne({
        where: { ownerEmail: email },
        transaction,
    });
};

export const createSeller = async (
    data: {
        businessName: string;
        businessRegistrationNo: string;
        businessType: any;
        businessAddress: string;
        businessPhone: string;
        ownerName: string;
        ownerEmail: string;
        password: string;
        bankAccountName: string;
        bankAccountNumber: string;
        bankIfscCode: string;
        commissionRate: number;
        status: SellerStatus;
        onboardingStep: number;
        metadata: Record<string, any>;
    },
    transaction?: Transaction,
) => {
    return Seller.create(
        {
            businessName: data.businessName,
            businessRegistrationNo: data.businessRegistrationNo,
            businessType: data.businessType,
            businessAddress: data.businessAddress,
            businessPhone: data.businessPhone,
            ownerName: data.ownerName,
            ownerEmail: data.ownerEmail,
            password: data.password,
            bankAccountName: data.bankAccountName,
            bankAccountNumber: data.bankAccountNumber,
            bankIfscCode: data.bankIfscCode,
            commissionRate: data.commissionRate,
            status: data.status,
            onboardingStep: data.onboardingStep,
            metadata: data.metadata,
        },
        { transaction },
    );
};

export const updateSeller = async (
    id: string,
    updateData: Record<string, any>,
    transaction?: Transaction,
) => {
    const seller = await Seller.findByPk(id, { transaction });

    if (!seller) {
        return null;
    }

    await seller.update(updateData, { transaction });
    return seller;
};

export const deleteSeller = async (id: string, transaction?: Transaction) => {
    const seller = await Seller.findByPk(id, { transaction });

    if (!seller) {
        return null;
    }

    await seller.destroy({ transaction });
    return true;
};

export const restoreSeller = async (id: string, transaction?: Transaction) => {
    const seller = await Seller.findByPk(id, { paranoid: false, transaction });

    if (!seller) {
        return null;
    }

    await seller.restore({ transaction });
    return seller;
};
