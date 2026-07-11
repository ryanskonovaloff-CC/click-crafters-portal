# Repository Guardrails

- Preserve Supabase Row Level Security (RLS) and client isolation.
- Never use the service-role key in browser/client code.
- Never apply production migrations automatically.
- Never delete production users or data without explicit approval.
- All client-owned queries must require a client ID.
- Do not modify unrelated files.
- Run lint and production build before completion.
- Document any migration or authentication risk.
