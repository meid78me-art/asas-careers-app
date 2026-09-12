# ASAS Global Aluminum Extrusion — Careers Application System

A real, self-hosted employment application system: a bilingual (EN/AR) public
application form, a password-protected HR portal, an actual file-based
database, real file storage for CVs/IDs/photos, and Excel export — all
running on plain Node.js with no paid services required to start.

## What's inside

```
asas-careers-app/
  server.js          — the whole backend (API + serves the frontend)
  lib/db.js          — tiny JSON-file database (no native dependencies)
  lib/auth.js        — admin password check + login tokens
  public/
    index.html        — candidate application form
    admin.html         — HR portal
    js/candidate.js     — form logic (14 sections, matches what we built)
    js/admin.js         — HR dashboard logic
    css/style.css       — shared styling
    assets/logo.png     — your logo
  data/db.json        — created automatically; holds all applications
  uploads/<ref>/...   — created automatically; holds each candidate's files
```

## Running it locally (to try it out)

You need [Node.js](https://nodejs.org) 18 or newer installed.

```bash
cd asas-careers-app
cp .env.example .env        # then edit .env — see below
npm install
npm start
```

Open **http://localhost:3000** for the application form, and
**http://localhost:3000/admin.html** for the HR portal.

## Before you deploy — change these in `.env`

```
ADMIN_PASSWORD=<a real password only HR knows>
JWT_SECRET=<a long random string>
```

Generate a good random secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Never commit your real `.env` file** — `.gitignore` already excludes it.

## Deploying so it's live on the internet

This app needs a host that keeps a Node.js process running continuously
(not a static-site host) **and** gives it a persistent disk, because two
things must survive restarts and redeploys: `data/db.json` (the database)
and the `uploads/` folder (candidates' files).

**Straightforward options:**

- **Railway** (railway.app) — connect your GitHub repo, add the two
  environment variables above, attach a small persistent Volume mounted
  at `/data` — but note: point `uploads/` and `data/` there, or just mount
  the volume at the project root. Free/hobby tier available.
- **Render** (render.com) — "Web Service" from your repo, add a **Persistent
  Disk** (paid, small size is enough) mounted at the project folder, add
  the env vars in the dashboard. Render's free tier has *no* persistent
  disk, so uploaded files and the database would be wiped on every
  restart — fine only for a quick demo, not for real candidates.
- **A small VPS** (DigitalOcean, Hetzner, etc.) — most control, you run
  `npm install && npm start` (ideally under `pm2` so it restarts if it
  crashes) behind Nginx with a real domain and HTTPS (e.g. via Certbot).

**Important once it's live:** put it behind HTTPS (candidates are typing
national IDs and uploading passports — this must not travel in plain
HTTP). Railway and Render give you HTTPS automatically; on your own VPS,
use Certbot/Let's Encrypt.

## Where things live once it's running

- **All applications** are in `data/db.json` — this is your whole
  database. Back it up periodically (copy the file) since there's no
  separate backup system built in.
- **Every candidate's CV / ID / photo** is a real file under
  `uploads/<reference-number>/`.
- **Excel export** is generated on demand from `data/db.json` — always
  reflects exactly what's in the database at that moment, across 5
  sheets (Applications, Education, Employment History, Courses &
  Certificates, Relatives at ASAS).
- **Print / Save as PDF** in the HR portal opens a formatted one-page
  summary per candidate and triggers your browser's print dialog.

## Auto-updating Excel snapshot (no clicking required)

`auto-export.js` logs in and downloads the Excel export, then overwrites
one fixed file — by default `ASAS-Applications-Latest.xlsx` on your
Desktop. Run it manually once to test:

```bash
node auto-export.js
```

To run it automatically every 15 minutes on Windows, using Task Scheduler:

1. Open **Task Scheduler** (search for it in the Start menu).
2. **Create Task…** (not "Create Basic Task") → name it `ASAS Excel Auto-Export`.
3. **Triggers** tab → **New…** → Begin the task: *On a schedule* → Daily →
   set "Repeat task every" to **15 minutes**, "for a duration of" **Indefinitely**.
4. **Actions** tab → **New…**:
   - Program/script: `node`
   - Add arguments: `auto-export.js`
   - Start in: the full path to your `asas-careers-app` folder
     (e.g. `C:\Users\Administrator\Documents\asas-careers-app`)
5. **Conditions** tab → uncheck "Start the task only if the computer is on
   AC power" (so it still runs on battery, if this is a laptop).
6. Save. Right-click the task → **Run** to test it immediately — check
   your Desktop for the file, and check `auto-export.log` in the project
   folder if it didn't appear.

Note: this only works while `npm start` (the server) is also running —
the scheduled task talks to your local server the same way a browser
would.

## Scaling beyond this

The JSON-file database is intentionally simple and needs no setup — it's
fine for the volume a single manufacturing site's HR department sees
(hundreds to a few thousand applications). If ASAS later wants multiple
HR users with separate logins, audit logs, or applicant volumes in the
tens of thousands, that's the point to move `lib/db.js` to a real
database (e.g. PostgreSQL) — the rest of the app (routes, frontend)
would barely need to change, since they only talk to `lib/db.js`'s
functions, not to files directly.
