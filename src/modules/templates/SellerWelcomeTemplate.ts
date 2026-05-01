/**
 * Professional Seller Welcome Email Template
 * @param email - The seller's registration email
 * @param password - The temporary password generated for them
 */
export const sellerWelcomeTemplate = (email: string, password: string | number): string => `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <!-- Card Container -->
                        <table border="0" cellpadding="0" cellspacing="0" width="550" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        
                            <!-- Header -->
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 3px; text-transform: uppercase;">Sappey Seller Central</h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 20px;">Welcome to the Seller Program!</h2>
                                    <p style="color: #555555; font-size: 15px; line-height: 24px; margin-bottom: 25px;">
                                        Your seller account has been successfully created. You can use the credentials below to log in to your merchant dashboard.
                                    </p>
                                    
                                    <!-- Credentials Box -->
                                    <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #eeeeee; margin-bottom: 25px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <p style="margin: 0 0 5px 0; color: #888888; font-size: 12px; text-transform: uppercase; font-weight: bold;">Merchant Login</p>
                                                <p style="margin: 0 0 15px 0; color: #333333; font-size: 15px;">${email}</p>
                                                
                                                <p style="margin: 0 0 5px 0; color: #888888; font-size: 12px; text-transform: uppercase; font-weight: bold;">Temporary Password</p>
                                                <p style="margin: 0; color: #333333; font-size: 15px; font-family: 'Courier New', Courier, monospace;">${password}</p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Review Status Alert -->
                                    <div style="background-color: #fff9db; border-left: 4px solid #fcc419; padding: 15px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 20px;">
                                            <strong>Account Status: Under Review</strong><br>
                                            Our team is currently verifying your details. You will receive another notification once your store is approved and ready for product listings.
                                        </p>
                                    </div>

                                    <!-- Action Button -->
                                    <div align="center" style="margin-bottom: 25px;">
                                        <a href="https://seller.sappey.com/login" style="background-color: #4b3832; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Seller Dashboard</a>
                                    </div>

                                    <p style="color: #d32f2f; font-size: 13px; font-weight: 500; text-align: center; margin: 0;">
                                        ⚠️ Security Reminder: Change your password immediately after first login.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 25px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;">
                                    <p style="margin: 0; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        &copy; 2026 Sappey Merchant Services
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