const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, callback: () => void) => void;
}

type ApiResponse<T> = {
  success: boolean;
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

export type CreateOrderResponse = {
  success: boolean;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  key: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  paymentId: string;
  orderId: string;
};

export type PaymentConfigResponse = {
  success: boolean;
  key: string | null;
  configured: boolean;
};

export type RefundResponse = {
  success: boolean;
  message: string;
  refund: {
    id: string;
    paymentId: string;
    originalAmount: number;
    cancellationFee: number;
    refundAmount: number;
    status: string;
  };
  cancellationFeePercent: number;
};

export type SendTicketResponse = {
  success: boolean;
  message: string;
  ticketId: string;
};

export const paymentApi = {
  // Check if payment is configured
  getConfig: () => 
    apiCall<PaymentConfigResponse>('/payment/config'),

  // Create a payment order
  createOrder: (amount: number, eventId: string, eventName: string, currency: string = 'INR') =>
    apiCall<CreateOrderResponse>('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, eventId, eventName, currency }),
    }),

  // Verify payment after completion
  verifyPayment: (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    eventId: string
  ) =>
    apiCall<VerifyPaymentResponse>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        eventId,
      }),
    }),

  // Request refund with cancellation fee
  requestRefund: (paymentId: string, amount: number, eventId: string, reason?: string) =>
    apiCall<RefundResponse>('/payment/refund', {
      method: 'POST',
      body: JSON.stringify({ paymentId, amount, eventId, reason }),
    }),

  // Send ticket email with QR code
  sendTicket: (eventData: {
    eventId: string;
    eventName: string;
    eventDescription?: string;
    eventDate: string;
    eventLocation: string;
    paymentId?: string;
    amount?: number;
    ticketCount?: number;
    hostName?: string;
    hostEmail?: string;
    ticketTierName?: string;
    addOns?: Array<{ name: string; quantity: number; price: number }>;
  }) =>
    apiCall<SendTicketResponse>('/payment/send-ticket', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
};

// Open Razorpay checkout
export function openRazorpayCheckout(options: {
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  eventName: string;
  userName?: string;
  userEmail?: string;
  onSuccess: (response: RazorpayResponse) => void;
  onError: (error: string) => void;
  onDismiss?: () => void;
}): void {
  if (!window.Razorpay) {
    options.onError('Payment gateway not loaded. Please refresh the page.');
    return;
  }

  const razorpay = new window.Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: "Let's Hang",
    description: `Ticket for ${options.eventName}`,
    order_id: options.orderId,
    handler: options.onSuccess,
    prefill: {
      name: options.userName,
      email: options.userEmail,
    },
    theme: {
      color: '#7c3aed',
    },
    modal: {
      ondismiss: options.onDismiss,
    },
  });

  razorpay.on('payment.failed', () => {
    options.onError('Payment failed. Please try again.');
  });

  razorpay.open();
}

