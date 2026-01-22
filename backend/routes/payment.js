import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticate } from '../middleware/auth.js';
import { processRefund, CANCELLATION_FEE_PERCENT } from '../services/payoutService.js';
import { sendTicketEmail, formatEventDate, formatEventTime } from '../services/ticketService.js';

const router = express.Router();

// Initialize Razorpay instance (will be created on first use)
let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (keyId && keySecret) {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log('Razorpay SDK initialized successfully');
    }
  }
  return razorpayInstance;
}

// Supported currencies for Razorpay
const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED', 'AUD', 'CAD', 'CNY', 'SEK', 'NZD', 'MXN', 'BRL', 'HKD', 'JPY', 'MYR', 'NOK', 'PHP', 'PLN', 'RUB', 'SAR', 'THB', 'TRY', 'TWD', 'ZAR'];

// @route   POST /api/payment/create-order
// @desc    Create a Razorpay order
// @access  Private
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount, eventId, eventName, currency = 'INR' } = req.body;
    
    if (!amount || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and eventId are required',
      });
    }
    
    const razorpay = getRazorpay();
    
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
      });
    }
    
    // Use INR as default if currency not supported
    const orderCurrency = SUPPORTED_CURRENCIES.includes(currency.toUpperCase()) ? currency.toUpperCase() : 'INR';
    
    // Create Razorpay order using SDK
    // Receipt must be <= 40 chars
    const shortReceipt = `evt_${eventId.slice(0, 8)}_${Date.now().toString(36)}`;
    const order = await razorpay.orders.create({
      amount: amount, // Amount in smallest currency unit (paise for INR, cents for USD, etc.)
      currency: orderCurrency,
      receipt: shortReceipt.slice(0, 40),
      notes: {
        eventId,
        eventName,
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        originalCurrency: currency,
      },
    });
    
    console.log(`Razorpay order created: ${order.id} (${orderCurrency})`);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
    
  } catch (error) {
    console.error('Create order error:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.error?.description || 'Failed to create payment order',
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details',
      });
    }
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');
    
    const isValid = expectedSignature === razorpay_signature;
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }
    
    console.log('Payment verified:', razorpay_payment_id);
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
});

// @route   GET /api/payment/config
// @desc    Get Razorpay public key for frontend
// @access  Public
router.get('/config', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const configured = !!(keyId && keySecret);
  
  console.log('Payment config:', { configured, keyId: keyId ? `${keyId.slice(0, 12)}...` : 'missing' });
  
  res.json({
    success: true,
    key: keyId || null,
    configured,
  });
});

// @route   POST /api/payment/refund
// @desc    Process refund with cancellation fee
// @access  Private
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { paymentId, amount, eventId, reason } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and amount are required',
      });
    }

    const result = await processRefund({
      paymentId,
      amount,
      reason: reason || 'User requested cancellation',
      userId: req.user._id.toString(),
      eventId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: `Refund processed. ₹${result.refund.refundAmount / 100} will be credited (₹${result.refund.cancellationFee / 100} cancellation fee deducted)`,
      refund: result.refund,
      cancellationFeePercent: CANCELLATION_FEE_PERCENT,
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
    });
  }
});

// @route   POST /api/payment/send-ticket
// @desc    Send ticket email with QR code
// @access  Private
router.post('/send-ticket', authenticate, async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      eventDescription,
      eventDate,
      eventLocation,
      paymentId,
      amount,
      ticketCount = 1,
      hostName,
      hostEmail,
      ticketTierName,
      addOns,
    } = req.body;

    if (!eventId || !eventName || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Event details are required',
      });
    }

    const result = await sendTicketEmail({
      eventId,
      eventName,
      eventDescription,
      eventDate: formatEventDate(eventDate),
      eventTime: formatEventTime(eventDate),
      eventLocation: eventLocation || 'See event page for details',
      attendeeName: req.user.name,
      attendeeEmail: req.user.email,
      paymentId,
      amount,
      ticketCount,
      hostName,
      hostEmail,
      ticketTierName,
      addOns,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send ticket email',
      });
    }

    res.json({
      success: true,
      message: ticketCount > 1 
        ? `${ticketCount} tickets sent to your email!`
        : 'Ticket sent to your email!',
      ticketId: result.ticketId,
    });

  } catch (error) {
    console.error('Send ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket',
    });
  }
});

export default router;
