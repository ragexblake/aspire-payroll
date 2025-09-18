import { supabase } from './supabase';
import { Resend } from 'resend';

export class EmailService {
  private static resend: Resend | null = null;

  private static getResendClient(): Resend | null {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    
    console.log('Checking Resend API key:', apiKey ? `Present (${apiKey.length} chars)` : 'Missing');
    console.log('API Key starts with "re_":', apiKey?.startsWith('re_') ? 'Yes' : 'No');
    
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
      console.warn('Resend API key not configured');
      return null;
    }

    if (!this.resend) {
      console.log('Creating new Resend client');
      console.log('Using API key:', apiKey.substring(0, 10) + '...');
      this.resend = new Resend(apiKey);
    }

    return this.resend;
  }

  static async sendOTPEmail(
    adminEmail: string,
    managerId: string,
    adminId: string,
    operationType: string = 'password_reset'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== OTP EMAIL SENDING DEBUG ===');
      console.log('Admin email (recipient):', adminEmail);
      console.log('Manager ID:', managerId);
      console.log('Admin ID:', adminId);
      console.log('Operation type:', operationType);
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated OTP:', otp);
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      console.log('OTP expires at:', expiresAt.toISOString());

      // Store OTP in Supabase
      console.log('Storing OTP in database...');
      const { error: dbError } = await supabase
        .from('otp_codes')
        .insert({
          admin_id: adminId,
          otp_code: otp,
          operation_type: operationType,
          target_data: { manager_id: managerId, admin_email: adminEmail },
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (dbError) {
        console.error('Database error storing OTP:', dbError);
        console.error('Failed to store OTP in database:', dbError);
        return { success: false, error: 'Failed to generate OTP. Please try again.' };
      }

      // Try to send email via Resend
      const resendClient = this.getResendClient();
      
      console.log('Resend client available:', !!resendClient);
      if (!resendClient) {
        return { 
          success: false, 
          error: 'Email service not configured. Please add VITE_RESEND_API_KEY to your .env file.' 
        };
      }

      try {
        console.log('Attempting to send OTP email to:', adminEmail);
        console.log('Attempting to send OTP email to:', adminEmail);
        console.log('Resend API Key (first 10 chars):', import.meta.env.VITE_RESEND_API_KEY?.substring(0, 10) + '...');
        
        const emailData = {
          from: 'PayrollPro <noreply@payrollpro.com>',
          to: [adminEmail],
          subject: 'Password Reset OTP - PayrollPro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Password Reset Request</h2>
              <p>Hello,</p>
              <p>You have initiated a password reset for a manager's PayrollPro account.</p>
              <p>Your One-Time Password (OTP) is:</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px;">${otp}</span>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>Use this OTP to complete the password reset process in the admin dashboard.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated message from PayrollPro. Please do not reply to this email.
              </p>
            </div>
          `
        };
        
        console.log('Email data being sent:', emailData);
        
        const result = await resendClient.emails.send(emailData);
        console.log('Resend API response:', result);

        console.log('OTP email sent successfully to:', adminEmail);
        return { success: true };
      } catch (emailError: any) {
        console.error('Failed to send email via Resend:', emailError);
        console.error('Resend error details:', emailError.message, emailError.response?.data);
        return { 
          success: false, 
          error: `Failed to send OTP email: ${emailError.message || 'Unknown error'}. Please check the email address and try again.` 
        };
      }
    } catch (error: any) {
      console.error('Unexpected error in sendOTPEmail:', error);
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