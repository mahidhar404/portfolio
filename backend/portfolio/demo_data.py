"""The demo persona, as plain data.

Kept separate from the seed command so the same content can be reused by tests
and by the resume-JSON example without duplicating it.

Everything here is fictional. Replace it with your own data via the admin or
`manage.py import_resume` — you never need to edit this file.
"""

from __future__ import annotations

from typing import Any

PROFILE: dict[str, Any] = {
    "full_name": "Alexandra Reinhardt",
    "headline": "Senior Backend Engineer — distributed systems & developer platforms",
    "tagline": "I make slow systems fast and complicated systems boring.",
    "summary_short": (
        "Senior backend engineer with eight years building payment and data infrastructure "
        "at scale. I care about the unglamorous parts: migrations that don't page anyone, "
        "APIs teams actually enjoy using, and latency budgets that hold under load."
    ),
    "summary_long": (
        "I've spent most of my career on the systems that sit underneath the product — "
        "payment ledgers, event pipelines, internal platforms. The work I'm proudest of is "
        "rarely visible: a migration that moved 400 million rows with zero downtime, a "
        "deploy pipeline that took releases from weekly to twelve a day.\n\n"
        "I work best on teams that treat operability as a feature. I write the runbook "
        "before the launch, I instrument before I optimise, and I believe a system nobody "
        "can debug at 3am is not finished.\n\n"
        "Currently based in Berlin, working across German and international teams."
    ),
    "date_of_birth": "1993-04-18",
    "place_of_birth": "Hamburg, Germany",
    "nationality": "German",
    "marital_status": "Single",
    "current_city": "Berlin",
    "country": "Germany",
    "willing_to_relocate": True,
    "work_authorisation": "EU citizen — no sponsorship required",
    "email": "alexandra@example.com",
    "phone": "+49 30 12345678",
    "availability": "Open to senior and staff roles from March 2026",
    "years_experience": 8,
}

SITE_SETTINGS: dict[str, Any] = {
    "site_title": "Alexandra Reinhardt",
    "meta_description": (
        "Senior backend engineer in Berlin working on distributed systems, payment "
        "infrastructure and developer platforms."
    ),
    "primary_color": "#1E4FD8",
    "accent_color": "#0EA5A4",
    "default_locale": "en",
    "show_photo": True,
    "show_personal_details": True,
    "show_references": True,
    "show_hobbies": True,
}

SOCIAL_LINKS: list[dict[str, Any]] = [
    {"platform": "GitHub", "url": "https://github.com/example", "icon": "github"},
    {"platform": "LinkedIn", "url": "https://linkedin.com/in/example", "icon": "linkedin"},
    {"platform": "Mastodon", "url": "https://hachyderm.io/@example", "icon": "mastodon"},
    {"platform": "Email", "url": "mailto:alexandra@example.com", "icon": "mail"},
]

SKILL_CATEGORIES: list[dict[str, Any]] = [
    {
        "name": "Languages",
        "icon": "code",
        "skills": [
            {"name": "Python", "proficiency": 5, "years_experience": 8, "is_featured": True},
            {"name": "Go", "proficiency": 4, "years_experience": 4, "is_featured": True},
            {"name": "TypeScript", "proficiency": 4, "years_experience": 5, "is_featured": True},
            {"name": "SQL", "proficiency": 5, "years_experience": 8, "is_featured": True},
            {"name": "Rust", "proficiency": 2, "years_experience": 1},
        ],
    },
    {
        "name": "Backend & data",
        "icon": "server",
        "skills": [
            {"name": "Django", "proficiency": 5, "years_experience": 7, "is_featured": True},
            {"name": "FastAPI", "proficiency": 4, "years_experience": 3},
            {"name": "PostgreSQL", "proficiency": 5, "years_experience": 8, "is_featured": True},
            {"name": "Kafka", "proficiency": 4, "years_experience": 4},
            {"name": "Redis", "proficiency": 4, "years_experience": 6},
            {"name": "Elasticsearch", "proficiency": 3, "years_experience": 3},
        ],
    },
    {
        "name": "Infrastructure",
        "icon": "cloud",
        "skills": [
            {"name": "Kubernetes", "proficiency": 4, "years_experience": 5, "is_featured": True},
            {"name": "Terraform", "proficiency": 4, "years_experience": 4},
            {"name": "AWS", "proficiency": 4, "years_experience": 6, "is_featured": True},
            {"name": "Docker", "proficiency": 5, "years_experience": 7},
            {"name": "GitHub Actions", "proficiency": 4, "years_experience": 5},
        ],
    },
    {
        "name": "Observability",
        "icon": "activity",
        "skills": [
            {"name": "Prometheus", "proficiency": 4, "years_experience": 5},
            {"name": "Grafana", "proficiency": 4, "years_experience": 5},
            {"name": "OpenTelemetry", "proficiency": 3, "years_experience": 2},
            {"name": "Sentry", "proficiency": 4, "years_experience": 5},
        ],
    },
    {
        "name": "Frontend",
        "icon": "layout",
        "skills": [
            {"name": "React", "proficiency": 3, "years_experience": 4},
            {"name": "Tailwind CSS", "proficiency": 3, "years_experience": 3},
            {"name": "Vite", "proficiency": 3, "years_experience": 2},
        ],
    },
    {
        "name": "Ways of working",
        "icon": "users",
        "skills": [
            {"name": "Technical mentoring", "proficiency": 5, "years_experience": 5,
             "is_featured": True},
            {"name": "Incident response", "proficiency": 5, "years_experience": 6},
            {"name": "Architecture review", "proficiency": 4, "years_experience": 4},
            {"name": "Technical writing", "proficiency": 4, "years_experience": 6},
            {"name": "Agile / Scrum", "proficiency": 4, "years_experience": 8},
            {"name": "Hiring & interviewing", "proficiency": 3, "years_experience": 3},
        ],
    },
]

