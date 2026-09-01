import { Transaction } from 'sequelize';
import { User, UserRole } from './models';

export const findUsers = async ({
    whereClause = {},
    offset = 0,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    transaction,
}: {
    whereClause?: any;
    offset?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'email';
    sortOrder?: string;
    transaction?: Transaction;
}) => {
    return User.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        order: [[sortBy, sortOrder.toUpperCase()]],
        attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
        transaction,
    });
};

export const findUserByEmail = async (email: string, transaction?: Transaction) => {
    return User.findOne({
        where: { email },
        transaction,
    });
};

export const findUserById = async (
    id: string,
    options: { transaction?: Transaction; includePassword?: boolean } = {},
) => {
    const { transaction, includePassword = false } = options;

    return User.findByPk(id, {
        transaction,
        attributes: includePassword
            ? undefined
            : { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });
};

export const createUser = async (
    data: {
        email: string;
        password: string;
        name?: string;
        phone?: string;
        role: UserRole;
    },
    transaction?: Transaction,
) => {
    return User.create(
        {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone,
            role: data.role,
        },
        { transaction },
    );
};

export const updateUser = async (
    id: string,
    updateData: Record<string, any>,
    transaction?: Transaction,
) => {
    const user = await User.findByPk(id, { transaction });

    if (!user) {
        return null;
    }

    await user.update(updateData, { transaction });
    return user;
};

export const deleteUser = async (id: string, transaction?: Transaction) => {
    const user = await User.findByPk(id, { transaction });

    if (!user) {
        return null;
    }

    await user.destroy({ transaction });
    return true;
};
