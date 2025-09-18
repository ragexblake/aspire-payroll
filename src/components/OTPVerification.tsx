import React, { useState } from 'react';
import { Shield, RefreshCw, CheckCircle } from 'lucide-react';

interface OTPVerificationProps {
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

export function OTPVerification({ onVerify, onResend, loading = false, error, success }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      await onVerify(otp);
    }
  };

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter OTP</h3>
        <p className="text-sm text-gray-600">
          A 6-digit code has been sent to your admin email address.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            One-Time Password
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
            maxLength={6}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from the email</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Verify OTP</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Resending...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Resend</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          OTP expires in 10 minutes. Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}