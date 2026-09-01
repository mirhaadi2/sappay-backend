import { Transaction } from 'sequelize';
import { Admin } from '../admin.model';
import { Staff } from '../../staff/models';

export const findAdminByEmailRecord = async (email: string, transaction?: Transaction) => {
    return Admin.findOne({
        where: { email: email.toLowerCase().trim() },
        raw: true,
        transaction,
    });
};

export const findAdminByIdRecord = async (id: string, transaction?: Transaction) => {
    return Admin.findByPk(id, { transaction });
};

export const findStaffByEmailRecord = async (email: string, transaction?: Transaction) => {
    return Staff.findOne({
        where: { email: email.toLowerCase().trim() },
        transaction,
    });
};
