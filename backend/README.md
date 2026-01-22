# Let's Hang - Backend API

Backend server for the Let's Hang event platform with authentication, email verification, and more.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** - Local installation or MongoDB Atlas (free tier available)

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend` folder:

```bash
# Copy the example file
cp config/env.example.txt .env
```

**Minimal `.env` for local development (no email):**

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lets_hang
JWT_SECRET=your-super-secret-key-at-least-32-characters
FRONTEND_URL=http://localhost:5173
```

> **Note:** Email is OPTIONAL. If `SMTP_USER` and `SMTP_PASS` are not set, email sending is disabled and OTP codes are logged to the console instead.

### 3. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## Deploying to Render

### Backend (Web Service)

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. Add **Environment Variables:**

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ |
| `MONGODB_URI` | Your MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | A long random string (32+ chars) | ✅ |
| `FRONTEND_URL` | Your Vercel/Netlify frontend URL | ✅ |
| `RAZORPAY_KEY_ID` | Your Razorpay key ID | For payments |
| `RAZORPAY_KEY_SECRET` | Your Razorpay key secret | For payments |
| `SMTP_USER` | Email address | Optional |
| `SMTP_PASS` | App password | Optional |
| `SMTP_HOST` | `smtp.gmail.com` | Optional |
| `SMTP_PORT` | `587` | Optional |

### Frontend (Static Site)

Deploy to **Vercel** or **Netlify**:

1. Connect your GitHub repo
2. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` = Your Render backend URL (e.g., `https://lets-hang-api.onrender.com`)

---

## Feature Availability

| Feature | Local Dev | Render (Production) |
|---------|-----------|---------------------|
| Authentication | ✅ | ✅ |
| MongoDB | ✅ | ✅ (use Atlas) |
| Razorpay Payments | ✅ | ✅ |
| Email (OTP, Tickets) | Optional | Optional* |

> *Email is optional. Without SMTP configured:
> - OTP codes are logged to console (check Render logs)
> - Ticket emails are skipped (booking still works)
> - Welcome emails are skipped

---

## MongoDB Setup

**For Production (Render):** Use MongoDB Atlas (free tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account and M0 cluster
3. Create a database user with password
4. **Important:** Add `0.0.0.0/0` to IP whitelist (Render uses dynamic IPs)
5. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/lets_hang`

---

## Razorpay Setup

Razorpay works on Render (it's just HTTPS API calls).

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Get API keys from Settings → API Keys
3. Use **Test Mode** keys for development
4. Test credentials:
   - Card: `4111 1111 1111 1111` (any expiry, any CVV)
   - UPI: `success@razorpay`

---

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

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| GET | `/api/events/:id` | Get event details |
| POST | `/api/events` | Create event (auth required) |
| PUT | `/api/events/:id` | Update event (auth required) |
| DELETE | `/api/events/:id` | Delete event (auth required) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment/config` | Get Razorpay public key |
| POST | `/api/payment/create-order` | Create payment order |
| POST | `/api/payment/verify` | Verify payment signature |
| POST | `/api/payment/refund` | Process refund |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if API is running |

---

## Troubleshooting

### "Connection to MongoDB failed"
- For Atlas: Ensure `0.0.0.0/0` is in IP whitelist
- Check username/password in connection string
- Make sure database user has readWrite permissions

### "Email not sending"
- Check SMTP credentials are set in environment variables
- For Gmail: Use an App Password, not regular password
- **Or:** Leave SMTP vars empty - OTP codes appear in server logs

### "Payment gateway not configured"
- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables
- Use test mode keys for development

### "Invalid token"
- Token might have expired (7 days)
- User needs to sign in again

