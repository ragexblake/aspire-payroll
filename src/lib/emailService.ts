import { Resend } from 'resend';

// Email service for OTP delivery
// In production, integrate with services like SendGrid, AWS SES, or Resend

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendOTPEmail(adminEmail: string, otpCode: string, operationType: string): Promise<boolean> {
    try {
      // Check if Resend API key is configured
      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
      
      if (resendApiKey && resendApiKey !== 'your_resend_api_key_here') {
        // Use Resend to send actual email
        const emailSent = await this.sendWithResend({
          to: adminEmail,
          subject: `OTP Verification Required - ${operationType === 'add_manager' ? 'Add Manager' : 'Delete Manager'}`,
          html: this.generateOTPEmailHTML(otpCode, operationType),
          text: this.generateOTPEmailText(otpCode, operationType)
        });
        
        if (emailSent) {
          console.log('✅ OTP email sent successfully via Resend to:', adminEmail);
          return true;
        } else {
          throw new Error('Failed to send email via Resend');
        }
      }
      
      // Fallback to development mode (alert dialog)
      const subject = `OTP Verification Required - ${operationType === 'add_manager' ? 'Add Manager' : 'Delete Manager'}`;
      
      const html = this.generateOTPEmailHTML(otpCode, operationType);
      const text = this.generateOTPEmailText(otpCode, operationType);

      const emailOptions: EmailOptions = {
        to: adminEmail,
        subject,
        html,
        text
      };

      // In development, we'll just log the email
      // In production, replace this with actual email service integration
      console.log('📧 Email would be sent:', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        otpCode: otpCode
      });

      // Show OTP in alert for development/demo purposes
      alert(`OTP Code: ${otpCode}\n\nEmail: ${adminEmail}\nOperation: ${operationType}\n\nThis would normally be sent via email.`);

      console.log('📧 Development mode: OTP shown in alert dialog');
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }

  private generateOTPEmailHTML(otpCode: string, operationType: string): string {
    const operationText = operationType === 'add_manager' ? 'Add Manager' : 'Delete Manager';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification - PayrollPro</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-code { 
              background: #1f2937; 
              color: #f9fafb; 
              font-size: 32px; 
              font-weight: bold; 
              text-align: center; 
              padding: 20px; 
              border-radius: 8px; 
              letter-spacing: 8px; 
              margin: 20px 0;
            }
            .warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              color: #92400e; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 OTP Verification Required</h1>
              <p>PayrollPro Security Verification</p>
            </div>
            <div class="content">
              <h2>Manager ${operationText} Operation</h2>
              <p>You have requested to ${operationText.toLowerCase()} a manager profile. For security reasons, this action requires verification.</p>
              
              <p><strong>Your verification code is:</strong></p>
              <div class="otp-code">${otpCode}</div>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                  <li>This code expires in 10 minutes</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this action, please contact support immediately</li>
                </ul>
              </div>
              
              <p>Enter this code in the verification dialog to complete the ${operationText.toLowerCase()} operation.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from PayrollPro. Please do not reply to this email.</p>
              <p>© 2024 PayrollPro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateOTPEmailText(otpCode: string, operationType: string): string {
    const operationText = operationType === 'add_manager' ? 'Add Manager' : 'Delete Manager';
    
    return `
OTP Verification Required - PayrollPro

You have requested to ${operationText.toLowerCase()} a manager profile. For security reasons, this action requires verification.

Your verification code is: ${otpCode}

IMPORTANT SECURITY INFORMATION:
- This code expires in 10 minutes
- Do not share this code with anyone
- If you didn't request this action, please contact support immediately

Enter this code in the verification dialog to complete the ${operationText.toLowerCase()} operation.

This is an automated message from PayrollPro. Please do not reply to this email.
© 2024 PayrollPro. All rights reserved.
    `.trim();
  }

  private async sendWithResend(options: EmailOptions): Promise<boolean> {
    try {
      const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: 'PayrollPro <noreply@yourdomain.com>', // Replace with your verified domain
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text
      });
      
      if (error) {
        console.error('Resend API error:', error);
        return false;
      }
      
      console.log('Resend email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Failed to send email with Resend:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
