/**
 * Staff Controller
 * HTTP request handlers for staff operations
 */

import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../admin/middleware';
import { StaffCreateDTO, StaffUpdateDTO, StaffListFilters } from './types';
import { activateStaff, createStaff, deleteStaff, getStaffById, listStaff, suspendStaff, updateStaff } from './service';
import { AppError } from '../../utils/AppError';

/**
 * GET /staff
 * List all staff members with pagination and filters
 */
export const listStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { status, department, limit, offset, search } = req.query;
        const filters: StaffListFilters = {
            status: (status as any) || undefined,
            department: (department as any) || undefined,
            limit: limit ? parseInt(limit as string) : 20,
            offset: offset ? parseInt(offset as string) : 0,
            search: (search as any) || undefined,
        };
        const result = await listStaff(filters);
        res.json({
            success: true,
            data: result.staff,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
            },
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * GET /staff/:id
 * Get specific staff member details
 */
export const getStaffByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const staff = await getStaffById(id);
        res.json({
            success: true,
            data: staff,
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * POST /staff
 * Create new staff member
 */
export const createStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, phone, department, manager_id, hire_date }: StaffCreateDTO = req.body;
        if (!email || !password || !name) {
            throw new AppError('ValidationError', 400, 'Missing required fields: email, password, name');
        }
        if (password.length < 8) {
            throw new AppError('ValidationError', 400, 'Password must be at least 8 characters long');
        }
        const staff = await createStaff({
            email,
            password,
            name,
            phone,
            department,
            manager_id,
            hire_date,
        });
        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: staff,
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * PATCH /staff/:id
 * Update staff member information
 */
export const updateStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { email, name, phone, department, manager_id, hire_date }: StaffUpdateDTO = req.body;
        if (!email && !name && !phone && !department && manager_id === undefined && !hire_date) {
            throw new AppError('ValidationError', 400, 'At least one field must be provided for update');
        }
        const staff = await updateStaff(id, {
            email,
            name,
            phone,
            department,
            manager_id,
            hire_date,
        });
        res.json({
            success: true,
            message: 'Staff member updated successfully',
            data: staff,
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * POST /staff/:id/suspend
 * Suspend staff member (deactivate access)
 */
export const suspendStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const staff = await suspendStaff(id);
        res.json({
            success: true,
            message: 'Staff member suspended successfully',
            data: staff,
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * POST /staff/:id/activate
 * Activate staff member
 */
export const activateStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const staff = await activateStaff(id);
        res.json({
            success: true,
            message: 'Staff member activated successfully',
            data: staff,
        });
    } catch (error: any) {
        next(error);
    }
};

/**
 * DELETE /staff/:id
 * Delete staff member (soft delete)
 */
export const deleteStaffHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await deleteStaff(id);
        res.json({
            success: true,
            message: 'Staff member deleted successfully',
        });
    } catch (error: any) {
        next(error);
    }
};
