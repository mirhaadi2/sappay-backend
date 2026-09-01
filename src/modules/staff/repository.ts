import { Transaction, Op } from 'sequelize';
import { Staff } from './models';

export interface StaffListQuery {
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
    search?: string;
}

export const listStaffRecord = async (filters: StaffListQuery = {}) => {
    const { status, department, limit = 20, offset = 0, search } = filters;

    const where: any = {
        deletedAt: null,
    };

    if (status) {
        where.status = status;
    }

    if (department) {
        where.department = department;
    }

    if (search) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const { count, rows } = await Staff.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        raw: true,
        attributes: { exclude: ['password'] },
    });

    return {
        staff: rows,
        total: count,
        limit,
        offset,
    };
};

export const getStaffByIdRecord = async (
    staffId: string,
    transaction?: Transaction,
): Promise<Staff | null> => {
    return Staff.findByPk(staffId, {
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const getStaffByEmailRecord = async (
    email: string,
    transaction?: Transaction,
): Promise<Staff | null> => {
    return Staff.findOne({
        where: { email },
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const getStaffByCredentialsRecord = async (email: string): Promise<Staff | null> => {
    return Staff.findOne({
        where: { email, status: 'active' },
    });
};

export const createStaffRecord = async (
    data: {
        email: string;
        password: string;
        name: string;
        phone?: string;
        department?: string;
        manager_id?: string;
        hire_date?: Date;
    },
    transaction?: Transaction,
) => {
    return Staff.create(
        {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone?.trim(),
            department: data.department?.trim(),
            manager_id: data.manager_id,
            hire_date: data.hire_date,
            status: 'active',
        },
        { transaction },
    );
};

export const updateStaffRecord = async (
    staffId: string,
    data: {
        email?: string;
        name?: string;
        phone?: string;
        department?: string;
        manager_id?: string;
        hire_date?: Date;
    },
    transaction?: Transaction,
): Promise<Staff | null> => {
    const staff = await Staff.findByPk(staffId, { transaction });
    if (!staff) return null;

    if (data.email !== undefined) staff.email = data.email;
    if (data.name !== undefined) staff.name = data.name;
    if (data.phone !== undefined) staff.phone = data.phone?.trim();
    if (data.department !== undefined) staff.department = data.department?.trim();
    if (data.manager_id !== undefined) staff.manager_id = data.manager_id;
    if (data.hire_date !== undefined) staff.hire_date = data.hire_date;

    await staff.save({ transaction });
    return staff;
};

export const suspendStaffRecord = async (
    staffId: string,
    transaction?: Transaction,
): Promise<Staff | null> => {
    const staff = await Staff.findByPk(staffId, { transaction });
    if (!staff) return null;

    staff.status = 'suspended';
    await staff.save({ transaction });
    return staff;
};

export const activateStaffRecord = async (
    staffId: string,
    transaction?: Transaction,
): Promise<Staff | null> => {
    const staff = await Staff.findByPk(staffId, { transaction });
    if (!staff) return null;

    staff.status = 'active';
    await staff.save({ transaction });
    return staff;
};

export const deleteStaffRecord = async (
    staffId: string,
    transaction?: Transaction,
): Promise<Staff | null> => {
    const staff = await Staff.findByPk(staffId, { transaction });
    if (!staff) return null;

    await staff.destroy({ transaction });
    return staff;
};
