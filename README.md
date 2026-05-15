# Click Crafters Client Portal

Secure Next.js client portal for `portal.clickcrafters.click`.

## Included

- Supabase Auth with email/password and magic link callback support
- Client-scoped dashboard routes
- Admin-only client and user views
- RLS-ready Supabase schema
- Press Burger sample data
- Recharts dashboard components
- Dark Click Crafters-inspired UI

## Local Setup

```bash
cd portal
cp .env.example .env.local
npm install
npm run dev
```

Run the SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Deployment instructions are in `docs/deployment.md`.
