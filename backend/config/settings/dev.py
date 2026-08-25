"""Local development: SQLite, DEBUG on, CORS wide open to localhost.

SQLite by default is deliberate — a clean clone runs with zero database setup.
Set DATABASE_URL to point at Postgres locally if you want parity with production.
"""

from __future__ import annotations

from typing import Any

import dj_database_url

from .base import *  # noqa: F403
from .base import BASE_DIR, env

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "api", "testserver"]

DATABASES: dict[str, Any] = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

CORS_ALLOWED_ORIGIN_REGEXES = [r"^http://(localhost|127\.0\.0\.1):\d+$"]
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Files stay on disk locally; Cloudinary is a production-only concern.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
