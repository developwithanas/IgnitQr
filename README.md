# IgniteQR

**Turn happy customers into Google reviews with one QR scan.**

IgniteQR gives every shop a QR code. When customers scan it, they rate their visit. Happy customers get a ready-to-edit review and a one-tap path to the shop's Google review page. Unhappy customers can send a private message to the owner, and they can still post publicly if they want to. The owner sees everything in a dashboard.

Built for Indian small businesses: prices are in ₹, and payments go through Razorpay (UPI, cards and netbanking).

---

## Features

### For shop owners
- **QR code per business location**, ready to print and put on the counter
- **Review suggestions**: AI-written (Gemini) on paid plans, simple templates on the free plan
- **Private feedback inbox** for 1–3 star ratings, so the owner hears about problems first
- **Dashboard** with ratings, trends and recent feedback
- **Self-serve plans** with instant activation after payment

### For customers (the feedback page)
- One neutral question: *"How was your experience?"*
- 4–5 ★: an editable review draft → **Copy & Post on Google**
- 1–3 ★: a private message to the owner, with the Google option still offered

The feedback flow follows Google's review policy. No customer is blocked from leaving a public review, and every draft is editable.

### Accounts
- Email and password sign-up and sign-in
- **Sign in with Google**
- Forgot password and reset by email
- Email OTP verification (switch it on once a sending domain is verified)
- The chosen plan is remembered through sign-up, and checkout opens right after

### Payments (fully automatic)
- Razorpay Checkout with UPI QR, UPI apps, cards and netbanking
- The plan activates instantly after payment. A **webhook** also activates it if the customer closes the browser mid-payment
- Activation is idempotent: the same payment can never be counted twice
- Coupon codes, plan expiry, renewal reminders and a success banner

### Admin panel (`/admin`)
- **Users**: who is online, last login, devices, total time spent, login history
- **Actions**: block or unblock, force logout, grant a free plan, make staff, send a password-reset link, create or delete accounts
- **Payments**: all orders, with manual approve or reject if ever needed
- **Audit log** of every admin action

---

## Plans

| | Starter | Professional | Enterprise |
|---|---|---|---|
| Price | Free | ₹999 / 30 days | ₹1999 / 30 days |
| Business locations | 1 | 3 | Unlimited |
| Feedback per month | 50 | Unlimited | Unlimited |
| Review suggestions | Templates | AI | AI |

Limits are enforced on the server. Prices, limits and coupons all live in one file: [`lib/plans.ts`](lib/plans.ts).

Plans do not auto-renew. The owner renews from the dashboard when a plan is about to expire.

---

## Tech stack

| Part | Used |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) with Prisma 5 |
| Auth | Custom signed-cookie sessions, checked against the database, plus Google OAuth |
| Payments | Razorpay Orders API, signature verification and webhook |
| AI | Google Gemini |
| Email | Resend |
| Rate limiting | Upstash Redis (optional) |
| Hosting | Render |

---

## Run it locally

You need Node.js 20+ and a PostgreSQL database (a free Supabase project works).

```bash
git clone https://github.com/developwithanas/IgnitQr.git
cd IgnitQr
npm install

# 1. Create a .env file (see "Environment variables" below)

# 2. Create the database tables
npx prisma db push

# 3. Start the app
npm run dev
```

Then open http://localhost:3000.

For a production build:

```bash
npm run build
npm run start
```

---

## Environment variables

Create a file called `.env` in the project root. **Never commit it.** It is already in `.gitignore`.

### Required

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string (Supabase transaction pooler) |
| `DIRECT_URL` | Postgres direct or session connection, used by Prisma for schema changes |
| `JWT_SECRET` | A long random string that signs login cookies. The app refuses to start sessions in production without it |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site, e.g. `https://your-app.onrender.com`. Use no trailing slash |
| `RAZORPAY_KEY_ID` | Razorpay key: `rzp_test_...` for testing, `rzp_live_...` for real money |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you set on the Razorpay webhook |

### Optional

| Variable | What it is |
|---|---|
| `GEMINI_API_KEY` | Enables AI review suggestions. Templates are used without it |
| `RESEND_API_KEY` | Sends password-reset and OTP emails |
| `RESEND_FROM_EMAIL` | Sender address on your verified domain, e.g. `IgniteQR <no-reply@yourdomain.com>` |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to require an email OTP at sign-up. Keep it `false` until your Resend domain is verified |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID. The "Continue with Google" button appears only when this is set |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SUPER_ADMIN_EMAILS` | Comma-separated admin emails. Defaults to the owner's email |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for rate limiting. If missing, the app skips rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Phone number shown on the Contact page |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Address shown on the Contact page |

> `NEXT_PUBLIC_*` values are built into the page when the app is built. After changing one, rebuild or redeploy.

---

## Deploying on Render

1. Create a **Web Service** from this GitHub repo.
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run start`
2. Add every variable from the tables above under **Environment**.
3. **Google login**: in Google Cloud Console → Credentials → your OAuth client, add this redirect URI:
   `https://<your-site>/api/auth/google/callback`
   Then publish the OAuth consent screen.
4. **Razorpay webhook**: in the Razorpay Dashboard → Webhooks, add:
   - URL: `https://<your-site>/api/payments/webhook`
   - Event: `payment.captured`
   - Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
5. **Keep it awake** (free Render plan only): set up a free job on [cron-job.org](https://cron-job.org) that calls `https://<your-site>/api/ping` every 10 minutes.

### Going live with real payments
1. Complete Razorpay account activation (KYC). Add your website link and the Terms, Privacy and Refund pages.
2. In Live Mode, generate live API keys and create a live webhook (see step 4 above).
3. Replace the three `RAZORPAY_*` values on Render with the live ones. No code change is needed. The ₹1 test coupon switches off automatically with live keys.

---

## Project structure

```
app/
  page.tsx                 Landing page and pricing
  feedback/[id]/           Public page customers reach by scanning the QR
  dashboard/               Shop owner dashboard
  admin/                   Admin panel (staff and admins only)
  sign-in, sign-up, forgot-password, reset-password, verify-email
  terms, privacy, refund-policy, contact
  api/
    auth/                  login, signup, logout, Google OAuth, password reset, OTP
    payments/              quote, create-order, webhook
    verify-payment/        Confirms a Razorpay payment from the browser
    admin/                 User and payment management
    business, reviews, generate-quotes, generate-review, activity, ping
components/                UI (PaymentModal, CheckoutLauncher, LandingUI, admin/...)
lib/
  plans.ts                 Prices, plan limits, coupons
  usage.ts                 Per-owner usage against plan limits
  auth.ts                  Sessions, passwords, roles
  payments.ts, razorpay.ts Order creation and plan activation
  email.ts                 Resend emails
prisma/schema.prisma       Database schema
proxy.ts                   Protects /dashboard and /admin
```

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Make a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check the code with ESLint |
| `npx prisma db push` | Update database tables to match `schema.prisma` |
| `npx prisma studio` | Browse the database in a web UI |

---

## Support

Email: **developwithanas@gmail.com**

© IgniteQR. All rights reserved.
