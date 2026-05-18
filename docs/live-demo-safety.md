# Live Demo Safety Policy

This project supports a public live demo without exposing private admin access.

## Rules

- Do not expose a real admin email/password in README.
- Do not create or publish demo admin credentials.
- Do not publish student credentials unless intentionally creating disposable demo users.
- Users should create their own student account through the Register page.
- Admin access must remain private.
- Do not put real credentials in GitHub.
- Do not use a personal admin account as a demo account.
- Do not expose Supabase secrets.
- `.env.example` must contain placeholder values only.
- Never commit `.env.local`.

## Recommended README Live Demo Section

```md
## Live Demo

Live App: https://your-project-name.vercel.app

Users can create their own student account using the Register page.

Admin access is private and not shared publicly for security reasons.
```

## Environment Safety

Safe public examples:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Server-only secret:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or documentation screenshots.

## Git Ignore Requirements

```gitignore
.env
.env.local
.env.*.local
```

## Admin Access

Admin role is assigned through `ADMIN_EMAILS`:

```env
ADMIN_EMAILS=admin@example.com
```

The actual admin email should be set privately in local/Vercel environment variables and should not be published publicly.
