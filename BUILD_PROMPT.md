# Portfolio Website — Build Prompt

> **How to use this file:** open a fresh Claude Code session in this directory and paste everything
> below the horizontal rule. That is the whole brief.
>
> **Architecture summary:** React + TypeScript on Vercel (your public link) → Django REST on Render →
> Postgres on Neon. Django can't run properly on Vercel's Python serverless — admin, migrations and
> media uploads all break — so the frontend lives on Vercel and the backend lives next door. You still
> get one clean `*.vercel.app` (or custom domain) URL to put on LinkedIn.

---

You are building my personal portfolio website from scratch in this empty repository. Read this entire brief
before writing any code, then work through the phases in order. I am a competent engineer but new to parts of
this stack — explain each significant decision in one or two plain sentences as you make it, and keep a running
`DECISIONS.md`.

## 0. The one non-negotiable

Every single piece of content on the front end comes from the database via the API. There is no hard-coded
copy in a React component — not a heading, not a bio line, not a project title. My only job after this is
built is to enter my data. If a change to my resume would require a code change, the design is wrong.

## 1. Stack

**Frontend** (deployed to Vercel):
- React 19 + TypeScript in `strict` mode, Vite build
- React Router v7 (data router APIs), TanStack Query v5 for server state
- Tailwind CSS v4, shadcn/ui-style primitives (Radix under the hood), Framer Motion for animation
- Zod to validate API responses at the boundary
- `openapi-typescript` to generate TS types directly from the backend's OpenAPI schema

**Backend** (deployed to Render):
- Django 5.x + Django REST Framework
- `drf-spectacular` for OpenAPI 3 schema + Swagger UI + ReDoc
- `django-cors-headers`, `dj-database-url`, `whitenoise`, `gunicorn`
- `Pillow` for images; Cloudinary (free tier) via `django-storages` for user-uploaded media, because Render's
  filesystem is ephemeral
- Postgres (Neon free tier) in production, SQLite locally so a clean clone runs with zero setup

**Tooling:** `uv` for Python deps, `pnpm` for JS. Ruff + mypy (strict) + pytest-django on the backend;
ESLint + Prettier + `tsc --noEmit` + Vitest on the frontend.

## 2. Repository layout

```
portfolio-site/
├── backend/
│   ├── config/                 # settings/{base,dev,prod}.py, urls.py, wsgi.py
│   ├── portfolio/              # the single app: models, serializers, views, admin, filters
│   │   ├── management/commands/seed_demo.py
│   │   └── management/commands/import_resume.py
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                # generated types + typed client + query hooks
│   │   ├── components/         # ui/ primitives + shared
│   │   ├── sections/           # one component per resume section
│   │   ├── routes/
│   │   ├── lib/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── docker-compose.yml          # api + db + frontend, one command local dev
├── .github/workflows/ci.yml
└── README.md
```

## 3. Data model — the superset

Design these as Django models with `created_at`/`updated_at` on every one, and an `is_published` boolean plus
integer `order` field on every list-type model so I can hide and reorder anything from the admin without a deploy.

**Singletons** (enforce exactly one row):
- `SiteSettings` — site title, meta description, OG image, primary/accent colour, default locale (`en`/`de`),
  Google Analytics/Plausible id, `sections` config controlling which sections appear and in what order,
  feature flags (`show_photo`, `show_personal_details`, `show_references`, `show_hobbies`).
- `Profile` — full name, headline, tagline, professional summary (short + long, Markdown), photo,
  date of birth, place of birth, nationality, marital status, current city, country, relocation willingness,
  work authorisation note, email, phone, availability status, years of experience, resume PDF (EN), resume PDF (DE).
  The personal-details block is German-CV convention — every field individually nullable and gated by the
  `show_personal_details` flag, because I won't show those to every audience.

**Collections:**
- `SocialLink` — platform, url, icon key, order
- `Experience` — company, company logo, company url, role, employment type (full-time/contract/intern/working-student),
  location, remote flag, start date, end date, `is_current`, description (Markdown), M2M to `Skill`
