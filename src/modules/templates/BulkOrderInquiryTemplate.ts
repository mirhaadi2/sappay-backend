/**
 * Professional Bulk Order Lead Template (Internal)
 */
export const bulkOrderInquiryTemplate = (data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    product: string;
    estimatedQuantity: string | number;
    additionalRequirements?: string;
    bulkOrderId: string;
}): string => `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        
                            <!-- Header: Priority Indicator -->
                            <tr>
                                <td style="padding: 20px 30px; background-color: #8b5535; color: #ffffff;">
                                    <table width="100%">
                                        <tr>
                                            <td>
                                                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">New Bulk Lead</h1>
                                            </td>
                                            <td align="right">
                                                <span style="background-color: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                                    ID: ${data.bulkOrderId}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Main Info -->
                            <tr>
                                <td style="padding: 30px;">
                                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Inquiry Details</h2>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <!-- Data Rows -->
                                        ${renderRow("Company", data.companyName)}
                                        ${renderRow("Contact Name", data.contactPerson)}
                                        ${renderRow("Phone Number", data.phone)}
                                        ${renderRow("Email Address", data.email, true)}
                                        ${renderRow("Product/Category", data.product)}
                                        ${renderRow("Estimated Quantity", data.estimatedQuantity)}
                                    </table>

                                    <!-- Requirements Section -->
                                    <div style="margin-top: 25px; padding: 20px; background-color: #fdfaf7; border-left: 4px solid #8b5535; border-radius: 4px;">
                                        <h4 style="margin: 0 0 10px 0; color: #8b5535; text-transform: uppercase; font-size: 12px;">Additional Requirements</h4>
                                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #555;">
                                            ${data.additionalRequirements || 'No specific requirements mentioned.'}
                                        </p>
                                    </div>

                                    <!-- CTA for Sales Team -->
                                    <div style="margin-top: 30px; text-align: center;">
                                        <p style="color: #d97706; font-weight: bold; font-size: 14px; margin-bottom: 15px;">
                                            ⏰ Follow up within 2 hours for the best conversion rate!
                                        </p>
                                        <a href="mailto:${data.email}" style="background-color: #8b5535; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                            Reply to Customer
                                        </a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 0; color: #999999; font-size: 11px;">
                                        Generated by Sappey Bulk Order System • ${new Date().toLocaleString()}
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

/**
 * Helper to render clean table rows for the data
 */
function renderRow(label: string, value: string | number, isLink = false): string {
    return `
        <tr>
            <td width="40%" style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px; font-weight: bold; text-transform: uppercase;">${label}</td>
            <td width="60%" style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-size: 15px;">
                ${isLink ? `<a href="mailto:${value}" style="color: #8b5535;">${value}</a>` : value}
            </td>
        </tr>
    `;
}