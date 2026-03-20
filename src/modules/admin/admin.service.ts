import { Admin } from './admin.model';
import bcrypt from 'bcrypt';
import { sequelize } from '../../db/sequelize';

export const listAdmins = async () => {
  return Admin.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
  });
};

export const getAdminById = async (id: string) => {
  const admin = await Admin.findByPk(id, {
    attributes: { exclude: ['password'] },
  });
  if (!admin) throw new Error('Admin not found');
  return admin;
};

export const createAdmin = async (data: { email: string; password: string; name?: string; phone?: string; status?: string }) => {
  const transaction = await sequelize.transaction();
  try {
    const existing = await Admin.findOne({ where: { email: data.email } });
    if (existing) throw new Error('Admin with this email already exists');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = await Admin.create({
      ...data,
      password: hashedPassword,
      status: data.status as any ?? 'active',
    }, { transaction });
    await transaction.commit();
    const result = admin.toJSON();
    delete (result as any).password;
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateAdmin = async (id: string, data: { email?: string; name?: string; phone?: string; status?: string }) => {
  const transaction = await sequelize.transaction();
  try {
    const admin = await Admin.findByPk(id, { transaction });
    if (!admin) throw new Error('Admin not found');
    if (data.email && data.email !== admin.email) {
      const existing = await Admin.findOne({ where: { email: data.email } });
      if (existing) throw new Error('Admin with this email already exists');
    }
    if (data.email !== undefined) admin.email = data.email;
    if (data.name !== undefined) admin.name = data.name;
    if (data.phone !== undefined) admin.phone = data.phone;
    if (data.status !== undefined) admin.status = data.status as any ?? 'active';
    await admin.save({ transaction });
    await transaction.commit();
    const result = admin.toJSON();
    delete (result as any).password;
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteAdmin = async (id: string) => {
  const transaction = await sequelize.transaction();
  try {
    const admin = await Admin.findByPk(id, { transaction });
    if (!admin) throw new Error('Admin not found');
    await admin.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
