import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import eventRoutes from './routes/events.js';
import { initializePayoutJobs } from './services/payoutService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from any localhost port during development
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
});

// Apply rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Let's Hang API is running!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  
  // Initialize scheduled jobs
  initializePayoutJobs();
  
  console.log(`
  🚀 Let's Hang API Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 Server:     http://localhost:${PORT}
  📡 Health:     http://localhost:${PORT}/api/health
  🔐 Auth API:   http://localhost:${PORT}/api/auth
  💳 Payments:   ${razorpayConfigured ? '✅ Razorpay configured' : '❌ Not configured'}
  ⏰ Jobs:       ✅ Payout scheduler running
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

