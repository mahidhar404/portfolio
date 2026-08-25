# Architecture

## The thesis

The database is the only source of truth for content, and the type system is the only source of
truth for the shape of that content. Everything else follows from those two rules.

```
┌──────────────┐   models.py     ┌──────────────┐  serializers.py  ┌──────────────┐
│   Postgres   │ ──────────────► │    Django    │ ───────────────► │  openapi.json│
│    (Neon)    │                 │   + DRF      │                  │  (contract)  │
└──────────────┘                 └──────────────┘                  └──────┬───────┘
                                        │                                 │
                                   /admin/  ◄── you enter content    openapi-typescript
                                        │                                 │
                                        ▼                                 ▼
                                 ┌──────────────┐   fetch + Zod    ┌──────────────┐
                                 │  /api/v1/    │ ───────────────► │ schema.d.ts  │
                                 │  portfolio/  │                  │  (generated) │
                                 └──────────────┘                  └──────┬───────┘
                                                                          │
                                                                          ▼
                                                                   ┌──────────────┐
                                                                   │ React (Vercel)│
                                                                   └──────────────┘
```

## Request lifecycle: loading the homepage

1. The browser loads `index.html` from Vercel's CDN. An inline script applies the saved theme
   before first paint, so there is no flash of the wrong colours.
2. React mounts and `usePortfolio()` runs. If a build-time snapshot exists
   (`src/api/fallback.json`), it renders immediately from that — the page is complete before any
   network request finishes.
3. In parallel, `GET /api/v1/portfolio/` fetches live content, sending `If-None-Match` if the
   browser holds an ETag.
4. Django computes the ETag as a hash of `MAX(updated_at)` across all sixteen content models in a
   single SQL statement. If it matches, it returns `304` and no body.
5. Otherwise `build_portfolio_payload()` assembles the whole site — settings, profile, and every
   published row of every section — using `select_related` / `prefetch_related` throughout. The
   query count is fixed regardless of how much content exists, and a test asserts that.
6. The response passes through a Zod guard in the browser. A contract break becomes a loud error
   rather than `undefined` rendering as blank space.
7. `HomePage` reads `section_order` and renders `SECTION_REGISTRY[key]` for each entry, in order,
   each wrapped in its own error boundary.

## The section registry

`SiteSettings.sections` is a JSON list of `{key, enabled, label}`. The backend returns the enabled
keys in order; the frontend holds a `Record<SectionKey, ComponentType<SectionProps>>` and renders
what it is told.

The consequence: reordering the page, renaming a heading, or hiding a section entirely are all
database edits. Adding a genuinely new *kind* of section is a model plus one registry entry.

## Data model

Three abstract bases carry the conventions:

- **`TimeStamped`** — `created_at` / `updated_at` on everything. The ETag derives from these.
- **`Orderable`** — adds `is_published` and `order` to every list model, which is what makes
  "hide this" and "move this up" admin operations rather than deploys.
- **`Singleton`** — enforces exactly one row for `SiteSettings` and `Profile`, hides add/delete in
  the admin, and redirects the changelist straight to the object.

Sixteen content models cover the union of German *Lebenslauf* and Indian/global resume conventions.
Two of them exist specifically because of German convention: `Language` with CEFR levels, and
`Reference`. `Profile` carries the personal-details block (date and place of birth, nationality,
marital status), all individually nullable.

`Education.grade_scale` is a choice field rather than free text, because "8.7" and "1.7" mean
opposite things depending on the country and a recruiter reading the wrong one draws the wrong
conclusion. The scale renders alongside the value.

## Privacy boundaries

Two rules are enforced in serializers rather than views, so that *every* code path that serialises
these models gets the same protection:

| Rule | Where | Test |
|---|---|---|
| Reference contact details are withheld unless `is_public` | `ReferenceSerializer.get_email` / `get_phone` | `tests/test_privacy.py` |
| Personal details are withheld unless `show_personal_details` | `ProfileSerializer.to_representation` | `tests/test_privacy.py` |

One test asserts the private string does not appear *anywhere* in the raw response body, not merely
that the field is blank.

