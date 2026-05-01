/**
 * Professional Bulk Order Confirmation (Customer Facing)
 */
export const bulkOrderCustomerTemplate = (data: {
    contactPerson: string;
    product: string;
    estimatedQuantity: string | number;
    bulkOrderId: string;
    phone: string;
    email: string;
}): string => `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="550" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        
                            <!-- Header -->
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 3px;">SAPPEY</h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">We've Received Your Inquiry</h2>
                                    <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 20px;">
                                        Dear ${data.contactPerson},
                                    </p>
                                    <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 25px;">
                                        Thank you for reaching out to Sappey. We have successfully received your bulk order inquiry for <strong>${data.product}</strong> (Quantity: ${data.estimatedQuantity}).
                                    </p>
                                    
                                    <!-- Reference ID Box -->
                                    <div style="background-color: #f8f9fa; border-left: 4px solid #8b5535; padding: 15px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #333333; font-size: 14px;">
                                            <strong>Reference ID:</strong> <span style="font-family: monospace;">${data.bulkOrderId}</span>
                                        </p>
                                    </div>

                                    <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 25px;">
                                        Our dedicated sales team is currently reviewing your requirements. You can expect a follow-up at <strong>${data.phone}</strong> or via this email address within <strong>24 business hours</strong>.
                                    </p>

                                    <hr style="border: none; border-top: 1px solid #eeeeee; margin-bottom: 25px;">

                                    <p style="color: #888888; font-size: 14px; margin-bottom: 0;">
                                        Best regards,<br>
                                        <strong style="color: #4b3832;">The Sappey Sales Team</strong>
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 25px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;">
                                    <p style="margin: 0; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        Sappey Wholesale Division • Excellence in Supply
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
`;