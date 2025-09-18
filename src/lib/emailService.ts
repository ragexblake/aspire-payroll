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

      // For demo purposes, we'll simulate a successful send
      // In production, integrate with your preferred email service:
      // - SendGrid: await this.sendWithSendGrid(emailOptions);
      // - AWS SES: await this.sendWithSES(emailOptions);
      // - Resend: await this.sendWithResend(emailOptions);
      
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

  // Example integration methods (uncomment and implement as needed):

  /*
  private async sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    // SendGrid integration
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: options.to,
      from: process.env.FROM_EMAIL,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    
    await sgMail.send(msg);
    return true;
  }

  private async sendWithSES(options: EmailOptions): Promise<boolean> {
    // AWS SES integration
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: process.env.AWS_REGION });
    
    const params = {
      Destination: { ToAddresses: [options.to] },
      Message: {
        Body: {
          Html: { Data: options.html },
          Text: { Data: options.text || '' }
        },
        Subject: { Data: options.subject }
      },
      Source: process.env.FROM_EMAIL
    };
    
    await ses.sendEmail(params).promise();
    return true;
  }

  private async sendWithResend(options: EmailOptions): Promise<boolean> {
    // Resend integration
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    
    return true;
  }
  */
}

// Export singleton instance
export const emailService = EmailService.getInstance();