## API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/portfolio/` | The whole site, one request, ETag + `Cache-Control`. |
| `GET /api/v1/projects/{slug}/` | Full case study, gallery, long description. |
| `GET /api/v1/<section>/` | Filterable, searchable, paginated list per model. |
| `POST /api/v1/contact/` | Public, throttled, honeypot-protected. |
| `PUT`/`PATCH`/`DELETE` | Any model, `IsAdminUser` + token. |
| `GET /api/docs/` | Swagger UI with a working Authorize button. |
| `GET /api/health/` | Liveness probe; also the keep-warm cron target. |

Read is public and cacheable; write requires a staff token. `ContentViewSet.get_queryset` hides
unpublished rows from anonymous users while staff see everything, so you can preview a draft entry
through the API before publishing it.

`ReadSerializer` marks every declared field `required` in the generated schema. Without it,
ModelSerializer's input-oriented `required=False` would make every property optional in TypeScript
and push a pointless null check into every component.

## Frontend structure

```
src/
├── api/         generated types, typed client, Zod guards, query hooks, fallback snapshot
├── components/  Header, Hero, CommandPalette, ProjectCard, error boundaries, ui/ primitives
├── sections/    one component per resume section + the registry
├── routes/      HomePage, ProjectsPage, ProjectDetailPage, ResumePage, NotFoundPage
├── lib/         formatting, theme, scroll-spy, document head, brand colours
└── i18n/        EN and DE chrome strings (content always comes from the API)
```

**Code splitting.** The homepage ships in the initial bundle; every other route is `lazy()`. The
markdown renderer is lazy too — 31 kB gzipped is too much to spend before first paint, and while it
loads the raw text renders with `white-space: pre-line` so the box keeps roughly its final height.
Initial JS is ~167 kB gzipped and CI fails the build above 200 kB.

**Theme.** Three states, matching the OS: `light`, `dark`, and `system`. Tokens are defined on bare
`:root`, redefined under `@media (prefers-color-scheme: dark)` guarded with
`:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. So an explicit choice
beats the OS in both directions, and the un-stamped "system" state still resolves correctly.

**Brand colours** are pushed from `SiteSettings` into CSS custom properties at runtime. Colour is
content; changing it should not need a deploy.

## Cold starts

Render's free tier sleeps. Four defences, in order of when they act:

1. **Build-time snapshot** — `scripts/fetch-fallback.ts` fetches the payload during the Vercel build
   and writes `src/api/fallback.json`. The app renders it instantly, then revalidates.
2. **Keep-warm cron** — a GitHub Action pings `/api/health/` every ten minutes.
3. **Long client timeout** — 60s on the portfolio query, so a genuinely cold instance still wins.
4. **Graceful failure** — if everything fails and there is no snapshot, a retry button appears
   rather than a blank page.

The snapshot import uses `import.meta.glob` rather than a plain import, because the file is
generated and gitignored: on a fresh clone it resolves to an empty record instead of failing the
build.

## Testing

| Layer | Tool | Count | What it protects |
|---|---|---|---|
| Backend | pytest + factory_boy | 175 | Models, privacy, permissions, throttling, import idempotency, admin pages, aggregate query count |
| Frontend | Vitest + RTL + MSW | 66 | Sections, empty states, contract guards, theme, palette, contact form |
| E2E | Playwright | 25 | Real build + real API, desktop and mobile, no horizontal scroll, no console errors |

Three tests are load-bearing for the project's central claims:

- `test_query_count_does_not_grow_with_content` — ten times the content costs the same number of
  queries as one. Compares two non-empty states, because Django skips a prefetch entirely when the
  parent set is empty and comparing against empty would measure that instead.
- `follows a reordered section list without any code change` — the registry obeys the API.
- `test_secret_never_appears_anywhere_in_the_raw_response` — private contact details do not leak.

## CI

Five jobs: backend (ruff, mypy strict, migration completeness, pytest), **api-contract** (regenerate
types from the models and fail if the committed files differ), frontend (eslint, prettier, tsc,
vitest, build, bundle budget), e2e (Playwright against a seeded backend), and docker (the image
builds, boots, and serves `/api/health/`).

The api-contract job is the one that makes the whole design hold: it is structurally impossible to
change a model and forget the frontend.
