const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('lets_hang_token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Request failed',
        data: data,
      };
    }
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

export type SignupResponse = {
  success: boolean;
  message: string;
  userId: string;
  devOtp?: string;
  emailDisabled?: boolean;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token: string;
  user: User;
};

export type SigninResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  userId?: string;
  needsVerification?: boolean;
  devOtp?: string;
  emailDisabled?: boolean;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isVerified: boolean;
  paymentMethod?: 'upi' | 'bank' | 'none';
  upiId?: string;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  createdAt: string;
};

export const authApi = {
  // Sign up with email
  signup: (name: string, email: string, password: string) =>
    apiCall<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  // Verify OTP
  verifyOtp: (userId: string, otp: string) =>
    apiCall<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  // Resend OTP
  resendOtp: (userId: string) =>
    apiCall<{ success: boolean; message: string; devOtp?: string; emailDisabled?: boolean }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Sign in
  signin: (email: string, password: string) =>
    apiCall<SigninResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Get current user
  getMe: () => apiCall<{ success: boolean; user: User }>('/auth/me'),

  // Update profile
  updateProfile: (updates: Partial<User>) =>
    apiCall<{ success: boolean; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Check if API is available
  healthCheck: () => apiCall<{ success: boolean; message: string }>('/health'),
};

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem('lets_hang_token'),
  
  setToken: (token: string) => {
    localStorage.setItem('lets_hang_token', token);
  },
  
  removeToken: () => {
    localStorage.removeItem('lets_hang_token');
  },
};

