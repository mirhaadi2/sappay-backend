import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../../../db/sequelize';
import { QueryTypes } from 'sequelize';
import { AppError } from '../../../utils/AppError';

export const adminListBulkOrdersHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        if (status && status !== 'all') {
            whereClause += ' AND status = $' + (params.length + 1);
            params.push(status);
        }

        if (search) {
            whereClause += ` AND (
                bulk_order_number ILIKE $${params.length + 1} OR
                company_name ILIKE $${params.length + 1} OR
                contact_person ILIKE $${params.length + 1} OR
                email ILIKE $${params.length + 1} OR
                product ILIKE $${params.length + 1}
            )`;
            params.push(`%${search}%`);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM bulk_orders ${whereClause}`;
        const countResult = await sequelize.query(countQuery, {
            bind: params,
            type: QueryTypes.SELECT,
        });
        const total = (countResult[0] as any).total;

        // Get paginated results
        const dataQuery = `
            SELECT
                id,
                bulk_order_number as "bulkOrderNumber",
                company_name as "companyName",
                contact_person as "contactPerson",
                email,
                phone,
                product,
                estimated_quantity as "estimatedQuantity",
                additional_requirements as "additionalRequirements",
                status,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM bulk_orders
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        params.push(Number(limit), offset);

        const result = await sequelize.query(dataQuery, {
            bind: params,
            type: QueryTypes.SELECT,
        });

        res.json({
            success: true,
            data: result,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                totalPages: Math.ceil(Number(total) / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching admin bulk orders:', error);
        next(error);
    }
};

export const adminUpdateBulkOrderStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
            throw new AppError('ValidationError', 400, 'ID and status are required');
        }

        // Validate status
        const validStatuses = ['pending', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError('ValidationError', 400, 'Invalid status');
        }

        const query = `
            UPDATE bulk_orders
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, bulk_order_number, company_name, contact_person, email, phone, product, estimated_quantity, additional_requirements, status, created_at, updated_at
        `;

        const result = await sequelize.query(query, {
            bind: [status, id],
            type: 'UPDATE',
        });

        if (!result[0] || result[0].length === 0) {
            throw new AppError('NotFoundError', 404, 'Bulk order not found');
        }

        res.json({
            success: true,
            message: 'Bulk order status updated successfully',
            data: result[0][0]
        });
    } catch (error) {
        console.error('Error updating bulk order status:', error);
        next(error);
    }
};