EXPERIENCE: list[dict[str, Any]] = [
    {
        "company": "Nordbank Digital",
        "company_url": "https://example.com",
        "role": "Senior Backend Engineer",
        "employment_type": "full_time",
        "location": "Berlin, Germany",
        "is_remote": False,
        "start_date": "2022-09-01",
        "end_date": None,
        "is_current": True,
        "description": (
            "Technical lead for the payments ledger — the system of record for every "
            "transaction in the bank. Four engineers, one very unforgiving uptime target."
        ),
        "highlights": [
            "Led the zero-downtime migration of a 400M-row ledger from a single Postgres "
            "instance to a partitioned cluster, with no customer-visible interruption.",
            "Cut p99 transaction-settlement latency from 840ms to 210ms by replacing "
            "synchronous fan-out with a Kafka event pipeline.",
            "Introduced contract testing between eight internal services, which took "
            "integration-caused incidents from roughly two a month to two in a year.",
            "Mentored three engineers from mid to senior, two of whom now lead their own teams.",
        ],
        "skills": ["Python", "Go", "PostgreSQL", "Kafka", "Kubernetes", "Incident response"],
    },
    {
        "company": "Fleetwise GmbH",
        "company_url": "https://example.com",
        "role": "Backend Engineer",
        "employment_type": "full_time",
        "location": "Munich, Germany",
        "is_remote": True,
        "start_date": "2020-02-01",
        "end_date": "2022-08-31",
        "is_current": False,
        "description": (
            "Built the telemetry ingestion platform for a commercial-vehicle fleet product, "
            "processing roughly 1.2 billion sensor events a day at peak."
        ),
        "highlights": [
            "Designed the ingestion pipeline that took the platform from 40M to 1.2B daily "
            "events without a proportional increase in infrastructure spend.",
            "Reduced storage costs 38% by introducing tiered retention and columnar rollups.",
            "Wrote the on-call runbook and ran the incident-review process for two years.",
        ],
        "skills": ["Python", "Kafka", "AWS", "Terraform", "Prometheus"],
    },
    {
        "company": "Helix Commerce",
        "company_url": "https://example.com",
        "role": "Software Engineer",
        "employment_type": "full_time",
        "location": "Hamburg, Germany",
        "is_remote": False,
        "start_date": "2018-07-01",
        "end_date": "2020-01-31",
        "is_current": False,
        "description": (
            "Full-stack work on a B2B e-commerce platform serving around 300 wholesale "
            "customers across the DACH region."
        ),
        "highlights": [
            "Rebuilt the order-import pipeline, cutting a nightly four-hour batch job to "
            "under twelve minutes.",
            "Shipped the customer-facing pricing API still in production today.",
        ],
        "skills": ["Python", "Django", "PostgreSQL", "React"],
    },
    {
        "company": "Technische Universität Berlin",
        "company_url": "https://example.com",
        "role": "Working Student — Distributed Systems Group",
        "employment_type": "working_student",
        "location": "Berlin, Germany",
        "is_remote": False,
        "start_date": "2016-10-01",
        "end_date": "2018-03-31",
        "is_current": False,
        "description": (
            "Research support on consensus-protocol benchmarking, alongside my Master's."
        ),
        "highlights": [
            "Built the benchmarking harness used in two published papers.",
            "Maintained a 24-node test cluster used by the whole research group.",
        ],
        "skills": ["Python", "Docker", "SQL"],
    },
]

