/**
 * Professional Welcome/Account Creation Email Template
 * @param email - The user's registration email
 * @param password - The temporary password generated for them
 */
export const welcomeTemplate = (email: string, password: string | number): string => `
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
                        <table border="0" cellpadding="0" cellspacing="0" width="500" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        
                            <!-- Header -->
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px;">SAPPEY</h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 22px; text-align: center;">Welcome to the family!</h2>
                                    <p style="color: #666666; font-size: 15px; line-height: 24px; margin-bottom: 25px; text-align: center;">
                                        Your account has been created successfully. You can now access your dashboard and start shopping using the credentials below:
                                    </p>
                                
                                    <!-- Credentials Box -->
                                    <table width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #eeeeee; margin-bottom: 25px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Email Address</p>
                                                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-weight: bold;">${email}</p>
                                                
                                                <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Temporary Password</p>
                                                <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold; font-family: monospace;">${password}</p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Call to Action -->
                                    <div align="center" style="margin-bottom: 25px;">
                                        <a href="https://sappey.com/login" style="background-color: #4b3832; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to My Account</a>
                                    </div>

                                    <!-- Warning -->
                                    <p style="color: #d32f2f; font-size: 13px; font-weight: 500; text-align: center; margin: 0;">
                                        ⚠️ Please change your password after your first login for security.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 25px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;">
                                    <p style="margin: 0; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        &copy; 2026 Sappey Inc. | Shop Smart, Live Better.
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