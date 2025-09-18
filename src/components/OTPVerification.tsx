import { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, otpSent]);

  const sendOTP = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.rpc('generate_otp', {
        p_admin_id: profile.id,
        p_operation_type: operationType,
        p_target_data: targetData
      });
      
      if (error) throw error;
      
      setOtpSent(true);
      setTimeLeft(600); // Reset timer
      
      // Send OTP via email
      if (profile?.email) {
        const emailSent = await emailService.sendOTPEmail(
          profile.email,
          data,
          operationType
        );
        
        if (!emailSent) {
          setError('Failed to send OTP email. Please try again.');
          setOtpSent(false);
          return;
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!profile?.id || !otpCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.rpc('verify_otp', {
        p_code: otpCode.trim(),
        p_admin_id: profile.id
      });
      
      if (error) throw error;
      
      if (data.valid) {
        onSuccess(data);
      } else {
        setError(data.message || 'Invalid OTP code');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                  OTP Verification Required
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

          {!otpSent ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Security Verification Required
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      To {operationType === 'add_manager' ? 'add a new manager' : 'delete a manager'}, 
                      you need to verify your identity with a one-time password.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating OTP...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Send OTP to Email</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      OTP Sent Successfully
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Check your email for the verification code. It will expire in {formatTime(timeLeft)}.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              {timeLeft === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">OTP has expired. Please request a new one.</span>
                  </div>
                </div>
              )}

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
                  disabled={loading || otpCode.length !== 6 || timeLeft === 0}
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
                  onClick={sendOTP}
                  disabled={loading || timeLeft > 540} // Can resend after 1 minute
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend
                </button>
              </div>

              {timeLeft > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Time remaining: <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
