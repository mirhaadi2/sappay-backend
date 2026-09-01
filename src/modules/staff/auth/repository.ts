import { Transaction } from 'sequelize';
import { Staff } from '../models';

export const findStaffByEmailRecord = async (email: string, transaction?: Transaction) => {
    return Staff.findOne({
        where: { email: email.toLowerCase().trim() },
        transaction,
    });
};

export const findStaffByIdRecord = async (id: string, transaction?: Transaction) => {
    return Staff.findByPk(id, { transaction });
};
