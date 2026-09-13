# Dawana

Marketing site + control room for **Dawana** — a Kuwait-based pharmaceutical
distributor. Next.js 15 (App Router), React 19, TypeScript, Tailwind v4,
GSAP + Lenis, Supabase, Resend.

---

## Brand

Everything is locked to the supplied brand book (*Beyond The Logo*) and the
Q1 2026 company profile. Company facts live in one place —
[`src/lib/brand.ts`](src/lib/brand.ts) — so nothing is invented in components.

| Token | Value |
| --- | --- |
| Mint | `#5cbca7` |
| Deep teal | `#035a51` |
| White / Black | `#ffffff` / `#000000` |
| Tagline | Your Everyday Remedy |

The logo artwork in `public/brand/` was extracted from the supplied PDF and
made transparent — it is the real lockup, never re-typeset. Light variants
(`*-light.png`) recolour the deep-teal glyphs so the mark survives on dark.

**Type:** Bricolage Grotesque (display) · Inter (body) · JetBrains Mono
(eyebrows, references, figures).

**Motif:** the ECG pulse from the wordmark drives the motion system — the
hero trace, section rules, and the single heartbeat on the CTA↔footer seam.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

The site runs without Supabase or Resend — the catalogue shows honest empty
states, the admin runs in preview mode, and the document generators still
print. Nothing throws.

---

## Environment variables

See [`.env.example`](.env.example) for the annotated list. Short version:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public key; RLS does the protecting |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Bypasses RLS — never expose |
| `RESEND_API_KEY` | for email | Contact form + document delivery |
| `RESEND_FROM_EMAIL` | for email | Must be a Resend-verified domain |
| `CONTACT_INBOX_EMAIL` | optional | Where enquiries land |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical origin for metadata/sitemap |

---

## Database

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
in the Supabase SQL editor (or `supabase db push`). It creates the catalogue,
document stores, contact inbox, storage buckets and **row-level security**.

Then grant yourself admin access — being logged in is not enough, membership
of `admin_users` is what authorises writes:

```sql
insert into public.admin_users (id, email, full_name, role)
select id, email, 'Your Name', 'owner' from auth.users where email = 'you@dawa-na.com';
```

Document references are minted by `next_doc_seq()` inside the database, so two
admins issuing a receipt at the same moment can't collide on a number.

---

## Admin — `/admin`

| Screen | What it does |
| --- | --- |
| Overview | Catalogue counts, recent documents, latest enquiries |
| Products | Full CRUD, search, area filter, publish/feature toggles |
| Collections | CRUD + ordering |
| Receipts | Generator matching the printed receipt from the brand book |
| Contracts | Distribution agreement from an editable clause set |
| Proposals | Cover + narrative + costed investment schedule |
| Site health | Live probes of database, auth, storage, email, runtime |

Each generator is a split workbench: editor on the left, **live A4 preview**
on the right. The preview is the real print component scaled with a CSS
transform, so what you see is what prints. `Print / PDF` opens the browser
dialog at true A4.

> The default contract clauses and proposal sections are drafting scaffolds,
> not legal advice. Review them with counsel before issuing.

---

## Deployment (Vercel)

1. Import the repo.
2. Add the environment variables (Production + Preview). Keep
   `SUPABASE_SERVICE_ROLE_KEY` out of Preview unless you need it.
3. Add `www.dawa-na.com` under Domains.
4. Deploy.

[`vercel.json`](vercel.json) sets the region to `fra1` (closest to Kuwait of
the standard regions), security headers, immutable caching for brand assets,
`no-store` on `/api/health`, and `noindex` on `/admin`.

---

## Notes / follow-ups

- **Hero photography.** `public/media/kuwait-towers.jpg` is a 612×408 iStock
  *preview*. It needs replacing with a licensed, full-resolution file before
  launch — both for rights and because it upscales poorly on large displays.
- **Partner logos** are database-driven; the page shows an empty state until
  rows exist. No partner names are hard-coded.
- **Revenue / headcount figures** from the profile were vector outlines and
  couldn't be read reliably, so they are deliberately absent rather than
  guessed. Add them as CMS-editable stats when you have the numbers.
- `src/components/{CardNav,ScrollExpand,SideRays}.jsx` are vendored from
  react-bits. They're typed via `src/components/react-bits.d.ts` and themed
  through CSS overrides in `globals.css` (`.dawana-nav`) rather than forked,
  so re-installing them stays a clean operation.
