import { useState, useEffect } from 'react';
import { Shield, Mail, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { emailService } from '../lib/emailService';

interface OTPVerificationProps {
  operationType: 'add_manager' | 'delete_manager';
  targetData?: any;
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

export function OTPVerification({ operationType, targetData, onSuccess, onCancel }: OTPVerificationProps) {
  const { profile } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');

  const sendVerificationEmail = async () => {
    if (!profile?.email) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Generate OTP using custom RPC function
      const { data, error } = await supabase.rpc('generate_otp', {
        p_admin_id: profile.id,
        p_operation_type: operationType,
        p_target_data: targetData
      });
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Failed to generate OTP');
      }
      
      // Store the generated OTP for development mode
      setGeneratedOTP(data);
      
      // Send email using Resend
      const emailSent = await emailService.sendOTPEmail(
        profile.email,
        data,
        operationType
      );
      
      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }
      
      setEmailSent(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!profile?.email || !otpCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Verify OTP using custom RPC function
      const { data, error } = await supabase.rpc('verify_otp', {
        p_admin_id: profile.id,
        p_otp_code: otpCode.trim(),
        p_operation_type: operationType
      });
      
      if (error) throw error;
      
      if (data === true) {
        // OTP verified successfully
        onSuccess({
          valid: true,
          operation_type: operationType,
          target_data: targetData,
          message: 'OTP verified successfully'
        });
      } else {
        setError('Invalid OTP code');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const getOperationText = () => {
    switch (operationType) {
      case 'add_manager':
        return 'Add Manager';
      case 'delete_manager':
        return 'Delete Manager';
      default:
        return 'Operation';
    }
  };

  // Auto-send email when component mounts
  useEffect(() => {
    sendVerificationEmail();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Email Verification Required
                </h3>
                <p className="text-sm text-gray-600">
                  {getOperationText()} operation requires verification
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {emailSent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Verification Email Sent
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Check your email ({profile?.email}) for the 6-digit verification code.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Development Mode Info */}
            {generatedOTP && import.meta.env.DEV && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Development Mode:</strong> OTP Code is {generatedOTP}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-widest"
                maxLength={6}
                disabled={!emailSent}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={verifyOTP}
                disabled={loading || otpCode.length !== 6 || !emailSent}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
              
              <button
                onClick={sendVerificationEmail}
                disabled={loading}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or click resend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}