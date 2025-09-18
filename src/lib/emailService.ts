import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend | null = null;
  
  constructor() {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (apiKey && apiKey !== 'your_resend_api_key_here') {
      this.resend = new Resend(apiKey);
    }
  }
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendOTPEmail(adminEmail: string, otpCode: string, operationType: string): Promise<boolean> {
    const operationText = this.getOperationText(operationType);
    
    if (!this.resend) {
      console.log('🔧 Development Mode: Resend not configured');
      console.log(`📧 Would send OTP email to: ${adminEmail}`);
      console.log(`🔐 OTP Code: ${otpCode}`);
      console.log(`⚡ Operation: ${operationText}`);
      
      // Show alert in development
      alert(`Development Mode - OTP Code: ${otpCode}\n\nOperation: ${operationText}\nEmail: ${adminEmail}`);
      return true;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'PayrollPro <noreply@yourdomain.com>', // Replace with your verified domain
        to: [adminEmail],
        subject: `PayrollPro - Verification Required: ${operationText}`,
        html: this.generateOTPEmailHTML(otpCode, operationText, adminEmail),
        text: this.generateOTPEmailText(otpCode, operationText)
      });

      if (error) {
        console.error('❌ Resend email error:', error);
        // Fallback to development mode
        alert(`Email failed, showing OTP: ${otpCode}\n\nOperation: ${operationText}`);
        return true;
      }

      console.log('✅ OTP email sent successfully via Resend:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      // Fallback to development mode
      alert(`Email failed, showing OTP: ${otpCode}\n\nOperation: ${operationText}`);
      return true;
    }
  }

  private getOperationText(operationType: string): string {
    switch (operationType) {
      case 'add_manager':
        return 'Add Manager';
      case 'delete_manager':
        return 'Delete Manager';
      default:
        return 'Admin Operation';
    }
  }

  private generateOTPEmailHTML(otpCode: string, operationType: string, adminEmail: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PayrollPro - Verification Required</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #2563eb; padding: 32px 24px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: bold; }
            .content { padding: 32px 24px; }
            .otp-box { background-color: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; font-family: monospace; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0; }
            .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏭 PayrollPro</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Verification Required</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                Hello,<br><br>
                A verification is required for the following operation: <strong>${operationType}</strong>
              </p>
              
              <div class="otp-box">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Your verification code is:</p>
                <div class="otp-code">${otpCode}</div>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                Enter this code in the PayrollPro application to complete the operation.
              </p>
              
              <div class="warning">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong> This code expires in 10 minutes. If you didn't request this operation, please contact your system administrator immediately.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                Sent to: ${adminEmail}<br>
                Time: ${new Date().toLocaleString()}
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                This email was sent by PayrollPro. Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateOTPEmailText(otpCode: string, operationType: string): string {
    return `
PayrollPro - Verification Required

A verification is required for the following operation: ${operationType}

Your verification code is: ${otpCode}

Enter this code in the PayrollPro application to complete the operation.

⚠️ Security Notice: This code expires in 10 minutes. If you didn't request this operation, please contact your system administrator immediately.

This email was sent by PayrollPro. Do not reply to this email.
    `.trim();
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();