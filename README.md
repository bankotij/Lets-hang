# Let's Hang

## 1. Project Overview
Let's Hang is a full-stack event discovery and hosting platform where users can create, share, and join local events. The app features real authentication, payment processing, and event management.

**Key Features:**
- User authentication with email/OTP verification
- Event creation with ticket tiers, add-ons, and custom questions
- Razorpay payment integration
- Event discovery and search
- Host earnings and payout management

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│              (React + TypeScript + Tailwind)                │
│                    Vercel Deployment                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│                 (Node.js + Express)                         │
│                   Render Deployment                         │
├─────────────────────────┬───────────────────────────────────┤
│                         │                                   │
│    ┌────────────────────┼────────────────────┐              │
│    ▼                    ▼                    ▼              │
│ MongoDB            Razorpay              SMTP               │
│ (Atlas)            (Payments)         (Optional)            │
└─────────────────────────────────────────────────────────────┘
```

**Frontend Components:**
- `src/App.tsx` - Routing entry point
- `src/features/event` - Event creation and management
- `src/features/search` - Event discovery
- `src/features/profile` - User profile management
- `src/state/` - Jotai atoms for auth and event state
- `src/api/` - API client functions

**Backend Components:**
- `routes/auth.js` - Authentication endpoints
- `routes/events.js` - Event CRUD operations
- `routes/payment.js` - Razorpay integration
- `services/` - Email, tickets, payouts
- `models/` - Mongoose schemas

## 3. Design Principles

1. **Email is optional** → OTP codes are shown in-app when SMTP isn't configured
2. **Graceful degradation** → Payments work without Razorpay (free events only)
3. **JWT-based auth** → Stateless authentication with 7-day token expiry
4. **Monorepo structure** → Frontend and backend in one repo for simplicity

## 4. Critical Workflows

**User Registration**
1. User submits email/password
2. Backend generates 6-digit OTP
3. If SMTP configured: email sent; otherwise: OTP returned in response
4. User verifies OTP → JWT token issued

**Event Creation**
1. Host fills event details (draft stored in Jotai atom)
2. On publish: POST to `/api/events`
3. Backend validates and stores in MongoDB
4. Event appears in search results

**Joining an Event**
1. User selects ticket tier and add-ons
2. If paid: Razorpay checkout opens
3. On payment success: POST to `/api/events/:id/join`
4. User added to attendees list

## 5. Failure Modes & Guarantees

| Scenario | Behavior |
|----------|----------|
| MongoDB down | API returns 500, frontend shows error |
| Razorpay not configured | Paid events can't process payments |
| SMTP not configured | OTP shown in-app, emails skipped |
| Invalid JWT | 401 response, user redirected to login |

**Guarantees:**
- Passwords hashed with bcrypt
- JWT tokens expire after 7 days
- Rate limiting on auth routes (20 req/15min)

## 6. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite, Jotai |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Payments | Razorpay |
| Auth | JWT, bcrypt |
| Hosting | Vercel (frontend), Render (backend) |

## 7. Environment Variables

**Backend (`backend/.env`):**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lets_hang
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# Optional
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
SMTP_USER=your@email.com
SMTP_PASS=app-password
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000/api
```

## 8. Running Locally

**Prerequisites:** Node.js 18+, MongoDB

```bash
# Backend
cd backend
cp config/env.example.txt .env  # Edit with your values
npm install
npm run dev                      # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

## 9. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/verify-otp` | Verify email |
| POST | `/api/auth/signin` | Login |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| POST | `/api/events/:id/join` | Join event |
| GET | `/api/health` | Health check |

## 10. Scope & Limitations

- No real-time updates (polling-based)
- Single currency (INR) for payments
- No image hosting (base64 or external URLs only)
- No admin dashboard
