# DynamicMail

DynamicMail is a SaaS that lets ecommerce brands send **emails that update *after* they’re sent**.

Instead of static images and text, emails use **dynamic blocks** (hero banners, countdowns, stock notices, recommendations) that are rendered in real time whenever the email is opened — using live Shopify data, personalization rules, and caching.

---

## ✨ Core Features

- **Dynamic email blocks**
  - Hero banners
  - Countdowns (sales, launches, drops)
  - Live stock / availability
  - Price & offer updates
- **Shopify integration**
  - OAuth connection to a Shopify store
  - Live product, price, and inventory data
- **Render API**
  - Public image endpoint per block
  - Safe for email clients (renders as PNG/WebP)
  - Edge-optimized + caching
- **Personalisation-ready**
  - Supports query-based segments (e.g. `?segment=vip`)
  - Config stored as JSON per block
- **Analytics**
  - Render events (proxy for opens)
  - Per-block stats
- **Billing**
  - Stripe subscriptions
  - Plan metadata for usage limits (renders/month, blocks, etc.)

---

## 🧱 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript  
- **Styling**: Tailwind CSS (+ optional ShadCN UI components)  
- **Auth**: NextAuth.js  
- **Database**: PostgreSQL + Prisma ORM  
- **Caching**: Redis (Upstash or equivalent)  
- **Background / Edge**: Vercel Edge Functions or Node runtime  
- **Payments**: Stripe (Subscriptions)  
- **Ecommerce**: Shopify Admin API (OAuth)

---

## 🚀 Deployment

DynamicMail is a Next.js application, which can be easily deployed to platforms like [Vercel](https://vercel.com/docs/concepts/next.js/deploying) or [Netlify](https://docs.netlify.com/integrations/frameworks/next-js/).

### Environment Variables

The application relies on several environment variables for proper functioning. Ensure these are set in your deployment environment (e.g., Vercel Project Settings, Netlify Build environment variables). The application includes a validation step that will fail fast if critical variables are missing or incorrectly formatted.

| Variable             | Description                                                   |
| :------------------- | :------------------------------------------------------------ |
| `DATABASE_URL`       | Connection string for your PostgreSQL database (e.g., from Neon, Supabase, Render). |
| `NEXTAUTH_URL`       | The canonical URL of your deployed application (e.g., `https://your-domain.com`). Used by NextAuth.js. |
| `NEXTAUTH_SECRET`    | A long, random string used to sign NextAuth.js cookies. Generate one with `openssl rand -base64 32`. |
| `SHOPIFY_API_KEY`    | Your Shopify Partner App client ID.                           |
| `SHOPIFY_API_SECRET` | Your Shopify Partner App client secret.                       |
| `REDIS_URL`          | Connection string for your Redis instance (e.g., Upstash Redis). Used for caching. |

### Build & Start

To build the application for production:

```bash
npm run build
```

To start the application in production mode:

```bash
npm run start
```

---

## 🗂 Project Structure (high-level)

```txt
.
├─ prisma/
│  └─ schema.prisma          # User, Shop, Block, RenderEvent, etc.
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # Root layout
│  │  ├─ page.tsx            # Dashboard / home
│  │  ├─ shops/              # Shopify connection & list
│  │  ├─ blocks/             # Block CRUD + analytics
│  │  ├─ billing/            # Billing UI (Stripe)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts    # NextAuth
│  │     ├─ shopify/                       # OAuth + callback
│  │     ├─ blocks/                        # Block CRUD APIs
│  │     ├─ render/[blockId]/route.ts      # Dynamic image render
│  │     └─ billing/webhook/route.ts       # Stripe webhook
│  ├─ lib/
│  │  ├─ db.ts               # Prisma client
│  │  ├─ auth.ts             # Auth helpers
│  │  ├─ shopify.ts          # Shopify helpers
│  │  ├─ render-block.tsx    # React component → image
│  │  ├─ cache.ts            # Redis helpers
│  │  └─ billing.ts          # Stripe helpers & plan logic
│  └─ components/
│     └─ ui/                 # Reusable UI components
├─ .env.example
├─ package.json
└─ next.config.mjs
