import cron from 'node-cron';
import Razorpay from 'razorpay';

// Platform fee percentage
const PLATFORM_FEE_PERCENT = 10;
const CANCELLATION_FEE_PERCENT = 20;

// In-memory store for pending payouts (in production, use MongoDB)
const pendingPayouts = new Map();
const completedPayouts = new Map();

// Get Razorpay instance
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (keyId && keySecret) {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return null;
}

// Schedule a payout for after event completion
export function schedulePayout(payoutData) {
  const {
    eventId,
    eventName,
    eventEndDate,
    hostId,
    hostName,
    hostEmail,
    hostUpiId,
    hostBankDetails,
    totalAmount,
  } = payoutData;

  const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
  const hostEarnings = totalAmount - platformFee;

  const payout = {
    id: `PAY-${eventId.slice(0, 8)}-${Date.now().toString(36)}`,
    eventId,
    eventName,
    eventEndDate,
    hostId,
    hostName,
    hostEmail,
    hostUpiId,
    hostBankDetails,
    totalAmount,
    platformFee,
    hostEarnings,
    status: 'scheduled',
    scheduledFor: new Date(eventEndDate),
    createdAt: new Date(),
  };

  pendingPayouts.set(payout.id, payout);
  console.log(`Payout scheduled: ${payout.id} for ${hostName} - ₹${hostEarnings / 100} after ${eventEndDate}`);
  
  return payout;
}

// Process a single payout
async function processPayout(payout) {
  console.log(`Processing payout ${payout.id} for ${payout.hostName}...`);
  
  const razorpay = getRazorpay();
  if (!razorpay) {
    console.error('Razorpay not configured, cannot process payout');
    return { success: false, error: 'Payment gateway not configured' };
  }

  try {
    // In production with Razorpay Payouts API:
    // const payoutResult = await razorpay.payouts.create({
    //   account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
    //   fund_account_id: hostFundAccountId,
    //   amount: payout.hostEarnings,
    //   currency: 'INR',
    //   mode: payout.hostUpiId ? 'UPI' : 'NEFT',
    //   purpose: 'payout',
    //   queue_if_low_balance: true,
    //   reference_id: payout.id,
    //   narration: `Payout for ${payout.eventName}`,
    // });

    // For now, simulate successful payout
    payout.status = 'completed';
    payout.processedAt = new Date();
    payout.transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
    
    // Move to completed
    pendingPayouts.delete(payout.id);
    completedPayouts.set(payout.id, payout);

    console.log(`✅ Payout completed: ${payout.id} - ₹${payout.hostEarnings / 100} to ${payout.hostName}`);
    
    // TODO: Send email notification to host about payout
    
    return { success: true, payout };
  } catch (error) {
    console.error(`Payout failed for ${payout.id}:`, error);
    payout.status = 'failed';
    payout.error = error.message;
    return { success: false, error: error.message };
  }
}

// Process refund with cancellation fee
export async function processRefund(refundData) {
  const {
    paymentId,
    amount,
    reason,
    userId,
    eventId,
  } = refundData;

  const razorpay = getRazorpay();
  if (!razorpay) {
    console.error('Razorpay not configured');
    return { success: false, error: 'Payment gateway not configured' };
  }

  // Calculate refund amount (80% of original - 20% cancellation fee)
  const cancellationFee = Math.round(amount * (CANCELLATION_FEE_PERCENT / 100));
  const refundAmount = amount - cancellationFee;

  try {
    // Create refund via Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmount, // Amount in paise
      speed: 'normal',
      notes: {
        reason,
        userId,
        eventId,
        originalAmount: amount,
        cancellationFee,
        refundAmount,
      },
    });

    console.log(`✅ Refund processed: ${refund.id} - ₹${refundAmount / 100} (₹${cancellationFee / 100} cancellation fee)`);

    return {
      success: true,
      refund: {
        id: refund.id,
        paymentId,
        originalAmount: amount,
        cancellationFee,
        refundAmount,
        status: refund.status,
      },
    };
  } catch (error) {
    console.error('Refund failed:', error);
    return { 
      success: false, 
      error: error.error?.description || error.message || 'Refund failed' 
    };
  }
}

// Get pending payouts
export function getPendingPayouts() {
  return Array.from(pendingPayouts.values());
}

// Get completed payouts
export function getCompletedPayouts() {
  return Array.from(completedPayouts.values());
}

// Get payout by event ID
export function getPayoutByEventId(eventId) {
  for (const payout of pendingPayouts.values()) {
    if (payout.eventId === eventId) return payout;
  }
  for (const payout of completedPayouts.values()) {
    if (payout.eventId === eventId) return payout;
  }
  return null;
}

// Initialize cron jobs
export function initializePayoutJobs() {
  // Run every hour to check for payouts that are due
  cron.schedule('0 * * * *', async () => {
    console.log('🕐 Running scheduled payout check...');
    
    const now = new Date();
    
    for (const [id, payout] of pendingPayouts) {
      // Check if event has ended (payout is due)
      if (payout.status === 'scheduled' && new Date(payout.scheduledFor) <= now) {
        console.log(`Payout ${id} is due, processing...`);
        payout.status = 'processing';
        await processPayout(payout);
      }
    }
  });

  // Run daily at midnight to generate payout reports
  cron.schedule('0 0 * * *', () => {
    console.log('📊 Daily payout report:');
    console.log(`  Pending payouts: ${pendingPayouts.size}`);
    console.log(`  Completed payouts: ${completedPayouts.size}`);
    
    let totalPending = 0;
    for (const payout of pendingPayouts.values()) {
      totalPending += payout.hostEarnings;
    }
    console.log(`  Total pending amount: ₹${totalPending / 100}`);
  });

  console.log('✅ Payout cron jobs initialized');
}

// Manual trigger for payout (for testing or manual processing)
export async function triggerPayout(payoutId) {
  const payout = pendingPayouts.get(payoutId);
  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }
  
  payout.status = 'processing';
  return await processPayout(payout);
}

export { PLATFORM_FEE_PERCENT, CANCELLATION_FEE_PERCENT };

