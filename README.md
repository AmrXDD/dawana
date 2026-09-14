# Dawana

Marketing site + control room for **Dawana** — a Kuwait-based pharmaceutical
distributor. Next.js 15 (App Router), React 19, TypeScript, Tailwind v4,
GSAP + Lenis, Supabase.

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

The site runs without Supabase — the catalogue shows honest empty states and
nothing throws. The admin needs the database to sign anyone in.

---

## Environment variables

See [`.env.example`](.env.example) for the annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public key; can only read published catalogue rows |
| `SUPABASE_SERVICE_ROLE_KEY` | yes, server only | Every admin read/write and the contact form |
| `ADMIN_SESSION_SECRET` | yes | 32+ random characters; signs the admin session cookie |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical origin for metadata/sitemap |

---

## Database

Paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
then [`0002_product_pages_and_collections.sql`](supabase/migrations/0002_product_pages_and_collections.sql),
into the Supabase SQL editor and run them in order. Both are idempotent. It creates the
catalogue, document stores, contact inbox, the control-room accounts table
and **row-level security**: the public key can only
read published catalogue rows; everything else goes through the server.

Document references are minted by `next_doc_seq()` inside the database, so two
admins issuing a receipt at the same moment can't collide on a number.

---

## Admin sign-in

Username + password — no email. Accounts live in `admin_accounts`; passwords
are scrypt hashes. Sessions are an HMAC-signed, httpOnly cookie, and the
account is re-checked on every admin request, so switching someone off or
resetting their password takes effect immediately. Five wrong passwords pause
an account for 15 minutes.

| Role | Access |
| --- | --- |
| Developer | Everything. Only developers can change developer accounts. |
| Administrator | Everything, including Team access. |
| Editor | Products, collections, document generators. |

New people are added from **Team access** in the admin — no SQL needed.

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
| Team access | Add people, set roles, reset passwords, switch accounts off |
| Site health | Live probes of the public catalogue, admin database, sign-in, runtime |

Each generator is a split workbench: editor on the left, **live A4 preview**
on the right. The preview is the real print component scaled with a CSS
transform, so what you see is what prints. `Print / PDF` opens the browser
dialog at true A4.

> The default contract clauses and proposal sections are drafting scaffolds,
> not legal advice. Review them with counsel before issuing.

---

## Deployment (Vercel)

1. Import the repo.
2. Add the environment variables (Production + Preview).
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
