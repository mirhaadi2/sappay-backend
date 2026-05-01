export const passwordResetTemplate = (resetLink: string): string => `
    <!DOCTYPE html>
    <html>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="500" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px;">SAPPEY</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px; text-align: center;">
                                    <h2 style="color: #333333; margin: 0 0 20px 0;">Password Reset Request</h2>
                                    <p style="color: #666666; font-size: 15px; line-height: 24px;">
                                        We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
                                    </p>
                                    <div style="margin: 30px 0;">
                                        <a href="${resetLink}" style="background-color: #4b3832; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                                    </div>
                                    <p style="color: #999999; font-size: 12px;">
                                        If the button doesn't work, copy and paste this link:<br>
                                        <span style="color: #4b3832;">${resetLink}</span>
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