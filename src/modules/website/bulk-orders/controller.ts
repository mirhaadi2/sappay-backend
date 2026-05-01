import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../../../db/sequelize';
import { sendEmail } from '../../../utils/sendEmail';
import { config } from '../../../config';
import { AppError } from '../../../utils/AppError';
import { BulkOrderRequest } from './types';
import { bulkOrderInquiryTemplate } from '../../templates/BulkOrderInquiryTemplate';
import { bulkOrderCustomerTemplate } from '../../templates/BulkOrderCustomerTemplate';
import { generateBulkOrderNumber } from './utils';

export const submitBulkOrderHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { companyName, contactPerson, phone, email, product, estimatedQuantity, additionalRequirements } = req.body as BulkOrderRequest;

        // Validation
        if (!companyName?.trim() || !contactPerson?.trim() || !phone?.trim() || !email?.trim() || !product?.trim() || !estimatedQuantity?.trim()) {
            throw new AppError('ValidationError', 400, 'All required fields must be filled');
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError('ValidationError', 400, 'Invalid email format');
        }

        // Phone validation (basic - at least 10 digits)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            throw new AppError('ValidationError', 400, 'Phone number must be at least 10 digits');
        }

        // Generate bulk order number
        const bulkOrderNumber = await generateBulkOrderNumber();

        // Save to database using raw query
        const query = `
            INSERT INTO bulk_orders (id, bulk_order_number, company_name, contact_person, phone, email, product, estimated_quantity, additional_requirements, status, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
            RETURNING id, bulk_order_number, company_name, contact_person, email, created_at
        `;

        const result = await sequelize.query(query, {
            bind: [bulkOrderNumber, companyName, contactPerson, phone, email, product, estimatedQuantity, additionalRequirements || ''],
            type: 'INSERT',
        });

        const bulkOrderId = (result[0] as any)?.[0]?.id || 'N/A';
        const returnedBulkOrderNumber = (result[0] as any)?.[0]?.bulk_order_number || bulkOrderNumber;

        // Send email notification to sales team
        const salesTeamEmail = config.email.salesTeamEmail || config.email.fromEmail || 'support@sappey.com';
        const emailSubject = `🚀 New Bulk Order Inquiry from ${companyName}`;
        await sendEmail({
            to: salesTeamEmail,
            subject: emailSubject,
            html: bulkOrderInquiryTemplate({
                companyName,
                contactPerson,
                phone,
                email,
                product,
                estimatedQuantity,
                additionalRequirements,
                bulkOrderId: returnedBulkOrderNumber
            }),
            fromMailType: 'support' // Or 'sales' if you want internal leads to come from sales@sappey.com
        }).catch((err: any) => {
            console.error('Failed to send bulk order email notification:', err);
        });

        // Send confirmation email to customer
        const customerEmailSubject = '✓ Your Bulk Order Inquiry Received - Sappey';
        await sendEmail({
            to: email, // Customer's email
            subject: customerEmailSubject,
            html: bulkOrderCustomerTemplate({
                contactPerson,
                product,
                estimatedQuantity,
                bulkOrderId: returnedBulkOrderNumber,
                phone,
                email
            }),
            text: `Hello ${contactPerson}, we received your inquiry for ${product}. Ref ID: ${returnedBulkOrderNumber}.`,
            fromMailType: 'sales' // Using the sales account for B2B feel
        }).catch((err: any) => {
            console.error('Failed to send customer confirmation email:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Bulk order submitted successfully. Our sales team will contact you shortly.',
            bulkOrderId: returnedBulkOrderNumber,
        });
    } catch (error) {
        console.error('Error submitting bulk order:', error);
        next(error);
    }
};

export const getBulkOrdersHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = `
            SELECT id, bulk_order_number, company_name, contact_person, email, phone, product, estimated_quantity, status, created_at
            FROM bulk_orders
            ORDER BY created_at DESC
            LIMIT 100
        `;

        const result = await sequelize.query(query, { type: 'SELECT' });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching bulk orders:', error);
        next(error);
    }
};

export const updateBulkOrderStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            RETURNING id, bulk_order_number, company_name, contact_person, email, phone, product, estimated_quantity, status, created_at, updated_at
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