EDUCATION: list[dict[str, Any]] = [
    {
        "institution": "Technische Universität Berlin",
        "degree": "M.Sc. Computer Science",
        "field_of_study": "Distributed Systems",
        "grade_value": "1.3",
        "grade_scale": "german_1_5",
        "start_date": "2016-10-01",
        "end_date": "2018-06-30",
        "location": "Berlin, Germany",
        "thesis_title": "Latency-Aware Replica Placement in Geo-Distributed Key-Value Stores",
        "thesis_url": "https://example.com/thesis",
        "coursework": [
            "Distributed Systems",
            "Advanced Database Systems",
            "Cloud Computing",
            "Formal Methods",
            "Machine Learning",
        ],
        "description": "Graduated with distinction. Thesis awarded departmental honours.",
    },
    {
        "institution": "Universität Hamburg",
        "degree": "B.Sc. Computer Science",
        "field_of_study": "Software Engineering",
        "grade_value": "1.7",
        "grade_scale": "german_1_5",
        "start_date": "2013-10-01",
        "end_date": "2016-09-30",
        "location": "Hamburg, Germany",
        "thesis_title": "Static Analysis for Detecting Race Conditions in Go Programs",
        "coursework": [
            "Algorithms & Data Structures",
            "Operating Systems",
            "Compiler Construction",
            "Computer Networks",
        ],
        "description": "",
    },
]

