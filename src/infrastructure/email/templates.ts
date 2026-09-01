import { verificationOtpTemplate } from '../../modules/templates/VerificationOtpTemplate';
import { sellerWelcomeTemplate } from '../../modules/templates/SellerWelcomeTemplate';
import { passwordResetTemplate } from '../../modules/templates/PasswordResetTemplate';
import { sellerApprovalTemplate } from '../../modules/templates/SellerApprovalTemplate';
import { sellerRejectionTemplate } from '../../modules/templates/SellerRejectionTemplate';
import { reapplyConfirmationTemplate } from '../../modules/templates/ReapplySellerTemplate';
import { newOrderNotificationTemplate } from '../../modules/templates/NewOrderNotificationTemplate';
import { orderConfirmationTemplate } from '../../modules/templates/OrderConfirmationTemplate';

export const emailTemplates = {
    verificationOtp: verificationOtpTemplate,
    sellerWelcome: sellerWelcomeTemplate,
    passwordReset: passwordResetTemplate,
    sellerApproval: sellerApprovalTemplate,
    sellerRejection: sellerRejectionTemplate,
    reapplyConfirmation: reapplyConfirmationTemplate,
    newOrderNotification: newOrderNotificationTemplate,
    orderConfirmation: orderConfirmationTemplate,
};
