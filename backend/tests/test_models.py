"""Model invariants: singletons, slugs, and the validation rules."""

from __future__ import annotations

import datetime as dt

import pytest
from django.core.exceptions import ValidationError

from portfolio.models import Education, Experience, Profile, Project, SiteSettings
from tests.factories import ProjectFactory

pytestmark = pytest.mark.django_db


class TestSingletons:
    def test_load_creates_exactly_one_row(self) -> None:
        first = SiteSettings.load()
        second = SiteSettings.load()
        assert first.pk == second.pk == 1
        assert SiteSettings.objects.count() == 1

    def test_saving_a_second_instance_overwrites_the_first(self) -> None:
        SiteSettings.load()
        SiteSettings(site_title="Second").save()
        assert SiteSettings.objects.count() == 1
        assert SiteSettings.objects.get().site_title == "Second"

    def test_delete_is_refused(self) -> None:
        with pytest.raises(ValidationError, match="singleton"):
            Profile.load().delete()

    def test_default_sections_cover_every_key(self) -> None:
        settings_obj = SiteSettings.load()
        keys = [item["key"] for item in settings_obj.sections]
        assert len(keys) == len(set(keys)), "no duplicate section keys"
        assert "experience" in keys and "references" in keys


class TestSiteSettingsValidation:
    def test_rejects_unknown_section_key(self) -> None:
        settings_obj = SiteSettings.load()
        settings_obj.sections = [{"key": "not_a_section", "enabled": True}]
        with pytest.raises(ValidationError, match="Unknown section key"):
            settings_obj.clean()

    def test_rejects_duplicate_section_key(self) -> None:
        settings_obj = SiteSettings.load()
        settings_obj.sections = [
            {"key": "about", "enabled": True},
            {"key": "about", "enabled": False},
        ]
        with pytest.raises(ValidationError, match="Duplicate section key"):
            settings_obj.clean()

    def test_enabled_section_keys_skips_disabled(self) -> None:
        settings_obj = SiteSettings.load()
        settings_obj.sections = [
            {"key": "about", "enabled": True},
            {"key": "awards", "enabled": False},
        ]
        assert settings_obj.enabled_section_keys() == ["about"]


class TestProjectSlug:
    def test_slug_is_derived_from_title(self) -> None:
        project = ProjectFactory(title="My Great Project")
        assert project.slug == "my-great-project"

    def test_duplicate_titles_get_distinct_slugs(self) -> None:
        first = ProjectFactory(title="Same Name")
        second = ProjectFactory(title="Same Name")
        assert first.slug == "same-name"
        assert second.slug == "same-name-2"
        assert Project.objects.filter(slug="same-name").count() == 1

    def test_explicit_slug_is_respected(self) -> None:
        project = ProjectFactory(title="Anything", slug="custom-slug")
        assert project.slug == "custom-slug"


class TestDateValidation:
    def test_experience_end_before_start_is_rejected(self) -> None:
        experience = Experience(
            company="X", role="Y",
            start_date=dt.date(2022, 1, 1), end_date=dt.date(2021, 1, 1),
        )
        with pytest.raises(ValidationError, match="before the start date"):
            experience.clean()

    def test_current_role_cannot_have_end_date(self) -> None:
        experience = Experience(
            company="X", role="Y",
            start_date=dt.date(2022, 1, 1), end_date=dt.date(2023, 1, 1), is_current=True,
        )
        with pytest.raises(ValidationError, match="cannot have an end date"):
            experience.clean()

    def test_grade_without_scale_is_rejected(self) -> None:
        education = Education(
            institution="Uni", degree="B.Sc.",
            start_date=dt.date(2015, 1, 1), grade_value="8.7",
        )
        with pytest.raises(ValidationError, match="Pick a scale"):
            education.clean()

    def test_grade_with_scale_is_accepted(self) -> None:
        education = Education(
            institution="Uni", degree="B.Sc.", start_date=dt.date(2015, 1, 1),
            grade_value="8.7", grade_scale=Education.GradeScale.CGPA_10,
        )
        education.clean()  # does not raise


class TestOrdering:
    def test_published_default_and_ordering_field_exist(self) -> None:
        first = ProjectFactory(order=2)
        second = ProjectFactory(order=1)
        assert first.is_published is True
        assert list(Project.objects.all()) == [second, first]
