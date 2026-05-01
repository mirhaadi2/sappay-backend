/**
 * Professional Verification OTP Email Template
 * @param code - The verification code (string or number)
 */
export const verificationOtpTemplate = (code: string | number): string => `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="450" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 3px;">SAPPEY</h1>
                                </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 20px;">Verify your identity</h2>
                                    <p style="color: #666666; font-size: 15px; line-height: 22px; margin-bottom: 30px;">
                                        Please use the verification code below to continue. For your security, this code will expire in 10 minutes.
                                    </p>
                                
                                    <!-- Code Box -->
                                    <div style="background-color: #f8f9fa; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin: 0 auto; width: fit-content;">
                                        <span style="font-size: 32px; font-weight: bold; color: #4b3832; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${code}</span>
                                    </div>

                                    <p style="margin-top: 30px; color: #999999; font-size: 13px;">
                                        If you didn't request this, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0;">
                                    <p style="margin: 0; color: #bbbbbb; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                                        &copy; 2026 Sappey Security Team
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