PROJECTS: list[dict[str, Any]] = [
    {
        "title": "Ledgerline",
        "summary": "An append-only accounting ledger with provable balance invariants.",
        "role": "Creator and maintainer",
        "start_date": "2023-03-01",
        "end_date": None,
        "is_featured": True,
        "repo_url": "https://github.com/example/ledgerline",
        "live_url": "https://example.com/ledgerline",
        "metrics": {"throughput": "18k tx/s", "stars": "1.4k", "invariant checks": "100%"},
        "description": (
            "Double-entry accounting is deceptively hard to get right under concurrency. "
            "Ledgerline is a small Go library that makes the invariants — every transaction "
            "balances, no account goes negative without an explicit overdraft policy — "
            "checkable at runtime and provable in tests."
        ),
        "case_study": (
            "## The problem\n\n"
            "Every payments team eventually writes its own ledger, and every one of them "
            "gets concurrency wrong at least once. The failure mode is quiet: balances drift "
            "by cents under contention, and nobody notices until reconciliation.\n\n"
            "## The approach\n\n"
            "Ledgerline models a ledger as an append-only log of balanced entries. Balances "
            "are derived, never stored, and a periodic checkpoint compacts history without "
            "ever mutating it. Concurrency is handled with optimistic version checks rather "
            "than locks, so throughput scales with cores instead of collapsing under them.\n\n"
            "## The result\n\n"
            "18,000 transactions per second on a single node, with a property-based test "
            "suite that has run several billion generated transaction sequences without "
            "producing an unbalanced state."
        ),
        "skills": ["Go", "PostgreSQL", "Docker"],
    },
    {
        "title": "Pipewrench",
        "summary": "A schema-migration tool for Kafka topics that refuses to break consumers.",
        "role": "Creator",
        "start_date": "2022-01-01",
        "end_date": "2023-08-01",
        "is_featured": True,
        "repo_url": "https://github.com/example/pipewrench",
        "metrics": {"adopted by": "6 teams", "breaking changes caught": "31"},
        "description": (
            "Kafka schema changes are the classic distributed-systems footgun: the producer "
            "deploys, the consumers fall over, and the outage is thirty minutes old before "
            "anyone connects the two. Pipewrench moves that failure to CI."
        ),
        "case_study": (
            "## The problem\n\n"
            "We had eight teams publishing to shared topics with no shared definition of "
            "what 'compatible' meant.\n\n"
            "## The approach\n\n"
            "Pipewrench reads the schema registry, computes forward and backward "
            "compatibility against every consumer's declared contract, and fails the build "
            "when a change would break someone downstream. Consumers declare what they "
            "actually read, not what the schema happens to contain.\n\n"
            "## The result\n\n"
            "Thirty-one breaking changes caught in CI over eighteen months, and zero "
            "schema-caused production incidents in the same period."
        ),
        "skills": ["Python", "Kafka", "GitHub Actions"],
    },
    {
        "title": "Nightjar",
        "summary": "Self-hosted uptime monitoring that fits in 40MB of RAM.",
        "role": "Creator",
        "start_date": "2021-06-01",
        "end_date": "2022-03-01",
        "is_featured": True,
        "repo_url": "https://github.com/example/nightjar",
        "live_url": "https://example.com/nightjar",
        "metrics": {"memory": "40MB", "checks/min": "2400"},
        "description": (
            "Most uptime monitors want a database, a queue, and a small cluster. Nightjar "
            "is a single binary with an embedded store, designed to run on the cheapest VPS "
            "you can rent and still page you reliably."
        ),
        "case_study": (
            "## The problem\n\n"
            "Monitoring that runs on the infrastructure it monitors is not monitoring. But "
            "the self-hosted options were all heavier than the services I wanted to watch.\n\n"
            "## The approach\n\n"
            "One Go binary, an embedded time-series store with fixed retention, and a "
            "deliberately small feature set: HTTP checks, TCP checks, and three notification "
            "backends. No plugin system, no scripting.\n\n"
            "## The result\n\n"
            "2,400 checks a minute in 40MB of RAM on a €4/month VPS."
        ),
        "skills": ["Go", "Docker", "Prometheus"],
    },
    {
        "title": "Tessellate",
        "summary": "Incremental static-site rebuilds driven by a content dependency graph.",
        "role": "Creator",
        "start_date": "2020-09-01",
        "end_date": "2021-05-01",
        "is_featured": False,
        "repo_url": "https://github.com/example/tessellate",
        "metrics": {"rebuild time": "-94%"},
        "description": (
            "A static-site generator that tracks which pages actually depend on which "
            "content, so editing one post rebuilds one page rather than four thousand."
        ),
        "case_study": (
            "## The problem\n\n"
            "A documentation site with 4,000 pages took eleven minutes to rebuild for a "
            "one-word typo fix.\n\n"
            "## The approach\n\n"
            "Tessellate builds a dependency graph during the first full render, recording "
            "exactly which content each page touched. Subsequent builds walk the graph and "
            "rebuild only the affected subtree.\n\n"
            "## The result\n\n"
            "Typical incremental rebuild dropped from 11 minutes to 38 seconds."
        ),
        "skills": ["TypeScript", "Vite"],
    },
    {
        "title": "Quietwire",
        "summary": "A structured on-call handover log that fills itself in from your alerts.",
        "role": "Creator",
        "start_date": "2023-11-01",
        "end_date": None,
        "is_featured": False,
        "repo_url": "https://github.com/example/quietwire",
        "metrics": {"handover time": "-60%"},
        "description": (
            "On-call handovers are usually a Slack message written by an exhausted person at "
            "9am. Quietwire assembles a draft from the week's alerts, deploys and incidents, "
            "and asks the outgoing engineer to correct it rather than write it."
        ),
        "case_study": (
            "## The problem\n\n"
            "Handover quality varied enormously with how tired the outgoing engineer was.\n\n"
            "## The approach\n\n"
            "Pull from Prometheus Alertmanager, the deploy log, and the incident tracker; "
            "assemble a structured draft; present it as a form with everything pre-filled.\n\n"
            "## The result\n\n"
            "Median handover-writing time fell from 25 minutes to 10, and the resulting "
            "documents are consistently more complete."
        ),
        "skills": ["Python", "FastAPI", "Prometheus", "React"],
    },
    {
        "title": "Halfstep",
        "summary": "Feature flags with automatic cleanup reminders for stale flags.",
        "role": "Creator",
        "start_date": "2019-04-01",
        "end_date": "2020-02-01",
        "is_featured": False,
        "repo_url": "https://github.com/example/halfstep",
        "metrics": {"stale flags removed": "142"},
        "description": (
            "Feature-flag systems make it easy to add a flag and impossible to remember to "
            "remove it. Halfstep tracks flag age and evaluation patterns, and opens a "
            "cleanup pull request when a flag has been 100% on for a month."
        ),
        "case_study": (
            "## The problem\n\n"
            "Our codebase had 200 feature flags. Roughly 140 of them had been fully rolled "
            "out for over a year and were pure dead branches.\n\n"
            "## The approach\n\n"
            "Record evaluation outcomes, detect flags that have been unanimously one value "
            "for a configurable window, and generate the removal PR automatically — "
            "including deleting the dead branch.\n\n"
            "## The result\n\n"
            "142 flags removed over eight months, almost all via auto-generated PRs."
        ),
        "skills": ["Python", "Django", "PostgreSQL"],
    },
]

