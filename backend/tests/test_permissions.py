"""Read is public, write is staff-only. Proven per endpoint, not assumed."""

from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from portfolio.models import Profile, Project, SiteSettings
from tests.factories import ProjectFactory

pytestmark = pytest.mark.django_db

WRITE_ENDPOINTS = [
    ("/api/v1/projects/", {"title": "New", "summary": "s"}),
    ("/api/v1/experience/", {"company": "C", "role": "R", "start_date": "2020-01-01"}),
    ("/api/v1/education/", {"institution": "U", "degree": "B.Sc.", "start_date": "2015-01-01"}),
    ("/api/v1/skills/", {"name": "New Skill"}),
    ("/api/v1/certifications/", {"name": "Cert", "issuer": "Issuer"}),
    ("/api/v1/awards/", {"title": "Award"}),
    ("/api/v1/languages/", {"name": "Spanish", "level": "B1"}),
    ("/api/v1/talks/", {"title": "Talk"}),
    ("/api/v1/interests/", {"name": "Chess"}),
    ("/api/v1/social-links/", {"platform": "GitHub", "url": "https://example.com"}),
    ("/api/v1/references/", {"name": "Referee"}),
]

READ_ENDPOINTS = [
    "/api/v1/portfolio/",
    "/api/v1/projects/",
    "/api/v1/experience/",
    "/api/v1/education/",
    "/api/v1/skills/",
    "/api/v1/skill-categories/",
    "/api/v1/certifications/",
    "/api/v1/publications/",
    "/api/v1/awards/",
    "/api/v1/languages/",
    "/api/v1/volunteering/",
    "/api/v1/interests/",
    "/api/v1/talks/",
    "/api/v1/social-links/",
    "/api/v1/references/",
    "/api/v1/profile/",
    "/api/v1/site-settings/",
]


class TestAnonymousRead:
    @pytest.mark.parametrize("url", READ_ENDPOINTS)
    def test_read_is_public(self, api: APIClient, url: str, seeded: None) -> None:
        assert api.get(url).status_code == 200

    @pytest.mark.parametrize("url", READ_ENDPOINTS)
    def test_read_is_cacheable(self, api: APIClient, url: str, seeded: None) -> None:
        assert "max-age" in api.get(url)["Cache-Control"]


class TestAnonymousWriteIsRefused:
    @pytest.mark.parametrize(("url", "payload"), WRITE_ENDPOINTS)
    def test_post_is_refused(self, api: APIClient, url: str, payload: dict[str, str]) -> None:
        assert api.post(url, payload).status_code in (401, 403)

    def test_delete_is_refused(self, api: APIClient) -> None:
        project = ProjectFactory()
        assert api.delete(f"/api/v1/projects/{project.slug}/").status_code in (401, 403)
        assert Project.objects.filter(pk=project.pk).exists()

    def test_patch_is_refused(self, api: APIClient) -> None:
        project = ProjectFactory(title="Original")
        api.patch(f"/api/v1/projects/{project.slug}/", {"title": "Hacked"})
        project.refresh_from_db()
        assert project.title == "Original"

    def test_singleton_write_is_refused(self, api: APIClient) -> None:
        api.patch("/api/v1/profile/", {"full_name": "Hacked"})
        assert Profile.load().full_name != "Hacked"

    def test_site_settings_write_is_refused(self, api: APIClient) -> None:
        api.patch("/api/v1/site-settings/", {"site_title": "Hacked"})
        assert SiteSettings.load().site_title != "Hacked"


class TestNonStaffUserIsRefused:
    def test_authenticated_but_not_staff_cannot_write(self, api: APIClient) -> None:
        user = User.objects.create_user("regular", "r@example.com", "password123")
        token, _ = Token.objects.get_or_create(user=user)
        api.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = api.post("/api/v1/projects/", {"title": "New", "summary": "s"})
        assert response.status_code == 403


class TestAdminWrite:
    """The Swagger path: authorize with a token, then POST content."""

    def test_admin_can_create_a_project(self, admin_api: APIClient) -> None:
        response = admin_api.post(
            "/api/v1/projects/", {"title": "Injected", "summary": "via API"}
        )
        assert response.status_code == 201
        assert Project.objects.filter(title="Injected").exists()

    def test_admin_can_update_the_profile(self, admin_api: APIClient) -> None:
        response = admin_api.patch("/api/v1/profile/", {"full_name": "Real Name"})
        assert response.status_code == 200
        assert Profile.load().full_name == "Real Name"

    def test_admin_can_update_site_settings(self, admin_api: APIClient) -> None:
        response = admin_api.patch("/api/v1/site-settings/", {"site_title": "My Site"})
        assert response.status_code == 200
        assert SiteSettings.load().site_title == "My Site"

    def test_admin_can_delete(self, admin_api: APIClient) -> None:
        project = ProjectFactory()
        assert admin_api.delete(f"/api/v1/projects/{project.slug}/").status_code == 204
        assert not Project.objects.filter(pk=project.pk).exists()

    def test_admin_sees_unpublished_content(self, admin_api: APIClient) -> None:
        ProjectFactory(is_published=False)
        assert admin_api.get("/api/v1/projects/").json()["count"] == 1
