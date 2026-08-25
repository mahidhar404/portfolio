# Decisions

Each significant choice, and why. Written as it was made, so the reasoning survives
even where the choice later looks obvious.

---

**Frontend on Vercel, backend on Render, database on Neon — not everything on Vercel.**
The brief asked for Vercel hosting. Vercel runs Python only as serverless functions, where
Django's admin, migrations, and file uploads are all fragile or broken — and the admin is the
primary way content gets in. Splitting keeps the Vercel URL for the frontend (which is what goes
on LinkedIn) while the backend runs somewhere it can hold a process and a connection pool. All
three tiers are free.

**SQLite locally, Postgres in production.** A clean clone runs with no database setup at all.
`dj-database-url` means switching is one environment variable, and CI exercises both paths.

**One aggregate endpoint, not fifteen.** `/api/v1/portfolio/` returns the whole site. Fifteen
parallel requests would each pay the cold-start penalty on a sleeping free-tier backend, and the
page would assemble itself visibly. One request paints the whole page at once.

**ETag from `MAX(updated_at)`, computed in raw SQL.** A single `UNION ALL` of `SELECT MAX(...)`
across the content tables, rather than sixteen `aggregate()` round trips. `QuerySet.union()` cannot
slice its operands on SQLite, which is why it is raw SQL; table names come from Django's model
metadata, never from input.

**`is_published` and `order` on every list model.** Hiding an entry and reordering entries are the
two things you do constantly while writing a resume. Both must be admin operations, never deploys.

**Singletons for `SiteSettings` and `Profile`.** There is exactly one of you. A model that allows
two rows invites the bug where the site silently reads the wrong one.

**`Singleton.save()` carries `created_at` forward.** Forcing `pk=1` on a freshly constructed
instance turns the write into an `UPDATE`, and `auto_now_add` does not fire on updates — which wrote
a `NULL` and violated the constraint. Found by a test, not in production.

**`grade_scale` is a choice field, not free text.** An Indian 8.7 CGPA and a German 1.7 are both
excellent; a recruiter reading either on the wrong scale concludes the opposite. Storing the scale
explicitly lets the site render "1.7 (German grade 1.0–5.0)" and removes the ambiguity.

**Reference contact details are masked in the serializer, not the view.** Every code path that
serialises a `Reference` — aggregate endpoint, list, detail — inherits the protection automatically.
Putting it in a view would protect only the paths someone remembered. A test asserts the private
string appears nowhere in the raw response body.

**Personal details are off by default.** Date of birth, nationality and marital status are normal on
a German *Lebenslauf* and are exactly the fields anti-discrimination guidance says to leave off
elsewhere. The fields exist; showing them is a deliberate switch.

**`ReadSerializer` marks response fields required.** ModelSerializer marks a field `required=False`
whenever the model has a default — correct for input, wrong for output. Without this override, every
property came out optional in the generated TypeScript and every component needed a null check for a
value the API always sends.

**`extend_schema_field` on the method fields.** `SerializerMethodField` generates `unknown` in
TypeScript. Rather than casting in React, the schema was fixed at the source — the generated types
were correctly reporting that the backend contract was vague.

**Types are generated, never hand-written, and CI enforces it.** `pnpm run gen:api` regenerates
`schema.d.ts` from the models; CI regenerates and fails if the committed files differ. This is the
single mechanism that makes "change a model, the frontend follows" structurally true rather than a
matter of discipline.

**Zod on top of the generated types.** `schema.d.ts` is a compile-time contract and disappears at
runtime. A backend deployed after the frontend was built can return anything. Zod turns that into a
loud error instead of `undefined` rendering as empty space. The Zod schemas are deliberately looser
than the generated types — they validate a superset and ignore fields the UI never reads, so adding
a field to the API is not a breaking change.

**Sections are a registry keyed by the API.** The alternative — hard-coding the order in JSX — would
mean a deploy every time you wanted Projects above Experience. The registry makes page structure
content.

**Build-time snapshot for cold starts.** Render's free tier takes up to a minute to wake. A recruiter
must never see a spinner. Vercel fetches the payload at build time and bakes it in; the app renders
that instantly and swaps in live data when it arrives. Imported via `import.meta.glob` so a fresh
clone without the generated file still builds.

**Markdown renderer is lazy-loaded.** react-markdown and its unified/micromark tree are ~31 kB
gzipped, which took the initial bundle over the 200 kB budget. While it loads, raw text renders with
`white-space: pre-line` — readable, and roughly the right height, so nothing jumps.

**`react` is matched with a trailing separator in `manualChunks`.** The obvious regex also matched
`react-markdown`, quietly pulling 20 kB of markdown machinery into the eagerly-preloaded vendor
chunk. Caught by measuring the built output rather than trusting the config.

**The command palette dialog is a child component.** State reset lived in an effect keyed on `open`,
which ESLint correctly flagged as a cascading render, and the ref-based fix it suggested was worse.
Mounting the dialog only while open makes fresh state the default — no effect, no ref.

**`TypedFactory` facade instead of relaxing mypy for tests.** factory_boy ships `py.typed` but leaves
its metaclass `__call__` unannotated, so `ProjectFactory()` appeared to return the factory. A ten-line
generic facade restores the real model type at every call site, so the test suite stays fully
type-checked. The narrow mypy relaxation that remains applies only to the factory declarations.

**Placeholder images generated locally with Pillow.** `seed_demo` works offline and CI never depends
on a third-party placeholder service being up.

**`import_resume` matches on natural keys.** Running it twice must produce the same database, not
duplicates — otherwise the first mistake in a resume file is unrecoverable without manual cleanup.
`--replace` exists separately for when you have genuinely deleted something.

**Contact throttle rate is configurable.** Two Playwright projects submitting from one IP exhausted
the 5/hour limit and failed the suite. Making the rate an environment variable fixed the test and is
a reasonable production knob; the default is unchanged.

**`FORMS_URLFIELD_ASSUME_HTTPS = True`.** Opts into Django 6's behaviour now — a URL typed without a
scheme becomes `https`, not `http`. The transitional setting itself warns, so pytest filters that one
warning with a note to delete both at the Django 6 upgrade.

**No CSS-in-JS, no component library.** Tailwind v4 with CSS custom properties for tokens means the
palette can be driven from the database at runtime, and the whole stylesheet is 6 kB gzipped.
