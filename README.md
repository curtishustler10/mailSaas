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
