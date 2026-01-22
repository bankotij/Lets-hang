# Let's Hang - Backend API

Backend server for the Let's Hang event platform with authentication, email verification, and more.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** - Local installation or MongoDB Atlas (free tier available)

## Quick Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` folder:

```bash
# Copy the example file
cp config/env.example.txt .env
```

Then edit `.env` with your settings:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (choose one)
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/lets_hang
# Or MongoDB Atlas (free):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lets_hang

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-key-at-least-32-characters

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail SMTP Setup

To use Gmail for sending emails:

1. **Enable 2-Factor Authentication** on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new App Password (select "Mail" and "Windows Computer")
4. Use this 16-character password as `SMTP_PASS`

### 4. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start the MongoDB service
- Use: `MONGODB_URI=mongodb://localhost:27017/lets_hang`

**Option B: MongoDB Atlas (Free Cloud)**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a free M0 cluster
4. Create a database user
5. Whitelist your IP (or 0.0.0.0/0 for all)
6. Get your connection string and update `.env`

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
🚀 Let's Hang API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server:     http://localhost:5000
📡 Health:     http://localhost:5000/api/health
🔐 Auth API:   http://localhost:5000/api/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Connected to MongoDB
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user, sends OTP |
| POST | `/api/auth/verify-otp` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP code |
| POST | `/api/auth/signin` | Sign in with email/password |
| GET | `/api/auth/me` | Get current user (requires auth) |
| PUT | `/api/auth/profile` | Update profile (requires auth) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if API is running |

## Email Templates

The server sends beautiful HTML emails:

1. **OTP Email** - 6-digit verification code with 10-minute expiry
2. **Welcome Email** - Sent after successful verification

## Project Structure

```
server/
├── index.js              # Express server entry
├── package.json          # Dependencies
├── config/
│   ├── database.js       # MongoDB connection
│   └── env.example.txt   # Environment template
├── models/
│   └── User.js           # User schema
├── routes/
│   └── auth.js           # Auth endpoints
├── services/
│   └── emailService.js   # Email sending + templates
└── middleware/
    └── auth.js           # JWT authentication
```

## Troubleshooting

### "Connection to MongoDB failed"
- Check if MongoDB is running
- Verify your MONGODB_URI is correct
- For Atlas: Check IP whitelist and credentials

### "Failed to send email"
- Verify SMTP credentials
- For Gmail: Make sure you're using an App Password, not your regular password
- Check if 2FA is enabled on your Google account

### "Invalid token"
- Token might have expired (7 days)
- User needs to sign in again

