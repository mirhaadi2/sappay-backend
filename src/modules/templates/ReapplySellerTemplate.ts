export const reapplyConfirmationTemplate = (name: string): string => `
    <!DOCTYPE html>
    <html>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table border="0" cellpadding="0" cellspacing="0" width="500" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                            <tr>
                                <td align="center" style="padding: 30px 0; background-color: #4b3832;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px;">REAPPLICATION RECEIVED</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px; text-align: center;">
                                    <h2 style="color: #333333;">Hi ${name},</h2>
                                    <p style="color: #666666; font-size: 15px; line-height: 24px;">Your updated application has been received. Our team will perform a secondary review of your profile.</p>
                                    <p style="color: #888888; font-size: 13px; margin-top: 20px;">We will notify you shortly with the final decision.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
`;