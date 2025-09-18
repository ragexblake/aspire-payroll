// This file is no longer needed since we're using Supabase's built-in email verification
// Keeping it for reference but it won't be used in the OTP flow

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

  // This method is deprecated - we now use Supabase's built-in email verification
  async sendOTPEmail(adminEmail: string, otpCode: string, operationType: string): Promise<boolean> {
    console.log('⚠️ EmailService.sendOTPEmail is deprecated. Using Supabase built-in email verification instead.');
    return true;
  }
}

// Export singleton instance for backward compatibility
export const emailService = EmailService.getInstance();