- `ExperienceHighlight` — FK to Experience, text, order (the bullet points, as rows so they're individually editable)
- `Education` — institution, logo, degree, field of study, `grade_value` + `grade_scale`
  (choices: `cgpa_10`, `percentage`, `gpa_4`, `german_1_5`, `ects`) so both an Indian 8.7 CGPA and a German 1.7
  render correctly, start/end, location, thesis title, thesis url, coursework (array), description
- `SkillCategory` and `Skill` — name, category FK, proficiency 1–5, years of experience, `is_featured`, icon key
- `Project` — title, slug, one-line summary, full description (Markdown), my role, start/end, cover image,
  M2M to `Skill`, repo url, live url, `is_featured`, `metrics` (JSON: e.g. `{"latency": "-40%"}`), case-study body
- `ProjectImage` — FK to Project, image, caption, order
- `Certification` — name, issuer, issuer logo, issue date, expiry date, credential id, credential url
- `Publication` — title, authors, venue, date, DOI, url, abstract
- `Award` — title, issuer, date, description
- `Language` — name, CEFR level (`A1`–`C2`, plus `native`), notes — required for German CVs
- `Reference` — name, role, company, relationship, email, phone, `is_public` (default False; never serialise
  contact details unless explicitly public) — also a German CV convention
- `Volunteering` — organisation, role, start/end, description
- `Interest` — name, icon key
- `Talk` — title, event, date, url, slides url
- `ContactMessage` — name, email, subject, message, ip, user agent, created_at, `is_read` (write-only from the
  public form, readable only in admin)

Ship a real migration set. `python manage.py migrate` on a clean clone must work first try.

## 4. API design

Version everything under `/api/v1/`.

- **`GET /api/v1/portfolio/`** — the aggregate endpoint. One request returns the entire published site payload:
  settings, profile, and every enabled section in `SiteSettings.sections` order. This is what makes the site feel
  instant — the whole page paints from a single round trip. Use `select_related`/`prefetch_related` so it's a
  handful of queries, not N+1, and assert the query count in a test.
- **Granular read endpoints** for detail pages and future use: `/api/v1/projects/`, `/api/v1/projects/{slug}/`,
  `/api/v1/experience/`, `/api/v1/skills/`, etc. Filterable (`django-filter`) and paginated.
- **`POST /api/v1/contact/`** — public, throttled to 5/hour per IP, honeypot field, server-side validation.
- **Write endpoints** for every model, `IsAdminUser` + token auth, so I can inject data from Swagger.
- **`GET /api/schema/`**, **`/api/docs/`** (Swagger UI), **`/api/redoc/`**.

**Caching and freshness:** compute an ETag from `MAX(updated_at)` across all content models; return
`304 Not Modified` when the client's ETag matches. Public GETs get `Cache-Control: public, max-age=60,
stale-while-revalidate=600`.

**Serializers:** explicit field lists, never `fields = "__all__"`. Read serializers separate from write
serializers. Never expose `Reference` contact fields when `is_public=False` — write a test that proves it.

## 5. The backend→frontend contract (do this properly, it's the heart of the request)

The Django models are the single source of truth, and the types flow downhill automatically:

1. `drf-spectacular` generates `openapi.json` from the serializers.
2. `pnpm run gen:api` runs `openapi-typescript` over that schema into `frontend/src/api/schema.d.ts`.
3. A thin typed `fetchApi<T>()` wrapper plus TanStack Query hooks (`usePortfolio()`, `useProject(slug)`) consume
   those generated types.
4. Zod schemas mirror the critical shapes and validate at runtime, so a backend change that breaks the contract
   fails loudly in dev instead of rendering `undefined`.
5. **CI check:** regenerate the schema and the TS types, and fail the build if the committed files differ. This
   is what guarantees the two halves can never silently drift.

Hand-writing an API interface in the frontend is forbidden. Every API type is generated.

## 6. Frontend architecture

**Data-driven sections.** The backend sends section order and enabled flags; the frontend holds a registry
`Record<SectionKey, ComponentType<SectionProps>>` and renders in the order it's told. Adding a new resume
section later = add a model + register one component. No layout code changes.

**Routes:** `/` (single-page scroll composition of all sections), `/projects`, `/projects/:slug` (full case
study), `/experience`, `/about`, `/contact`, `/resume` (print-optimised CV view), `*` (404).

**Interactivity — make it feel expensive:**
- Sticky nav with scroll-spy that tracks the active section
- Command palette (⌘K) for jump-to-section and project search
- Dark/light/system theme, persisted, no flash of wrong theme on load
- Project grid filterable by tech stack with animated layout transitions
- Experience rendered as an animated vertical timeline
- Skills as animated proficiency bars grouped by category
- Language proficiency as CEFR level indicators
- EN/DE language toggle (`react-i18next`) — UI strings from translation files, content from the API's locale fields
- `/resume` renders a clean one-page CV with `@media print` rules, plus a download button for the PDF from `Profile`
- Every animation respects `prefers-reduced-motion`

**Quality bar — this is the "as smooth as Meta" part:**
- Route-level code splitting; initial JS bundle under 200 KB gzipped
- Skeleton loaders sized to the real content, so there is zero cumulative layout shift
- Images: explicit width/height, `loading="lazy"`, responsive `srcset`, blur-up placeholder
- Error boundaries per section — one failing section never blanks the page
- Full keyboard navigation, visible focus rings, semantic landmarks, WCAG 2.1 AA contrast, tested with `axe`
- SEO: per-route meta + Open Graph tags, JSON-LD `Person` + `WebSite` schema, `sitemap.xml`, `robots.txt`
- Target Lighthouse ≥ 95 on all four categories; report the actual scores when you're done

**Cold-start insurance (important, don't skip):** Render's free tier sleeps after inactivity and can take ~50
seconds to wake. A recruiter must never hit a loading spinner. So:
1. At Vercel build time, fetch `/api/v1/portfolio/` and write the response to `src/api/fallback.json`.
2. The app renders from `fallback.json` immediately, then revalidates against the live API and swaps in fresh
   data when it arrives.
3. Add a GitHub Actions cron job that pings the backend health endpoint every 10 minutes to keep it warm.
4. Add a Vercel deploy hook, and document how to trigger a rebuild after I update content.

## 7. Getting my data in

**Primary path — Django admin.** Invest real effort here; this is the interface I'll actually live in.
- Custom `ModelAdmin` for every model: sensible `list_display`, `list_filter`, `search_fields`, `list_editable`
  for the `order` field, inlines for `ExperienceHighlight` and `ProjectImage`, image thumbnail previews,
  drag-to-reorder via `django-admin-sortable2`
- Group models into logical admin sections with clear labels
- Add a "View on site" link and a "Preview" button on the singletons
- Style it minimally with `django-admin-interface` or a small custom CSS override so it isn't ugly

**Secondary — Swagger.** `/api/docs/` with a working "Authorize" button. Every write endpoint documented with a
realistic request example. Authenticate with a token, POST/PUT any section, done.

**Bulk load — `manage.py import_resume path/to/resume.json`.** Takes one JSON document containing my entire
resume, validates it against a published JSON Schema (write that schema to `docs/resume.schema.json`), and
upserts idempotently — running it twice must not duplicate rows. Include `docs/resume.example.json`, fully
filled in, as the template I'll copy.

**Demo data — `manage.py seed_demo`.** Creates a complete fictional-but-plausible senior-engineer persona:
2 educations, 4 roles with bullets, 6 projects with images, 30 skills across 6 categories, 4 certifications,
3 languages, 2 awards, 1 publication, hobbies, social links. Placeholder images generated locally or pulled
from a public placeholder service at seed time. Include `--clear` to wipe and reseed. The site must look
finished and impressive on first run.

## 8. Testing

**Backend** (`pytest-django` + `factory_boy`): model constraints and singleton enforcement; serializer output
shape; the aggregate endpoint's query count; permission tests proving anonymous users cannot write and cannot
read non-public references; contact form throttling; `import_resume` idempotency.

**Frontend** (Vitest + React Testing Library + MSW): section components render from fixture data; empty and
error states; the section registry renders in the order the API dictates; theme toggle persistence.

**E2E** (Playwright): load the home page against a seeded backend, assert every section renders, navigate to a
project detail page, submit the contact form, toggle theme and language.

**CI** (GitHub Actions): ruff, mypy strict, pytest with coverage, eslint, `tsc --noEmit`, vitest, the API-types
drift check, and a production build of both apps. All green before deploy.

## 9. Deployment

- **Frontend → Vercel.** `frontend/` as root directory, `VITE_API_URL` env var, SPA rewrite rule so deep links
  work on refresh.
- **Backend → Render.** Web service from `backend/Dockerfile`, `gunicorn config.wsgi`, non-root user, health
  check at `/api/health/`, build command running `migrate` and `collectstatic`.
- **Database → Neon.** Free Postgres, connection string via `DATABASE_URL`.
- **Media → Cloudinary.** Free tier, credentials via env.
- **Security:** `DEBUG=False` in prod, `SECRET_KEY` from env, correct `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`,
  CORS limited to the Vercel domains only, HSTS and secure cookies on, no secret ever committed. Provide
  `.env.example` for both apps.

## 10. Documentation

`README.md` must let me go from clone to live without asking you anything:
- 5-minute local setup (or `docker compose up`)
- Every environment variable, what it does, where to get its value
- Step-by-step first deploy for Vercel, Render, Neon, Cloudinary — including where to click
- **"Replacing the demo data with mine"** — the exact workflow: create superuser, log into `/admin`, fill each
  section in order, or run `import_resume` with my JSON
- How to add a brand-new resume section later (model → serializer → admin → regenerate types → register component)
- Custom domain setup and how to point it at Vercel

Also write `ARCHITECTURE.md` (component map, request lifecycle, the type-generation pipeline) and `DECISIONS.md`
(each significant choice and its one-line rationale).

## 11. How to work

Build in this order, and pause at the end of each phase to show me what's running before continuing:

0. Repo scaffold, tooling, CI skeleton, `docker compose up` works
1. Models + migrations + a genuinely good admin + `seed_demo`
2. Serializers, viewsets, aggregate endpoint, Swagger, backend tests green
3. Type generation pipeline + typed client + query hooks + drift check
4. Layout shell, routing, theme, and every section component rendering real API data
5. Interactivity, animation, i18n, print view, performance and accessibility pass
6. Frontend and E2E tests green
7. Deploy all three services, verify the live URL end to end
8. Documentation

At every phase: strict typing, no `any`, no `# type: ignore` without a reason comment, tests alongside the code
rather than bolted on at the end. When you finish, give me the live URL, the admin URL, the Swagger URL, the
actual Lighthouse scores, and a numbered checklist of exactly what I do to swap in my real information.
