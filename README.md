# Motion-AI — sales website + protected download

Single-product sales site for **Motion-AI** (₹500 one-time, Windows desktop app).
Next.js (App Router) + TypeScript + Tailwind on the frontend, with the same
Next.js app's API routes acting as the backend for Razorpay verification and
protected downloads.

This project is **separate** from the Motion-AI Electron application itself —
it doesn't touch that codebase at all.

---

## Architecture

```
Website (Next.js pages)
   └─ existing Razorpay Payment Button (pl_TSp0dDD3WZ4hn2), embedded as-is
        └─ customer pays ₹500 on Razorpay's hosted checkout
             ├─ Razorpay → POST /api/razorpay/webhook   (authoritative)
             └─ browser redirected → /download?razorpay_...=...  (fast-path UX)

/download page
   → POST /api/purchase/verify   (checks redirect signature + webhook status)
   → if paid: short-lived single-use download token issued
   → GET /api/download?token=...  → streams the ZIP (or redirects to a
     presigned object-storage URL)
```

**Why two confirmation paths?** The redirect (`callback_url`) tells the
browser "the checkout finished," but a browser claim is never trusted alone.
The **webhook** is the only thing that ever marks a purchase `paid` in the
database. The redirect's signature is still verified — it's what makes it
safe to *ask* "is this specific payment_link_id paid yet?" without leaking
one customer's purchase status to another visitor guessing IDs.

---

## 1. Local setup

```bash
npm install
cp .env.example .env
# fill in .env — see section 2 below
npx prisma db push     # creates dev.db (SQLite) from prisma/schema.prisma
```

## 2. Environment variables

All variables are documented inline in `.env.example`. Summary:

| Variable | Where to get it |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Dashboard → Settings → Webhooks → (the secret you set when creating the webhook — **not** the API key secret) |
| `NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID` | Already set to `pl_TSp0dDD3WZ4hn2` — your existing button |
| `PRODUCT_PRICE_PAISE` | `50000` = ₹500.00. The backend re-checks every webhook against this value; it never trusts a client-provided amount. |
| `DOWNLOAD_TOKEN_SECRET` | `openssl rand -hex 32` |
| `DOWNLOAD_STORAGE_PROVIDER` | `local` for a single-server deploy, `s3` for R2/S3 |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL, no trailing slash |

**Never commit `.env`.** Only `.env.example` (placeholders) is tracked in Git.

## 3–4. Run the website + backend

They're the same process — one Next.js app:

```bash
npm run dev       # http://localhost:3000
```

## 5. Razorpay test-mode setup

1. In the Razorpay Dashboard, switch to **Test Mode** (toggle top-left).
2. Your existing Payment Button `pl_TSp0dDD3WZ4hn2` — confirm it's a test-mode
   button (test and live buttons have different IDs; if this one is live,
   create a matching test-mode button and use its ID in `.env` for local
   development, then switch back to the live ID in production).
3. Open the button's settings and confirm **"Collect customer details"**
   (name, email, contact) is enabled — that's how the site captures the
   customer identity used to key entitlements, since the site itself never
   shows its own separate payment form.
4. Set the button's **redirect URL** (sometimes called Callback URL) to:
   `http://localhost:3000/download` for local testing, or
   `https://your-domain.com/download` in production.

## 6. Webhook setup

1. Dashboard → Settings → Webhooks → **Add New Webhook**.
2. URL: `https://your-domain.com/api/razorpay/webhook`
   (must be public HTTPS — use `ngrok http 3000` for local testing and use
   the ngrok URL here instead of localhost).
3. Active events: enable **`payment_link.paid`** (primary) and
   **`payment.captured`** (fallback safety net).
4. Set a webhook secret — paste it into `RAZORPAY_WEBHOOK_SECRET` in `.env`.

## 7. Test payment

1. `npm run dev`, and in another terminal `ngrok http 3000` if testing
   webhooks locally.
2. Visit the site, click **Buy Motion-AI**, complete a Razorpay test payment
   (test card numbers are in the Razorpay docs).
3. Confirm:
   - The webhook fires and the `Purchase` row in the DB (`npx prisma studio`)
     shows `status: "paid"`.
   - The browser lands on `/download`, briefly shows "Payment processing…",
     then reveals the download button.
   - Clicking download streams the file once; reloading `/download` and
     downloading again issues a **new** token (the old one is already spent).
   - Visiting `/download` directly with no query params shows "Payment
     verification required."

## 8. Deployment steps

