/**
 * Professional Order Confirmation Email Template (Customer Facing)
 */
export const orderConfirmationTemplate = (data: {
    orderNumber: string;
    finalAmount: number;
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
                                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Order Confirmation</h2>
                                    <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 25px;">
                                        Thank you for shopping with us! Your order has been placed successfully.
                                    </p>

                                    <!-- Order Details Box -->
                                    <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #eeeeee; margin-bottom: 25px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                                                <p style="margin: 0; color: #333333; font-size: 15px;"><strong>Total Amount:</strong> ₹${data.finalAmount}</p>
                                            </td>
                                        </tr>
                                    </table>

                                   <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 25px;">
                                        We've received your order and are getting it ready for shipment. You'll receive another email with a tracking number as soon as your package leaves our warehouse.
                                    </p>


                                    <!-- Footer -->
                                    <table width="100%">
                                        <tr>
                                            <td align="center" style="padding: 20px 0; border-top: 1px solid #eeeeee;">
                                                <p style="margin: 0; color: #888888; font-size: 12px;">
                                                    Thank you for choosing Sappey. We appreciate your business!
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
`;