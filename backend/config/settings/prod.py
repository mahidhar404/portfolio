"""Production: Postgres, Cloudinary media, locked-down security headers.

Every value that matters comes from the environment and has no usable default —
a missing DJANGO_SECRET_KEY or DATABASE_URL should fail loudly at boot, not
silently run insecurely.
"""

from __future__ import annotations

from typing import Any

import dj_database_url

from .base import *  # noqa: F403
from .base import env, env_bool, env_list

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY must be set in production")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set in production")

_database_url = env("DATABASE_URL")
if not _database_url:
    raise RuntimeError("DATABASE_URL must be set in production")

DATABASES: dict[str, Any] = {
    "default": dj_database_url.parse(_database_url, conn_max_age=600, ssl_require=True)
}

# --- Media on Cloudinary ---------------------------------------------------
# Render's disk is ephemeral: anything uploaded through the admin would vanish
# on the next deploy, so uploads go to Cloudinary instead.
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": env("CLOUDINARY_API_KEY"),
    "API_SECRET": env("CLOUDINARY_API_SECRET"),
}

if CLOUDINARY_STORAGE["CLOUD_NAME"]:
    INSTALLED_APPS = [*INSTALLED_APPS, "cloudinary", "cloudinary_storage"]  # noqa: F405
    STORAGES = {
        "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }

# --- Security --------------------------------------------------------------
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"

# CORS is restricted to the Vercel domains only — set these or the frontend
# cannot talk to the API at all.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGIN_REGEXES = env_list("CORS_ALLOWED_ORIGIN_REGEXES")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
