import express from 'express';
import { User } from '../models/User.js';
import { sendTemplateEmail } from '../services/emailService.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register new user and send OTP
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      } else {
        // User exists but not verified - resend OTP
        const otp = existingUser.generateOTP();
        existingUser.name = name;
        existingUser.password = password;
        await existingUser.save();
        
        // Send OTP email
        const emailResult = await sendTemplateEmail(email, 'otp', { name, otp });
        
        const response = {
          success: true,
          message: emailResult.skipped 
            ? 'Email is disabled - use the code shown below'
            : 'Verification code sent to your email',
          userId: existingUser._id,
        };
        
        if (emailResult.skipped) {
          response.devOtp = otp;
          response.emailDisabled = true;
        }
        
        return res.status(200).json(response);
      }
    }
    
    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    });
    
    // Generate OTP
    const otp = user.generateOTP();
    
    // Save user
    await user.save();
    
    // Send OTP email
    const emailResult = await sendTemplateEmail(email, 'otp', { name, otp });
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Don't fail the signup, just log the error
    }
    
    // Build response
    const response = {
      success: true,
      message: emailResult.skipped 
        ? 'Account created! Email is disabled - use the code shown below'
        : 'Account created! Please check your email for the verification code',
      userId: user._id,
    };
    
    // Include OTP in response if email was skipped (for dev/demo)
    if (emailResult.skipped) {
      response.devOtp = otp;
      response.emailDisabled = true;
    }
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and OTP',
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified',
      });
    }
    
    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }
    
    // Mark as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send welcome email
    await sendTemplateEmail(user.email, 'welcome', { name: user.name });
    
    res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: user.toJSON(),
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to user
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified',
      });
    }
    
    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Send OTP email
    const emailResult = await sendTemplateEmail(user.email, 'otp', { name: user.name, otp });
    
    const response = {
      success: true,
      message: emailResult.skipped 
        ? 'Email is disabled - use the code shown below'
        : 'New verification code sent!',
    };
    
    if (emailResult.skipped) {
      response.devOtp = otp;
      response.emailDisabled = true;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend code. Please try again.',
    });
  }
});

// @route   POST /api/auth/signin
// @desc    Sign in with email and password
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }
    
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Check if verified
    if (!user.isVerified) {
      // Generate new OTP and send
      const otp = user.generateOTP();
      await user.save();
      const emailResult = await sendTemplateEmail(user.email, 'otp', { name: user.name, otp });
      
      const response = {
        success: false,
        message: emailResult.skipped 
          ? 'Please verify your email first. Use the code shown below.'
          : 'Please verify your email first. A new code has been sent.',
        userId: user._id,
        needsVerification: true,
      };
      
      if (emailResult.skipped) {
        response.devOtp = otp;
        response.emailDisabled = true;
      }
      
      return res.status(403).json(response);
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: user.toJSON(),
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Sign in failed. Please try again.',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON(),
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'location', 'website', 'avatar', 'paymentMethod', 'upiId', 'bankDetails'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

export default router;

