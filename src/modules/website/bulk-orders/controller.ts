import { Request, Response } from 'express';
import { sequelize } from '../../../db/sequelize';
import { sendEmail } from '../../../utils/sendEmail';
import { config } from '../../../config';

interface BulkOrderRequest {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    product: string;
    estimatedQuantity: string;
    additionalRequirements?: string;
}

export const submitBulkOrderHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { companyName, contactPerson, phone, email, product, estimatedQuantity, additionalRequirements } = req.body as BulkOrderRequest;

        // Validation
        if (!companyName?.trim() || !contactPerson?.trim() || !phone?.trim() || !email?.trim() || !product?.trim() || !estimatedQuantity?.trim()) {
            res.status(400).json({ success: false, error: 'All required fields must be filled' });
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ success: false, error: 'Invalid email format' });
            return;
        }

        // Phone validation (basic - at least 10 digits)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            res.status(400).json({ success: false, error: 'Phone number must be at least 10 digits' });
            return;
        }

        // Save to database using raw query
        const query = `
            INSERT INTO bulk_orders (id, company_name, contact_person, phone, email, product, estimated_quantity, additional_requirements, status, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW())
            RETURNING id, company_name, contact_person, email, created_at
        `;

        const result = await sequelize.query(query, {
            bind: [companyName, contactPerson, phone, email, product, estimatedQuantity, additionalRequirements || ''],
            type: 'INSERT',
        });

        const bulkOrderId = (result[0] as any)?.[0]?.id || 'N/A';

        // Send email notification to sales team
        const salesTeamEmail = config.email.salesTeamEmail || config.email.fromEmail || 'support@sappey.com';
        const emailSubject = `🚀 New Bulk Order Inquiry from ${companyName}`;
        const emailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #8b5535;">New Bulk Order Inquiry</h2>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Contact Person:</strong> ${contactPerson}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Product/Category:</strong> ${product}</p>
                <p><strong>Estimated Quantity:</strong> ${estimatedQuantity}</p>
                <p><strong>Additional Requirements:</strong> ${additionalRequirements || 'None'}</p>
                <p><strong>Order ID:</strong> ${bulkOrderId}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
                <p style="font-weight: bold; color: #d97706;">⏰ Please follow up with this lead as soon as possible while they are interested!</p>
            </div>
        `;

        // Send email (non-blocking - don't wait for response)
        sendEmail({
            to: salesTeamEmail,
            subject: emailSubject,
            html: emailBody,
        }).catch((err: any) => {
            console.error('Failed to send bulk order email notification:', err);
        });

        // Send confirmation email to customer
        const customerEmailSubject = '✓ Your Bulk Order Inquiry Received - Sappey';
        const customerEmailBody = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #8b5535;">Thank You for Your Bulk Order Inquiry</h2>
                <p>Dear ${contactPerson},</p>
                <p>We have received your bulk order inquiry for <strong>${product}</strong> (Quantity: ${estimatedQuantity}).</p>
                <p>Our dedicated sales team will review your request and contact you at <strong>${phone}</strong> or <strong>${email}</strong> within <strong>24 business hours</strong>.</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #8b5535;">
                    <strong>Order Reference ID:</strong> ${bulkOrderId}
                </p>
                <p>Thank you for choosing Sappey for your wholesale needs.</p>
                <p>Best regards,<br><strong>The Sappey Team</strong></p>
            </div>
        `;

        sendEmail({
            to: email,
            subject: customerEmailSubject,
            html: customerEmailBody,
        }).catch((err: any) => {
            console.error('Failed to send customer confirmation email:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Bulk order submitted successfully. Our sales team will contact you shortly.',
            bulkOrderId,
        });
    } catch (error) {
        console.error('Error submitting bulk order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit bulk order. Please try again later.',
        });
    }
};

export const getBulkOrdersHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT id, company_name, contact_person, email, phone, product, estimated_quantity, status, created_at
            FROM bulk_orders
            ORDER BY created_at DESC
            LIMIT 100
        `;

        const result = await sequelize.query(query, { type: 'SELECT' });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching bulk orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bulk orders',
        });
    }
};