1. Deploy to any Node-capable host (Vercel, Railway, Render, a VPS, etc.).
2. Set all variables from `.env.example` in the host's environment config —
   **never commit them to Git.**
3. Point `DATABASE_URL` at a persistent managed database (see "Database" below).
4. Set `NEXT_PUBLIC_SITE_URL` to the real deployed URL, and update the
   Razorpay button's redirect URL and the webhook URL to match.
5. Switch the Razorpay button and API keys from test mode to live mode.
6. Run through the "Final acceptance test" checklist below against the live
   deployment before announcing the product.

### Database

`prisma/schema.prisma` ships configured for SQLite (`file:./dev.db`) for
zero-setup local development. For production:

1. Provision a persistent Postgres instance (Railway, Supabase, Neon, RDS…).
2. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` to the Postgres connection string.
4. Run `npx prisma db push` (or set up `prisma migrate` for versioned
   migrations) against the new database.

## 9. How to upload/update the Motion-AI customer ZIP

The **customer package must be a clean production build** — never the
developer/verified package at
`C:\Users\ASUS\Documents\Motion-AI\out\final-package-19\motion-ai-win32-x64`,
which may contain personal/dev project data. Build a clean release, zip it,
then:

- **Local / single-server (`DOWNLOAD_STORAGE_PROVIDER=local`):** copy the
  ZIP to the path set in `LOCAL_DOWNLOAD_PATH` — a location **outside**
  `/public` and outside the Git repo (e.g. `/secure-files/...` on the
  server). Update `LOCAL_DOWNLOAD_FILENAME` if the filename changed.
- **Object storage (`DOWNLOAD_STORAGE_PROVIDER=s3`, works for AWS S3 or
  Cloudflare R2):** upload the ZIP to the private bucket at the key set in
  `S3_OBJECT_KEY`. Keep the object private — the app generates a 90-second
  presigned URL per authorized download; it's never public.

Either way, **the ZIP is never committed to Git** and never sits at a
guessable permanent URL like `/Motion-AI.zip`.

## 10. How to change the product version

Update `NEXT_PUBLIC_PRODUCT_VERSION` in `.env` (shown on the download page)
and `LOCAL_DOWNLOAD_FILENAME` / `S3_OBJECT_KEY` to point at the new build.
The price (`PRODUCT_PRICE_PAISE`) is separate — change it only if the actual
Razorpay Payment Button's price also changes, since the backend cross-checks
the two.

---

## Security notes

- Razorpay `Key Secret` and `Webhook Secret` are read only in server-side API
  routes (`src/app/api/**`) — never in a `NEXT_PUBLIC_*` variable, never sent
  to the browser.
- Webhook signature verification uses the **raw request body** (`req.text()`,
  not `req.json()` then re-stringified) against `RAZORPAY_WEBHOOK_SECRET`.
- Webhook processing is idempotent: a SHA-256 hash of the verified raw body
  is the primary key of `WebhookEvent`, so redeliveries are safe no-ops.
- The backend re-derives the expected amount from `PRODUCT_PRICE_PAISE` on
  every webhook — a tampered client-side amount is never trusted.
- Download tokens are random 32-byte values; only their SHA-256 hash is
  stored, they expire in `DOWNLOAD_TOKEN_TTL_SECONDS` (default 120s), and
  each is redeemable exactly once (enforced with a conditional DB update).
- `/api/download` is rate-limited per IP (in-memory; swap for Redis if you
  run more than one server instance).
- Local file delivery only ever reads the single path in
  `LOCAL_DOWNLOAD_PATH` from server config — there is no user-controlled
  filename, so there's no directory-traversal surface.

## Final acceptance test

Before calling this live, verify against the real deployment:

1. Product page loads and shows ₹500.
2. The existing Razorpay button renders and opens checkout.
3. A **test-mode** payment completes successfully.
4. The webhook fires and a `Purchase` row is created with `status: "paid"`
   — check this in the database, not just the browser.
5. `/download` does not reveal the file before the webhook has confirmed
   payment (try loading it with no query params — should say "Payment
   verification required.").
6. An authorized download works and the ZIP is intact.
7. Re-using the same `token` query value a second time fails.
8. Reloading `/download` without a fresh checkout does not grant a new
   download by itself.
9. Secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
   `DOWNLOAD_TOKEN_SECRET`) are absent from browser dev tools → Network/Sources.
10. `git status` / your repo history has no `.env` file committed.
11. Mobile and desktop layouts both look right.

Don't consider payment "verified" from the frontend redirect alone —
always confirm the webhook actually landed and wrote a `paid` row.
