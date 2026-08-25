"""seed_demo must produce a site that looks finished on a clean clone."""

from __future__ import annotations

from io import StringIO

import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from portfolio.models import (
    Award,
    Certification,
    Education,
    Experience,
    ExperienceHighlight,
    Interest,
    Language,
    Profile,
    Project,
    Publication,
    SkillCategory,
    SocialLink,
    Talk,
)

pytestmark = pytest.mark.django_db


def seed(*args: str) -> None:
    call_command("seed_demo", "--no-images", *args, stdout=StringIO())


class TestSeed:
    def test_seeds_a_complete_persona(self) -> None:
        seed()
        assert Experience.objects.count() == 4
        assert Project.objects.count() == 6
        assert SkillCategory.objects.count() == 6
        assert Education.objects.count() == 2
        assert Certification.objects.count() == 4
        assert Language.objects.count() == 3
        assert Award.objects.count() == 2
        assert Publication.objects.count() == 1
        assert Talk.objects.count() == 3
        assert Interest.objects.count() == 5
        assert SocialLink.objects.count() == 4
        assert Profile.load().full_name == "Alexandra Reinhardt"

    def test_every_role_has_highlights(self) -> None:
        seed()
        for experience in Experience.objects.all():
            assert experience.highlights.exists(), f"{experience} has no bullets"

    def test_every_project_has_a_summary_and_skills(self) -> None:
        seed()
        for project in Project.objects.all():
            assert project.summary
            assert project.skills.exists(), f"{project} has no skills"

    def test_seeding_twice_does_not_duplicate(self) -> None:
        seed()
        seed()
        assert Experience.objects.count() == 4
        assert ExperienceHighlight.objects.count() == 11
        assert Project.objects.count() == 6

    def test_clear_wipes_content_first(self) -> None:
        seed()
        Project.objects.create(title="Manual entry", summary="added by hand")
        seed("--clear")
        assert not Project.objects.filter(title="Manual entry").exists()
        assert Project.objects.count() == 6

    def test_seeded_site_renders_every_section(self, api: APIClient) -> None:
        """The whole point: a clean clone shows a full site, not empty placeholders."""
        seed()
        payload = api.get("/api/v1/portfolio/").json()
        for key in ("experience", "projects", "skill_categories", "education",
                    "certifications", "languages", "awards", "talks", "interests"):
            assert payload[key], f"{key} is empty after seeding"


class TestImageGeneration:
    def test_images_are_generated_when_not_skipped(self) -> None:
        """Slower path, run once: placeholder images must actually be produced."""
        call_command("seed_demo", stdout=StringIO())
        assert Profile.load().photo
        assert Project.objects.exclude(cover_image="").count() == 6
        assert all(p.images.count() == 2 for p in Project.objects.all())
