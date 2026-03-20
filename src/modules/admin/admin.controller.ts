import { Response } from 'express';
import { listAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin } from './admin.service';
import { AuthenticatedRequest } from './middleware';

export const listAdminsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admins = await listAdmins();
    res.json({ success: true, data: admins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminByIdHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await getAdminById(id);
    res.json({ success: true, data: admin });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, error: error.message });
  }
};

export const createAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }
    const admin = await createAdmin({ email, password, name, phone });
    res.status(201).json({ success: true, data: admin });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, phone, status } = req.body;
    const admin = await updateAdmin(id, { email, name, phone, status });
    res.json({ success: true, data: admin });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};

export const deleteAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await deleteAdmin(id);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, error: error.message });
  }
};
