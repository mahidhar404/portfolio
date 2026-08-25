"""The two privacy rules that must never regress.

1. Reference contact details are withheld unless is_public is explicitly True.
2. German-CV personal details are withheld unless show_personal_details is on.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from portfolio.models import Profile, SiteSettings
from tests.factories import ReferenceFactory

pytestmark = pytest.mark.django_db


class TestReferencePrivacy:
    @pytest.fixture(autouse=True)
    def _enable_references(self, site_settings: SiteSettings) -> None:
        site_settings.show_references = True
        site_settings.save()

    def test_private_reference_contact_details_are_masked_on_aggregate(
        self, api: APIClient
    ) -> None:
        ReferenceFactory(name="Private Person", email="secret@example.com", is_public=False)
        payload = api.get("/api/v1/portfolio/").json()
        entry = next(r for r in payload["references"] if r["name"] == "Private Person")
        assert entry["email"] == ""
        assert entry["phone"] == ""

    def test_private_reference_contact_details_are_masked_on_list_endpoint(
        self, api: APIClient
    ) -> None:
        ReferenceFactory(email="secret@example.com", phone="+49 111", is_public=False)
        entry = api.get("/api/v1/references/").json()["results"][0]
        assert entry["email"] == ""
        assert entry["phone"] == ""

    def test_public_reference_contact_details_are_exposed(self, api: APIClient) -> None:
        ReferenceFactory(name="Public Person", email="open@example.com",
                         phone="+49 222", is_public=True)
        entry = api.get("/api/v1/references/").json()["results"][0]
        assert entry["email"] == "open@example.com"
        assert entry["phone"] == "+49 222"

    def test_secret_never_appears_anywhere_in_the_raw_response(self, api: APIClient) -> None:
        """Belt and braces: the string must not leak via any other field."""
        ReferenceFactory(email="topsecret@example.com", phone="+49 999", is_public=False)
        body = api.get("/api/v1/portfolio/").content.decode()
        assert "topsecret@example.com" not in body
        assert "+49 999" not in body

    def test_references_are_omitted_entirely_when_the_section_is_off(
        self, api: APIClient, site_settings: SiteSettings
    ) -> None:
        site_settings.show_references = False
        site_settings.save()
        ReferenceFactory(name="Hidden", is_public=True)
        payload = api.get("/api/v1/portfolio/").json()
        assert payload["references"] == []


class TestPersonalDetailPrivacy:
    def test_personal_details_hidden_by_default(
        self, api: APIClient, profile: Profile, site_settings: SiteSettings
    ) -> None:
        assert site_settings.show_personal_details is False
        returned = api.get("/api/v1/portfolio/").json()["profile"]
        assert returned["date_of_birth"] is None
        assert returned["nationality"] is None
        assert returned["place_of_birth"] is None
        assert returned["marital_status"] is None

    def test_personal_details_shown_when_flag_is_on(
        self, api: APIClient, profile: Profile, site_settings: SiteSettings
    ) -> None:
        site_settings.show_personal_details = True
        site_settings.save()
        returned = api.get("/api/v1/portfolio/").json()["profile"]
        assert returned["date_of_birth"] == "1990-01-01"
        assert returned["nationality"] == "German"

    def test_flag_applies_to_the_profile_endpoint_too(
        self, api: APIClient, profile: Profile, site_settings: SiteSettings
    ) -> None:
        assert site_settings.show_personal_details is False
        returned = api.get("/api/v1/profile/").json()
        assert returned["date_of_birth"] is None


class TestUnpublishedContentIsHidden:
    def test_unpublished_reference_is_not_returned(
        self, api: APIClient, site_settings: SiteSettings
    ) -> None:
        site_settings.show_references = True
        site_settings.save()
        ReferenceFactory(name="Draft", is_published=False)
        payload = api.get("/api/v1/portfolio/").json()
        assert payload["references"] == []

    def test_unpublished_project_is_hidden_from_anonymous_users(
        self, api: APIClient, admin_api: APIClient
    ) -> None:
        from tests.factories import ProjectFactory

        ProjectFactory(title="Draft Project", is_published=False)
        assert api.get("/api/v1/projects/").json()["count"] == 0
        assert admin_api.get("/api/v1/projects/").json()["count"] == 1
