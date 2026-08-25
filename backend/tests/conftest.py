from __future__ import annotations

from typing import Any

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from portfolio.models import Profile, SiteSettings


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def admin_user(db: Any) -> User:
    return User.objects.create_superuser("admin", "admin@example.com", "password123")


@pytest.fixture
def admin_api(admin_user: User) -> APIClient:
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def site_settings(db: Any) -> SiteSettings:
    return SiteSettings.load()


@pytest.fixture
def profile(db: Any) -> Profile:
    obj = Profile.load()
    obj.full_name = "Test Person"
    obj.date_of_birth = "1990-01-01"
    obj.nationality = "German"
    obj.place_of_birth = "Berlin"
    obj.marital_status = "Single"
    obj.save()
    return obj


@pytest.fixture
def seeded(db: Any) -> None:
    """The full demo dataset, without image generation (which is slow)."""
    from io import StringIO

    from django.core.management import call_command

    call_command("seed_demo", "--no-images", stdout=StringIO())
