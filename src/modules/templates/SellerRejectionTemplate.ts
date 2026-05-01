export const sellerRejectionTemplate = (name: string, reason: string, signupUrl: string): string => `
    <!DOCTYPE html>
    <html>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="500" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #c62828;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">APPLICATION STATUS</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #333333;">Hello ${name},</h2>
                                    <p style="color: #666666; font-size: 15px; line-height: 24px;">After reviewing your application, we are unable to approve your seller account at this time.</p>
                                    <div style="background-color: #fff5f5; border-left: 4px solid #c62828; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; color: #c62828; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
                                    </div>
                                    <p style="color: #666666; font-size: 14px;">You are welcome to update your documentation and reapply.</p>
                                    <div align="center" style="margin-top: 30px;">
                                        <a href="${signupUrl}" style="border: 2px solid #4b3832; color: #4b3832; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Update & Reapply</a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
`;