CERTIFICATIONS: list[dict[str, Any]] = [
    {
        "name": "Certified Kubernetes Administrator (CKA)",
        "issuer": "Cloud Native Computing Foundation",
        "issue_date": "2023-05-12",
        "expiry_date": "2026-05-12",
        "credential_id": "CKA-2305-887421",
        "credential_url": "https://example.com/verify/cka",
    },
    {
        "name": "AWS Certified Solutions Architect — Associate",
        "issuer": "Amazon Web Services",
        "issue_date": "2022-02-08",
        "expiry_date": "2025-02-08",
        "credential_id": "AWS-SAA-441209",
        "credential_url": "https://example.com/verify/aws",
    },
    {
        "name": "HashiCorp Certified: Terraform Associate",
        "issuer": "HashiCorp",
        "issue_date": "2021-09-30",
        "credential_id": "HC-TA-772310",
        "credential_url": "https://example.com/verify/terraform",
    },
    {
        "name": "Goethe-Zertifikat C2",
        "issuer": "Goethe-Institut",
        "issue_date": "2015-07-01",
        "credential_id": "GI-C2-2015-3391",
    },
]

PUBLICATIONS: list[dict[str, Any]] = [
    {
        "title": "Latency-Aware Replica Placement in Geo-Distributed Key-Value Stores",
        "authors": "A. Reinhardt, M. Køhler, T. Bauer",
        "venue": "European Conference on Computer Systems (EuroSys), Workshop Track",
        "date": "2018-04-24",
        "doi": "10.1145/0000000.0000000",
        "url": "https://example.com/paper",
        "abstract": (
            "We present a replica-placement heuristic that reduces cross-region read latency "
            "by 34% relative to uniform placement, using observed access patterns rather "
            "than static topology assumptions."
        ),
    }
]

AWARDS: list[dict[str, Any]] = [
    {
        "title": "Engineering Excellence Award",
        "issuer": "Nordbank Digital",
        "date": "2024-01-18",
        "description": (
            "Awarded for the ledger partitioning migration — delivered with zero downtime "
            "and zero data loss across a four-month programme."
        ),
    },
    {
        "title": "Best Workshop Paper",
        "issuer": "EuroSys 2018",
        "date": "2018-04-24",
        "description": "Awarded for the replica-placement paper in the student workshop track.",
    },
]

LANGUAGES: list[dict[str, Any]] = [
    {"name": "German", "level": "native", "notes": "Mother tongue"},
    {"name": "English", "level": "C2", "notes": "Working language for eight years"},
    {"name": "French", "level": "B1", "notes": "Conversational"},
]

VOLUNTEERING: list[dict[str, Any]] = [
    {
        "organisation": "Code Curious Berlin",
        "role": "Volunteer mentor",
        "start_date": "2021-03-01",
        "end_date": None,
        "is_current": True,
        "description": (
            "Weekend mentoring for career changers moving into software. Roughly 40 "
            "mentees so far; a dozen have landed their first engineering role."
        ),
    },
    {
        "organisation": "PyLadies Hamburg",
        "role": "Workshop organiser",
        "start_date": "2017-01-01",
        "end_date": "2019-12-31",
        "is_current": False,
        "description": "Ran a monthly beginner Python workshop for two years.",
    },
]

TALKS: list[dict[str, Any]] = [
    {
        "title": "Migrating 400 Million Rows Without Waking Anyone Up",
        "event": "PyCon DE 2024",
        "date": "2024-04-22",
        "url": "https://example.com/talk-1",
        "slides_url": "https://example.com/slides-1",
    },
    {
        "title": "Your Ledger Is Probably Wrong",
        "event": "Berlin Backend Meetup",
        "date": "2023-09-14",
        "url": "https://example.com/talk-2",
    },
    {
        "title": "Observability for People Who Hate Dashboards",
        "event": "SREcon EMEA",
        "date": "2022-10-11",
        "slides_url": "https://example.com/slides-3",
    },
]

INTERESTS: list[dict[str, Any]] = [
    {"name": "Long-distance cycling", "icon": "bike"},
    {"name": "Film photography", "icon": "camera"},
    {"name": "Bread baking", "icon": "wheat"},
    {"name": "Classical piano", "icon": "music"},
    {"name": "Trail running", "icon": "mountain"},
]

REFERENCES: list[dict[str, Any]] = [
    {
        "name": "Dr. Martina Køhler",
        "role": "VP Engineering",
        "company": "Nordbank Digital",
        "relationship": "Direct manager, 2022–present",
        "email": "m.koehler@example.com",
        "phone": "+49 30 98765432",
        "is_public": False,
    },
    {
        "name": "Tobias Bauer",
        "role": "Principal Engineer",
        "company": "Fleetwise GmbH",
        "relationship": "Technical mentor and peer, 2020–2022",
        "email": "t.bauer@example.com",
        "is_public": False,
    },
]
