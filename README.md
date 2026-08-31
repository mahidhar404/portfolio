# Portfolio

A personal portfolio site where **every word on the page comes from a database**.
Nothing is hard-coded in React — not a heading, not a bio line, not a project title.
Once it is deployed, updating your portfolio means editing a form, never editing code.

- **Frontend** — React 19 + TypeScript, deployed to Vercel. This is the link you put on LinkedIn.
- **Backend** — Django 5 + DRF, deployed to Render. Admin panel and Swagger live here.
- **Database** — Postgres on Neon. SQLite locally, so a clean clone runs with zero setup.

---

## Table of contents

- [Run it locally in five minutes](#run-it-locally-in-five-minutes)
- [Putting your own information in](#putting-your-own-information-in)
- [Deploying](#deploying)
- [Environment variables](#environment-variables)
- [Adding a new resume section](#adding-a-new-resume-section)
- [Everyday commands](#everyday-commands)
- [How the pieces fit](#how-the-pieces-fit)

---

## Run it locally in five minutes

You need [uv](https://docs.astral.sh/uv/getting-started/installation/), Node 22+, and pnpm
(`corepack enable pnpm`).

```bash
make install
make seed
```

Then in two terminals:

```bash
make dev-backend
```

```bash
make dev-frontend
```

Open **http://localhost:5173** and you will see a complete portfolio for a fictional engineer
called Alexandra Reinhardt. That demo content is what you are about to replace with your own.

Prefer containers? `make docker-up` runs Postgres, the API, and the frontend together.

---

## Putting your own information in

This is the part that matters. There are three ways in; **the admin is the one you will use.**

### 1. The Django admin — point and click (recommended)

```bash
make superuser
```

Pick a username and password, then open **http://localhost:8000/admin/**.

Work through it in this order — later sections refer back to earlier ones:

| Step | Where | What to do |
|------|-------|------------|
| 1 | **Profile** | Your name, headline, summary, photo, contact details, résumé PDF. |
| 2 | **Site settings** | Site title, meta description, colours, and which sections show. |
| 3 | **Skill categories** | Create your groupings first: "Languages", "Backend", "Tools". |
| 4 | **Skills** | Add skills into those categories with a 1–5 proficiency. |
| 5 | **Experience** | Each role. Bullets are added inline, and drag to reorder. |
| 6 | **Education** | Degrees. Pick the right **grade scale** — see the note below. |
| 7 | **Projects** | Title, summary, case study, cover image, tech stack. |
| 8 | Everything else | Certifications, languages, awards, publications, talks, interests. |

Delete the demo rows as you go, or wipe them all first with:

```bash
cd backend && uv run python manage.py seed_demo --clear   # reseeds demo content
```

To start from a genuinely empty site instead:

```bash
make reset-db && cd backend && uv run python manage.py migrate
```

**Two things worth knowing:**

- **Grade scales.** An Indian 8.7 CGPA and a German 1.7 are both "good", and a recruiter in the
  wrong country will misread either one. Pick the scale explicitly on each education entry and the
  site renders it with its label, e.g. "1.7 (German grade 1.0–5.0)".
- **References are private by default.** A reference's email and phone are **never** sent to the
  website unless you tick *is public* on that person. Untick it and the site shows "Contact details
  available on request" instead. There is a test that proves this.

### 2. Swagger — inject via API

```bash
make token
```

Open **http://localhost:8000/api/docs/**, click **Authorize**, and paste `Token <your-token>`.
Every section now has working `POST` / `PUT` / `PATCH` endpoints with example request bodies.

### 3. Bulk import — one JSON file

Fastest way to go from demo data to your real data in one shot.

```bash
cp backend/docs/resume.example.json my-resume.json
# edit my-resume.json
cd backend && uv run python manage.py import_resume ../my-resume.json --dry-run   # validate only
cd backend && uv run python manage.py import_resume ../my-resume.json
```

- `--dry-run` validates against `backend/docs/resume.schema.json` and writes nothing.
- Running it twice is safe: entries are matched on their natural key and updated in place.
- `--replace` deletes existing entries of any type your file provides, for when you have *removed*
  something from your resume.
- Any key you leave out is left untouched in the database.

Images and PDFs are not part of the JSON — upload those through the admin.

---

## Deploying

Three free accounts, roughly twenty minutes. Do them in this order.

### Step 1 — Database on Neon

1. Sign up at **[neon.tech](https://neon.tech)** and create a project.
2. On the dashboard, copy the **connection string** (starts `postgresql://`).
3. Keep it to hand — this is your `DATABASE_URL`.

### Step 2 — Media storage on Cloudinary

Render wipes its disk on every deploy, so uploaded images must live elsewhere.

1. Sign up at **[cloudinary.com](https://cloudinary.com)**.
2. On the Dashboard, copy **Cloud name**, **API Key**, and **API Secret**.

### Step 3 — Backend on Render

1. Push this repository to GitHub.
2. At **[render.com](https://render.com)** → **New** → **Web Service** → connect your repo.
3. Choose **Docker**, set **Root Directory** to `backend`, and pick the **Free** plan.
4. Set **Health Check Path** to `/api/health/`.
5. Add the environment variables from [the table below](#environment-variables).
   Leave `CORS_ALLOWED_ORIGINS` blank for now — you do not have a Vercel URL yet.
6. Deploy. When it goes green, note your URL, e.g. `https://portfolio-api.onrender.com`.
7. Create your admin login using Render's **Shell** tab:
   ```bash
   python manage.py createsuperuser
   ```

> This repo also has a `render.yaml` blueprint. **New** → **Blueprint** reads it and creates the
> service for you; you still enter the secrets by hand.

### Step 4 — Frontend on Vercel

1. At **[vercel.com](https://vercel.com)** → **Add New** → **Project** → import the same repo.
2. Set **Root Directory** to `frontend`. Vercel detects Vite automatically.
3. Add one environment variable:
   `VITE_API_URL` = your Render URL, **no trailing slash**.
4. Deploy. You now have a live URL, e.g. `https://your-name.vercel.app`.

### Step 5 — Let the two talk to each other

Back in Render, set these and let it redeploy:

```
CORS_ALLOWED_ORIGINS=https://your-name.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-name.vercel.app
DJANGO_ALLOWED_HOSTS=portfolio-api.onrender.com
```

Until you do this, the browser will block every API call and the site will look empty.

### Step 6 — Stop the backend falling asleep

Render's free tier sleeps after ~15 minutes idle and takes up to a minute to wake. The site already
handles this two ways: the Vercel build bakes a snapshot of your content into the bundle so the page
paints instantly, and a GitHub Action pings the API to keep it awake.

Turn the ping on: **GitHub repo → Settings → Secrets and variables → Actions → Variables → New**

```
Name:  API_HEALTH_URL
Value: https://portfolio-api.onrender.com/api/health/
```

### Step 7 — After you change content

Content changes appear on the live site within a minute — the frontend revalidates against the API
on every load. The baked-in snapshot only refreshes on a rebuild, so after a big content update it
is worth redeploying from the Vercel dashboard (**Deployments → ⋯ → Redeploy**) so first-paint
content is current too.

### Custom domain

Vercel → your project → **Settings** → **Domains** → add your domain, then create the DNS records
Vercel shows you at your registrar. Afterwards add the new domain to `CORS_ALLOWED_ORIGINS` and
`CSRF_TRUSTED_ORIGINS` in Render.

---

## Environment variables

### Backend (Render)

| Variable | Required | What it does |
|---|---|---|
| `DJANGO_SECRET_KEY` | **yes** | Signs sessions and tokens. Let Render generate it. |
| `DJANGO_ALLOWED_HOSTS` | **yes** | Hostnames the API answers to, e.g. `portfolio-api.onrender.com`. |
| `DATABASE_URL` | **yes** | Neon connection string. |
| `CORS_ALLOWED_ORIGINS` | **yes** | Your Vercel URL. Without it the browser blocks every request. |
| `CSRF_TRUSTED_ORIGINS` | **yes** | Same value. |
| `DJANGO_SETTINGS_MODULE` | **yes** | `config.settings.prod` |
| `CLOUDINARY_CLOUD_NAME` | for uploads | From the Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | for uploads | " |
| `CLOUDINARY_API_SECRET` | for uploads | " |
| `CORS_ALLOWED_ORIGIN_REGEXES` | no | `^https://.*\.vercel\.app$` lets preview deploys reach the API. |
| `CONTACT_THROTTLE_RATE` | no | Contact-form limit per IP. Default `5/hour`. |
| `SECURE_SSL_REDIRECT` | no | Default `true`. |

### Frontend (Vercel)

| Variable | Required | What it does |
|---|---|---|
| `VITE_API_URL` | in production | Your Render URL, no trailing slash. Leave **empty** locally — Vite proxies `/api` to `localhost:8000`. |

Templates: `backend/.env.example`, `frontend/.env.example`.

---

## Adding a new resume section

Say you want a "Patents" section. Five steps, and no layout code changes:

1. **Model** — add `Patent(Orderable)` in `backend/portfolio/models.py`, then
   `uv run python manage.py makemigrations && uv run python manage.py migrate`.
2. **Admin** — register a `PatentAdmin` in `backend/portfolio/admin.py`.
3. **API** — add `PatentSerializer(ReadSerializer[Patent])` in `serializers.py`, add the field to
   `PortfolioSerializer`, add it to `build_portfolio_payload()` and `VERSIONED_MODELS` in `views.py`,
   register a viewset in `urls.py`, and add `PATENTS = "patents", "Patents"` to `SectionKey`.
4. **Types** — `make gen-api`. This regenerates the TypeScript from your models.
5. **Component** — write `frontend/src/sections/PatentsSection.tsx` and add one line to the registry
   in `frontend/src/sections/index.ts`. Add `"patents"` to `SECTION_KEYS` in `src/api/types.ts` and
   a label in `src/i18n/en.json` + `de.json`.

Then tick it on in **Site settings → sections** and drag it where you want it.

---

## Everyday commands

```bash
make help          # every available command
make check         # lint + typecheck + tests, everything CI runs except E2E
make gen-api       # regenerate frontend types after changing a model
make token         # API token for Swagger
make reset-db      # wipe local data and reseed
make e2e           # Playwright against a real build and a real API
```

---

## Measured results

| | Desktop | Mobile |
|---|---|---|
| Performance | 100 | 89 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Tests: 175 backend, 87 frontend, 38 end-to-end across desktop and mobile viewports.
Initial JavaScript is 167 kB gzipped; CI fails the build above 200 kB.

Accessibility is not a one-off audit — axe-core runs against every route in both themes on every
CI run, and any WCAG 2.1 AA violation fails the build.

## How the pieces fit

```
Django models  ──►  DRF serializers  ──►  openapi.json  ──►  schema.d.ts  ──►  React
   (truth)            (what's public)      (contract)        (generated)      (renders)
```

You never hand-write an API type in the frontend. `make gen-api` regenerates them from the models,
and CI fails if what is committed does not match — so the two halves cannot drift apart.

The homepage paints from a **single** request to `/api/v1/portfolio/`, which returns the whole site
in one payload with an ETag for conditional revalidation. Which sections render, in what order, and
under what heading is decided entirely by **Site settings → sections** in the admin.

Deeper detail: [`ARCHITECTURE.md`](ARCHITECTURE.md). Decisions and their reasoning:
[`DECISIONS.md`](DECISIONS.md).

---

## License

[MIT](LICENSE) © 2026 Mahidhar Gedela
