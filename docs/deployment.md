# Click Crafters Portal Deployment

This portal is intentionally separate from the static marketing website. Do not copy it into `/var/www/clickcrafters`; deploy it as its own Next.js app for `portal.clickcrafters.click`.

## Environment Variables

Create `portal/.env.local` locally or set these in Vercel/VPS runtime:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://portal.clickcrafters.click
```

## Supabase Setup

1. Create a Supabase project.
2. In SQL Editor, run `portal/supabase/schema.sql`.
3. In SQL Editor, run `portal/supabase/seed.sql`.
4. In Authentication settings, enable email/password. Enable magic link if desired.
5. Add `https://portal.clickcrafters.click/auth/callback` to Auth redirect URLs.
6. Create an admin user in Supabase Auth, then run:

```sql
update public.profiles
set role = 'admin'
where email = 'owner@clickcrafters.click';
```

7. Create client users, then assign them:

```sql
update public.profiles
set role = 'client_admin'
where email = 'client@example.com';

insert into public.client_users (client_id, user_id)
select '11111111-1111-4111-8111-111111111111', id
from public.profiles
where email = 'client@example.com';
```

Row Level Security is enabled on all client data tables. Admins can read all clients. Client users can only read clients where a row exists in `client_users`.

## Build Commands

From the `portal` directory:

```bash
npm install
npm run build
npm run start
```

For production on a VPS, use a process manager such as PM2:

```bash
npm install
npm run build
pm2 start npm --name clickcrafters-portal -- start
pm2 save
```

By default Next.js starts on port `3000`. Use `PORT=3001 npm run start` if another app already uses port `3000`.

## NGINX Reverse Proxy

Create a separate NGINX server block for the portal subdomain:

```nginx
server {
    listen 80;
    server_name portal.clickcrafters.click;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then issue TLS:

```bash
sudo certbot --nginx -d portal.clickcrafters.click
sudo nginx -t
sudo systemctl reload nginx
```

## DNS

Add an `A` record for `portal.clickcrafters.click` pointing to the VPS IP address, or a `CNAME` if deploying through Vercel.

## Vercel Option

1. Import the repository into Vercel.
2. Set the project root to `portal`.
3. Add the environment variables above.
4. Add `portal.clickcrafters.click` as a custom domain.
5. Add the Vercel callback URL to Supabase Auth redirect URLs:

```text
https://portal.clickcrafters.click/auth/callback
```

This option avoids changing the existing NGINX configuration for `www.clickcrafters.click`.
