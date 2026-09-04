# Moving Noor Mahal / Sirajul Huda site to Supabase

What changed: the site no longer saves data in the browser's `localStorage`
(only visible on one device). It now reads and writes a real Supabase
database, so **every visitor sees the same live results**, and results
update instantly on everyone's screen the moment the admin publishes them
(no page refresh needed).

Files in this package:
- `index.html`, `style.css`, `script.js` — the site (script.js was rewritten)
- `supabase-config.js` — put your project's URL + key here
- `supabase-schema.sql` — run once to create the database

## 1. Create the Supabase project
1. Go to supabase.com → sign in → **New project**.
2. Pick an organization, name the project, set a database password (save it), pick a region close to your users, and create it. Wait ~2 minutes for provisioning.

## 2. Create the tables
1. In the project dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase-schema.sql` and click **Run**.
   This creates the `groups`, `students`, `competitions`, `results`, and
   `gallery` tables, seeds them with the existing groups/students/competitions,
   and sets up the security rules described below.

## 3. Get your API keys
1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `supabase-config.js` and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   The anon key is meant to be public/visible in client-side code — it only
   allows what the database's row-level security rules (below) permit.

## 4. Turn on Realtime (live updates)
The SQL script already ran `alter publication supabase_realtime add table ...`
for `results`, `competitions`, and `gallery`. If you ever add more tables you
want to live-update, add them the same way, or via
**Database → Replication** in the dashboard.

## 5. Create the admin account
The old hardcoded email/password and fake OTP are gone — admin login now
uses real Supabase Auth:
1. Go to **Authentication → Users → Add user**.
2. Enter the admin's email and a password, and check "Auto Confirm User".
3. That's the account used to sign in on the site's Admin tab.
4. "Forgot password" on the site now sends a **real password-reset email**
   through Supabase. For that to work, go to **Authentication → URL
   Configuration** and add the site's URL (e.g. `https://your-site.pages.dev`)
   to the **Redirect URLs** list.
5. By default Supabase uses its own shared email sender for auth emails —
   fine for testing, but for production go to **Authentication → Providers →
   Email → SMTP Settings** and connect your own email provider (e.g.
   Gmail/SendGrid/Resend) so reset emails don't land in spam.

## 6. Who can see and change what (Row Level Security)
Already set up by the SQL script, summarized here:
- **Everyone** (no login) can **read**: groups, students, competitions,
  published results, and gallery posters.
- **Draft (unpublished) results are hidden** from the public — only a
  signed-in admin can see them, so half-finished placements never leak.
- Only a **signed-in admin** (the account from step 5) can add/edit/delete
  competitions, students, and results, or publish/revoke a result.

## 7. Host the site
Any static host works since this is still plain HTML/CSS/JS:
- **Cloudflare Pages** or **Netlify**: drag-and-drop the folder (or connect
  the GitHub repo) — no build step needed.
- **Vercel**: same, framework preset "Other".
- **GitHub Pages**: push the folder to a repo and enable Pages on it.

Whichever you pick, put its final URL into Supabase's **Redirect URLs**
(step 5.4) so password-reset links work.

## 8. Test it
1. Open the deployed site in two browser tabs (or two devices).
2. In one tab, sign in as admin and publish a result.
3. The other tab should update within a second or two, with no refresh.
4. Try "Forgot password" and confirm the reset email arrives and works.

## Notes / things you may want to add later
- **Posters** are currently stored as base64 image data directly in the
  `gallery` table (simplest option, works fine for a school event's volume
  of posters). If the gallery grows large, moving posters to **Supabase
  Storage** (a file bucket) and storing just the URL would be more efficient.
- **Groups** (Kanz/Jawhar) are seeded but have no admin UI to add more,
  matching the original app's behavior — add more via the SQL editor or a
  small admin form if you need a third group later.
- Free-tier Supabase projects pause after a week of no API activity; the
  first request after a pause takes a few extra seconds to wake it up.
