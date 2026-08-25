"""The bulk-import path: schema validation, idempotency, and --replace semantics."""

from __future__ import annotations

import json
from io import StringIO
from pathlib import Path
from typing import Any

import pytest
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError

from portfolio.models import (
    Education,
    Experience,
    ExperienceHighlight,
    Language,
    Profile,
    Project,
    Skill,
    SkillCategory,
)

pytestmark = pytest.mark.django_db

EXAMPLE = Path(settings.BASE_DIR) / "docs" / "resume.example.json"

MINIMAL: dict[str, Any] = {
    "profile": {"full_name": "Imported Person", "email": "imported@example.com"},
    "skill_categories": [
        {"name": "Languages", "skills": [{"name": "Python", "proficiency": 5}]}
    ],
    "experience": [
        {
            "company": "ACME",
            "role": "Engineer",
            "start_date": "2020-01-01",
            "highlights": ["Did a thing", "Did another thing"],
            "skills": ["Python"],
        }
    ],
    "education": [
        {
            "institution": "Uni",
            "degree": "B.Sc.",
            "start_date": "2015-10-01",
            "grade_value": "8.7",
            "grade_scale": "cgpa_10",
        }
    ],
    "projects": [{"title": "A Project", "summary": "Does something"}],
    "languages": [{"name": "German", "level": "native"}],
}


def write(tmp_path: Path, document: Any) -> str:
    path = tmp_path / "resume.json"
    path.write_text(json.dumps(document))
    return str(path)


def run_import(path: str, *args: str) -> str:
    out = StringIO()
    call_command("import_resume", path, *args, stdout=out)
    return out.getvalue()


class TestValidation:
    def test_missing_file_is_reported_clearly(self) -> None:
        with pytest.raises(CommandError, match="No such file"):
            run_import("/nonexistent/resume.json")

    def test_malformed_json_is_reported_clearly(self, tmp_path: Path) -> None:
        path = tmp_path / "bad.json"
        path.write_text("{not json")
        with pytest.raises(CommandError, match="not valid JSON"):
            run_import(str(path))

    def test_unknown_top_level_key_is_rejected(self, tmp_path: Path) -> None:
        with pytest.raises(CommandError, match="Schema validation failed"):
            run_import(write(tmp_path, {"nonsense": []}))

    def test_missing_required_field_is_rejected(self, tmp_path: Path) -> None:
        document = {"experience": [{"company": "ACME"}]}  # no role, no start_date
        with pytest.raises(CommandError, match="Schema validation failed"):
            run_import(write(tmp_path, document))

    def test_bad_enum_value_is_rejected(self, tmp_path: Path) -> None:
        document = {"languages": [{"name": "German", "level": "fluent"}]}
        with pytest.raises(CommandError, match="Schema validation failed"):
            run_import(write(tmp_path, document))

    def test_bad_date_format_is_rejected(self, tmp_path: Path) -> None:
        document = {
            "experience": [{"company": "A", "role": "B", "start_date": "01/01/2020"}]
        }
        with pytest.raises(CommandError, match="Schema validation failed"):
            run_import(write(tmp_path, document))

    def test_error_message_names_the_offending_location(self, tmp_path: Path) -> None:
        document = {"languages": [{"name": "German", "level": "fluent"}]}
        with pytest.raises(CommandError) as excinfo:
            run_import(write(tmp_path, document))
        assert "languages" in str(excinfo.value)

    def test_the_shipped_example_validates(self) -> None:
        output = run_import(str(EXAMPLE), "--dry-run")
        assert "is valid" in output

    def test_dry_run_writes_nothing(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL), "--dry-run")
        assert Project.objects.count() == 0
        assert Experience.objects.count() == 0


class TestImport:
    def test_minimal_document_imports_everything(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        assert Profile.load().full_name == "Imported Person"
        assert Experience.objects.count() == 1
        assert ExperienceHighlight.objects.count() == 2
        assert Education.objects.get().grade_value == "8.7"
        assert Project.objects.get().slug == "a-project"
        assert Language.objects.get().level == "native"

    def test_skills_are_linked_to_experience(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        experience = Experience.objects.get()
        assert [s.name for s in experience.skills.all()] == ["Python"]

    def test_omitted_sections_are_left_untouched(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        run_import(write(tmp_path, {"profile": {"full_name": "Renamed"}}))
        assert Profile.load().full_name == "Renamed"
        assert Project.objects.count() == 1, "projects should survive a profile-only import"

    def test_the_shipped_example_imports(self) -> None:
        run_import(str(EXAMPLE))
        assert Experience.objects.count() == 4
        assert Project.objects.count() == 6
        assert SkillCategory.objects.count() == 6


class TestIdempotency:
    def test_running_twice_does_not_duplicate(self, tmp_path: Path) -> None:
        path = write(tmp_path, MINIMAL)
        run_import(path)
        first = self._counts()
        run_import(path)
        assert self._counts() == first

    def test_running_the_example_twice_does_not_duplicate(self) -> None:
        run_import(str(EXAMPLE))
        first = self._counts()
        run_import(str(EXAMPLE))
        assert self._counts() == first

    def test_running_three_times_is_still_stable(self, tmp_path: Path) -> None:
        path = write(tmp_path, MINIMAL)
        for _ in range(3):
            run_import(path)
        assert Experience.objects.count() == 1
        assert ExperienceHighlight.objects.count() == 2, "highlights must not accumulate"

    def test_changed_values_are_updated_in_place(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        updated = json.loads(json.dumps(MINIMAL))
        updated["experience"][0]["description"] = "Now with a description"
        run_import(write(tmp_path, updated))
        assert Experience.objects.count() == 1
        assert Experience.objects.get().description == "Now with a description"

    @staticmethod
    def _counts() -> dict[str, int]:
        return {
            model.__name__: model.objects.count()
            for model in (
                Experience, ExperienceHighlight, Project, Skill,
                SkillCategory, Education, Language,
            )
        }


class TestReplace:
    def test_replace_removes_entries_no_longer_in_the_document(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        trimmed = json.loads(json.dumps(MINIMAL))
        trimmed["projects"] = [{"title": "Only Survivor", "summary": "s"}]
        run_import(write(tmp_path, trimmed), "--replace")
        assert [p.title for p in Project.objects.all()] == ["Only Survivor"]

    def test_replace_leaves_absent_sections_alone(self, tmp_path: Path) -> None:
        run_import(write(tmp_path, MINIMAL))
        run_import(write(tmp_path, {"profile": {"full_name": "X"}}), "--replace")
        assert Project.objects.count() == 1
