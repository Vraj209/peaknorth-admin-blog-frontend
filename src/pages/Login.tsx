import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface FieldError {
  email?: string;
  password?: string;
}

/**
 * Login Page Component
 * Allows users to authenticate with email and password
 */
export const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    setFieldErrors({ ...fieldErrors, email: undefined });
    setError('');
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    setFieldErrors({ ...fieldErrors, password: undefined });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await signIn(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      // Parse and show specific error messages
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      
      // Highlight relevant field based on error
      if (errorMessage.includes('email') || errorMessage.includes('account')) {
        setFieldErrors({ email: ' ' }); // Space to trigger error styling
      } else if (errorMessage.includes('password')) {
        setFieldErrors({ password: ' ' }); // Space to trigger error styling
      }
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
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-left duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-1">Unable to sign in</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
                  }`}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {fieldErrors.email && fieldErrors.email.trim() && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {fieldErrors.email && fieldErrors.email.trim() && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>•</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`block w-full pl-10 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900'
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                  {fieldErrors.password && fieldErrors.password.trim() && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {fieldErrors.password && fieldErrors.password.trim() && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>•</span> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

          {/* Right Side - SVG Image (Hidden on mobile) */}
          <div className="hidden md:flex md:w-1/2 bg-white items-center justify-center p-8 lg:p-12 border-l border-gray-200">
            <img 
              src="/login.svg" 
              alt="Login illustration" 
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
