# Bozos United

Aakriti and Riley's wedding planning hub. Next.js + Supabase (auth, database, file storage).

## What's in v1

- Real accounts (email + password), with per-person, per-section permissions
- Hub page matching the design we agreed on
- Indian wedding, American wedding, court wedding, bachelor/bachelorette, and honeymoon —
  each with events, and per-event venues/vendors/attire/food/performances, each with a
  link, cost, and a considering/booked status. Mark one "considering" option as your top
  pick and it counts toward the projected total; only booked items count as locked in.
- Attire items support a photo upload
- One master guest list, filterable by side and by event, feeding every department's
  guest count automatically
- One budget dashboard rolling up every department's projected and booked totals
- Wedding prep with six categories per person (hair, facial skincare, body skincare, gut
  health, diet, exercise), routines, and daily check-ins — you can see your partner's
  progress but only edit your own
- An activity feed on the hub showing who changed what, and an Admin page to control who
  can see which sections

## One-time setup (about 20 minutes)

1. **Create a Supabase project** at supabase.com (free tier is fine).
2. In the Supabase dashboard, open **SQL Editor**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates every table, the permission rules, and
   the edit-history logging.
3. Open **Storage**, create a new bucket named `attire`, and mark it **public** (this is
   what lets attire photos display once uploaded).
4. Open **Settings → API** and copy your **Project URL** and **anon public key**.
5. Push this folder to a new GitHub repository.
6. Go to vercel.com, sign in with GitHub, and import that repository. When prompted for
   environment variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
7. Deploy. Vercel gives you a live `https://...vercel.app` URL — that's the app, ready to
   open on any phone or computer, and to "Add to Home Screen" on mobile.

## Making Aakriti and Riley the owners

New accounts start with only guest-list access (see `handle_new_user` in the schema) so a
random signup can't see everything. To make yourselves full owners the first time:

1. Visit `/signup` and create Aakriti's and Riley's accounts.
2. Back in Supabase's SQL Editor, run (swap in your real emails):

```sql
update profiles set permissions = array['admin','indian','american','court','bachelor','honeymoon','prep','guests','budget']
where id in (select id from auth.users where email in ('aakriti@example.com', 'riley@example.com'));
```

From then on, you can manage everyone else's access from the in-app **Admin** page — no
more SQL needed.

## Local development

```
npm install
cp .env.local.example .env.local   # fill in your Supabase URL and anon key
npm run dev
```

## Known v1 simplifications (things we'll refine together)

- To-do lists are currently visible/editable by anyone signed in, not gated per
  department — easy to tighten once real usage shows whether that matters.
- RSVP import from an external RSVP site isn't automated yet — once you pick a platform
  (Zola, a Google Form, RSVPify, etc.) we'll wire up the right import for it.
- The app manifest for home-screen installs is minimal (no custom icon yet) — quick to
  add once you have a logo or photo you want to use.
- Row-level security is functional but written for a small trusted household, not a
  public product — worth a second pass before inviting anyone outside family.
