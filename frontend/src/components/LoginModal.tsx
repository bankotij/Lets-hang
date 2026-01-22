import { useState, useRef, useEffect } from 'react';
import { useShowLoginModal, useAuthActions } from '../state/authState';
import { authApi, tokenManager } from '../api/authApi';
import { readFileAsDataUrl } from '../utils/file';

type AuthMode = 'signin' | 'signup' | 'verify';

export function LoginModal() {
  const isOpen = useShowLoginModal();
  const { loginWithUser, closeLoginModal } = useAuthActions();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Focus OTP input when entering verify mode
  useEffect(() => {
    if (mode === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [mode]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  function resetForm() {
    setMode('signin');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setUserId(null);
    setAvatar('');
    setError(null);
    setMessage(null);
    setIsLoading(false);
  }

  if (!isOpen) return null;

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      setError('Failed to upload image');
    }
    setIsUploadingAvatar(false);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await authApi.signup(name.trim(), email.trim(), password);

    if (result.success && result.data) {
      setUserId(result.data.userId);
      setMessage(result.data.message);
      setMode('verify');
      setCountdown(60);
    } else {
      setError(result.error || 'Signup failed');
    }

    setIsLoading(false);
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);

    const result = await authApi.signin(email.trim(), password);

    if (result.success && result.data?.token && result.data?.user) {
      // Save token
      tokenManager.setToken(result.data.token);
      
      // Login user
      loginWithUser({
        id: result.data.user._id,
        name: result.data.user.name,
        email: result.data.user.email,
        avatar: result.data.user.avatar,
        bio: result.data.user.bio,
        location: result.data.user.location,
        website: result.data.user.website,
        joinedAt: result.data.user.createdAt,
        paymentMethod: result.data.user.paymentMethod,
        upiId: result.data.user.upiId,
        bankDetails: result.data.user.bankDetails,
      });
      
      closeLoginModal();
    } else if (result.data?.needsVerification && result.data?.userId) {
      // Needs email verification
      setUserId(result.data.userId);
      setMessage('Please verify your email. A new code has been sent.');
      setMode('verify');
      setCountdown(60);
    } else {
      setError(result.error || 'Sign in failed');
    }

    setIsLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!userId || !otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);

    const result = await authApi.verifyOtp(userId, otp.trim());

    if (result.success && result.data?.token && result.data?.user) {
      // Save token
      tokenManager.setToken(result.data.token);
      
      // Login user
      loginWithUser({
        id: result.data.user._id,
        name: result.data.user.name,
        email: result.data.user.email,
        avatar: avatar || result.data.user.avatar,
        bio: result.data.user.bio,
        location: result.data.user.location,
        website: result.data.user.website,
        joinedAt: result.data.user.createdAt,
        paymentMethod: result.data.user.paymentMethod,
        upiId: result.data.user.upiId,
        bankDetails: result.data.user.bankDetails,
      });
      
      closeLoginModal();
    } else {
      setError(result.error || 'Verification failed');
    }

    setIsLoading(false);
  }

  async function handleResendOtp() {
    if (!userId || countdown > 0) return;

    setError(null);
    setIsLoading(true);

    const result = await authApi.resendOtp(userId);

    if (result.success) {
      setMessage('New verification code sent!');
      setCountdown(60);
    } else {
      setError(result.error || 'Failed to resend code');
    }

    setIsLoading(false);
  }

  function handleDemoLogin() {
    // For demo purposes, login without backend
    loginWithUser({
      id: crypto.randomUUID(),
      name: 'Demo User',
      email: 'demo@letshang.app',
      avatar: 'https://i.pravatar.cc/150?img=68',
      joinedAt: new Date().toISOString(),
    });
    closeLoginModal();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* OTP Verification Mode */}
        {mode === 'verify' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📧</div>
              <h2 className="text-white text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-white/50 text-sm">
                We sent a 6-digit code to <span className="text-purple-400">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium disabled:text-white/30 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMode('signin')}
              className="mt-4 w-full text-center text-white/50 text-sm hover:text-white"
            >
              ← Back to Sign In
            </button>
          </>
        )}

        {/* Sign In Mode */}
        {mode === 'signin' && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-white text-2xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-white/50 text-sm">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignin} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Sign Up
                </button>
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <span>🎭</span>
              Demo Login (No Backend)
            </button>
          </>
        )}

        {/* Sign Up Mode */}
        {mode === 'signup' && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-white text-2xl font-bold mb-2">Create Account</h2>
              <p className="text-white/50 text-sm">Join the community!</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Avatar upload */}
              <div className="flex justify-center mb-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="relative group"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Your avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center group-hover:border-purple-500 group-hover:bg-purple-500/10 transition-all">
                      {isUploadingAvatar ? (
                        <span className="animate-spin text-xl">⏳</span>
                      ) : (
                        <svg className="w-8 h-8 text-white/40 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </button>
              </div>
              <p className="text-white/40 text-xs text-center mb-2">
                {avatar ? 'Click to change photo' : 'Add a profile photo (optional)'}
              </p>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
