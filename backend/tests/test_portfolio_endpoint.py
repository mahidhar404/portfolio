"""The aggregate endpoint: shape, ordering, caching, and query count.

The query-count assertion is the important one — the whole point of this endpoint
is that the frontend paints from one round trip, so an accidental N+1 introduced
later must fail CI rather than quietly slow the site down.
"""

from __future__ import annotations

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from portfolio.models import SiteSettings
from tests.factories import (
    ExperienceFactory,
    ExperienceHighlightFactory,
    ProjectFactory,
    SkillFactory,
)

pytestmark = pytest.mark.django_db

# One query per section plus a handful for settings, profile and the ETag.
# Deliberately not a tight bound — it's a ceiling that catches N+1s, not a golden number.
MAX_QUERIES = 30


class TestShape:
    def test_returns_every_section_key(self, api: APIClient, seeded: None) -> None:
        payload = api.get("/api/v1/portfolio/").json()
        for key in (
            "settings", "profile", "section_order", "social_links", "experience",
            "education", "skill_categories", "projects", "certifications",
            "publications", "awards", "languages", "volunteering", "interests",
            "talks", "references", "generated_at",
        ):
            assert key in payload, f"missing {key}"

    def test_section_order_follows_site_settings(
        self, api: APIClient, site_settings: SiteSettings
    ) -> None:
        site_settings.sections = [
            {"key": "projects", "enabled": True},
            {"key": "about", "enabled": True},
            {"key": "awards", "enabled": False},
        ]
        site_settings.save()
        payload = api.get("/api/v1/portfolio/").json()
        assert payload["section_order"] == ["projects", "about"]

    def test_experience_includes_highlights_in_order(self, api: APIClient) -> None:
        experience = ExperienceFactory()
        ExperienceHighlightFactory(experience=experience, text="second", order=1)
        ExperienceHighlightFactory(experience=experience, text="first", order=0)
        payload = api.get("/api/v1/portfolio/").json()
        texts = [h["text"] for h in payload["experience"][0]["highlights"]]
        assert texts == ["first", "second"]

    def test_skill_categories_nest_their_published_skills(self, api: APIClient) -> None:
        skill = SkillFactory(name="Python")
        SkillFactory(name="Hidden", category=skill.category, is_published=False)
        payload = api.get("/api/v1/portfolio/").json()
        names = [s["name"] for s in payload["skill_categories"][0]["skills"]]
        assert names == ["Python"]

    def test_empty_database_still_returns_a_valid_payload(self, api: APIClient) -> None:
        response = api.get("/api/v1/portfolio/")
        assert response.status_code == 200
        assert response.json()["experience"] == []
        assert response.json()["profile"]["full_name"] == "Your Name"


class TestQueryCount:
    def test_aggregate_endpoint_does_not_n_plus_one(self, api: APIClient, seeded: None) -> None:
        with CaptureQueriesContext(connection) as captured:
            response = api.get("/api/v1/portfolio/")
        assert response.status_code == 200
        assert len(captured) <= MAX_QUERIES, (
            f"{len(captured)} queries, expected <= {MAX_QUERIES}:\n"
            + "\n".join(q["sql"][:120] for q in captured)
        )

    def test_query_count_does_not_grow_with_content(self, api: APIClient) -> None:
        """Ten of everything must cost exactly what one of everything costs.

        Both sides of the comparison start non-empty: Django skips a prefetch
        query entirely when the parent set is empty, so comparing against an
        empty database would measure that, not an N+1.
        """

        def make_content(count: int) -> None:
            ProjectFactory.create_batch(count)
            for _ in range(count):
                experience = ExperienceFactory()
                ExperienceHighlightFactory.create_batch(3, experience=experience)
                SkillFactory()

        make_content(1)
        api.get("/api/v1/portfolio/")  # warm up: creates the singleton rows

        with CaptureQueriesContext(connection) as small:
            api.get("/api/v1/portfolio/")

        make_content(9)

        with CaptureQueriesContext(connection) as large:
            api.get("/api/v1/portfolio/")

        assert len(large) == len(small), (
            f"query count grew from {len(small)} to {len(large)} when content grew 10x:\n"
            + "\n".join(q["sql"][:120] for q in large)
        )


class TestCaching:
    def test_response_carries_etag_and_cache_control(self, api: APIClient, seeded: None) -> None:
        response = api.get("/api/v1/portfolio/")
        assert response["ETag"].startswith('W/"')
        assert "max-age=60" in response["Cache-Control"]
        assert "stale-while-revalidate=600" in response["Cache-Control"]

    def test_matching_etag_returns_304(self, api: APIClient, seeded: None) -> None:
        first = api.get("/api/v1/portfolio/")
        second = api.get("/api/v1/portfolio/", HTTP_IF_NONE_MATCH=first["ETag"])
        assert second.status_code == 304
        assert second["ETag"] == first["ETag"]

    def test_etag_changes_when_content_changes(self, api: APIClient, seeded: None) -> None:
        before = api.get("/api/v1/portfolio/")["ETag"]
        ProjectFactory(title="Brand New Project")
        after = api.get("/api/v1/portfolio/")["ETag"]
        assert before != after

    def test_stale_etag_returns_fresh_content(self, api: APIClient, seeded: None) -> None:
        stale = api.get("/api/v1/portfolio/")["ETag"]
        ProjectFactory(title="Newer")
        response = api.get("/api/v1/portfolio/", HTTP_IF_NONE_MATCH=stale)
        assert response.status_code == 200


class TestGranularEndpoints:
    def test_project_detail_is_looked_up_by_slug(self, api: APIClient) -> None:
        ProjectFactory(title="Slug Lookup", case_study="## Long form")
        response = api.get("/api/v1/projects/slug-lookup/")
        assert response.status_code == 200
        assert response.json()["case_study"] == "## Long form"

    def test_project_list_omits_the_case_study(self, api: APIClient) -> None:
        ProjectFactory(title="Listed", case_study="## Long form")
        entry = api.get("/api/v1/projects/").json()["results"][0]
        assert "case_study" not in entry

    def test_projects_are_filterable_by_featured(self, api: APIClient) -> None:
        ProjectFactory(title="Featured One", is_featured=True)
        ProjectFactory(title="Plain One", is_featured=False)
        results = api.get("/api/v1/projects/?is_featured=true").json()["results"]
        assert [p["title"] for p in results] == ["Featured One"]

    def test_projects_are_searchable(self, api: APIClient) -> None:
        ProjectFactory(title="Kafka Pipeline", summary="streams")
        ProjectFactory(title="Static Site", summary="html")
        results = api.get("/api/v1/projects/?search=kafka").json()["results"]
        assert [p["title"] for p in results] == ["Kafka Pipeline"]

    def test_health_endpoint_reports_ok(self, api: APIClient) -> None:
        response = api.get("/api/health/")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestSchema:
    def test_openapi_schema_generates(self, api: APIClient) -> None:
        response = api.get("/api/schema/")
        assert response.status_code == 200

    def test_swagger_ui_renders(self, api: APIClient) -> None:
        assert api.get("/api/docs/").status_code == 200
