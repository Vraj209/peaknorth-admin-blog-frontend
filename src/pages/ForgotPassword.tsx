import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, XCircle } from 'lucide-react';

/**
 * Forgot Password Page Component
 * Allows users to request a password reset email
 */
export const ForgotPassword = () => {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [fieldError, setFieldError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setFieldError('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setError('');
    setFieldError('');
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px] md:min-h-0">
          {/* Left Side - Form */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Password reset email sent successfully!
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                  </p>
                  <p className="text-xs text-green-600">
                    The email should arrive within a few minutes. Don't forget to check your spam folder.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 underline transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-left duration-300">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-1">Unable to send reset email</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`h-5 w-5 ${fieldError ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
                        fieldError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
                      }`}
                      placeholder="you@example.com"
                      disabled={loading}
                      autoComplete="email"
                    />
                    {fieldError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {fieldError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>•</span> {fieldError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

          {/* Right Side - SVG Image (Hidden on mobile) */}
          <div className="hidden md:flex md:w-1/2 bg-white items-center justify-center p-8 lg:p-12 border-l border-gray-200">
            <img 
              src="/login.svg" 
              alt="Forgot password illustration" 
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
