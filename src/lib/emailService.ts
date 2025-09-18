import { supabase } from './supabase';
import { Resend } from 'resend';

export class EmailService {
  private static resend: Resend | null = null;

  private static getResendClient(): Resend | null {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
      console.warn('Resend API key not configured');
      return null;
    }

    if (!this.resend) {
      this.resend = new Resend(apiKey);
    }

    return this.resend;
  }

  static async sendOTPEmail(
    managerEmail: string,
    managerId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Store OTP in Supabase
      const { error: dbError } = await supabase
        .from('otp_codes')
        .insert({
          admin_id: adminId,
          otp_code: otp,
          operation_type: 'password_reset',
          target_data: { manager_id: managerId, manager_email: managerEmail },
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (dbError) {
        console.error('Failed to store OTP in database:', dbError);
        return { success: false, error: 'Failed to generate OTP. Please try again.' };
      }

      // Try to send email via Resend
      const resendClient = this.getResendClient();
      
      if (!resendClient) {
        return { 
          success: false, 
          error: 'Email service not configured. Please contact your system administrator.' 
        };
      }

      try {
        await resendClient.emails.send({
          from: 'PayrollPro <noreply@payrollpro.com>',
          to: [managerEmail],
          subject: 'Password Reset OTP - PayrollPro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Password Reset Request</h2>
              <p>Hello,</p>
              <p>Your administrator has initiated a password reset for your PayrollPro account.</p>
              <p>Your One-Time Password (OTP) is:</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px;">${otp}</span>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you did not request this password reset, please contact your administrator immediately.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated message from PayrollPro. Please do not reply to this email.
              </p>
            </div>
          `
        });

        return { success: true };
      } catch (emailError: any) {
        console.error('Failed to send email via Resend:', emailError);
        return { 
          success: false, 
          error: 'Failed to send OTP email. Please check the email address and try again.' 
        };
      }
    } catch (error: any) {
      console.error('Error in sendOTPEmail:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  }

  static async verifyOTP(
    otp: string,
    adminId: string,
    managerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find valid, unused OTP
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('otp_code', otp)
        .eq('admin_id', adminId)
        .eq('operation_type', 'password_reset')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching OTP:', fetchError);
        return { success: false, error: 'Failed to verify OTP. Please try again.' };
      }

      if (!otpRecord) {
        return { success: false, error: 'Invalid or expired OTP. Please try again.' };
      }

      // Check if the OTP is for the correct manager
      const targetData = otpRecord.target_data as { manager_id: string };
      if (targetData.manager_id !== managerId) {
        return { success: false, error: 'Invalid OTP for this manager.' };
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        console.error('Error marking OTP as used:', updateError);
        return { success: false, error: 'Failed to verify OTP. Please try again.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in verifyOTP:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  }
}