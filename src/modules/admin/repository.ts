import { Transaction } from 'sequelize';
import { Admin } from './admin.model';

export const findAllAdmins = async () => {
    return Admin.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
    });
};

export const findAdminById = async (id: string, transaction?: Transaction) => {
    return Admin.findByPk(id, {
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const findAdminByEmail = async (email: string, transaction?: Transaction) => {
    return Admin.findOne({
        where: { email },
        transaction,
    });
};

export const createAdminRecord = async (
    data: {
        email: string;
        password: string;
        name?: string;
        phone?: string;
        status?: string;
    },
    transaction?: Transaction,
) => {
    return Admin.create(
        {
            email: data.email,
            password: data.password,
            name: data.name?.trim(),
            phone: data.phone?.trim(),
            status: (data.status as any) ?? 'active',
        },
        { transaction },
    );
};

export const updateAdminRecord = async (
    admin: Admin,
    data: { email?: string; name?: string; phone?: string; status?: string },
    transaction?: Transaction,
) => {
    if (data.email) {
        admin.email = data.email.toLowerCase().trim();
    }

    if (data.name !== undefined) {
        admin.name = data.name?.trim();
    }

    if (data.phone !== undefined) {
        admin.phone = data.phone?.trim();
    }

    if (data.status !== undefined) {
        admin.status = data.status as any;
    }

    await admin.save({ transaction });
    return admin;
};

export const deleteAdminRecord = async (id: string, transaction?: Transaction) => {
    const admin = await Admin.findByPk(id, { transaction });

    if (!admin) {
        return null;
    }

    await admin.destroy({ transaction });
    return admin;
};
