"""Test settings: in-memory SQLite, fast hasher, throttling rates kept realistic."""

from __future__ import annotations

from typing import Any

from .base import *  # noqa: F403
from .base import REST_FRAMEWORK

DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost"]
SECRET_KEY = "test-only-key"  # noqa: S105

DATABASES: dict[str, Any] = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Throttle tests need the real rate; everything else runs without a cache backend.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": 0}
