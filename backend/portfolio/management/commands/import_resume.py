"""Load an entire resume from one JSON document.

    python manage.py import_resume docs/resume.example.json
    python manage.py import_resume my-resume.json --replace

Idempotent by design: entries are matched on their natural key (company+role,
institution+degree, project title, …) and updated in place, so running the same
file twice produces the same database, never duplicates.

``--replace`` deletes any existing rows of a type the document provides, which is
what you want when you have removed an entry from your resume.
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any

import jsonschema
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

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
    Reference,
    SiteSettings,
    Skill,
    SkillCategory,
    SocialLink,
    Talk,
    Volunteering,
)
from portfolio.resume_schema import RESUME_SCHEMA


def _date(value: str | None) -> dt.date | None:
    return dt.date.fromisoformat(value) if value else None


def _required_date(value: str | None) -> dt.date:
    """For model fields that are NOT NULL — the schema guarantees these are present."""
    if not value:
        raise ValueError("a required date was missing")
    return dt.date.fromisoformat(value)


class Command(BaseCommand):
    help = "Import a full resume from a JSON document (idempotent)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("path", type=str, help="Path to the resume JSON file.")
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete existing entries of each type the document provides before importing.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate the document and report what would change, without writing.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        path = Path(options["path"])
        if not path.exists():
            raise CommandError(f"No such file: {path}")

        try:
            document = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            raise CommandError(f"{path} is not valid JSON: {exc}") from exc

        try:
            jsonschema.validate(document, RESUME_SCHEMA)
        except jsonschema.ValidationError as exc:
            location = " → ".join(str(part) for part in exc.absolute_path) or "(root)"
            raise CommandError(f"Schema validation failed at {location}: {exc.message}") from exc

        self.stdout.write(self.style.SUCCESS(f"{path.name} is valid."))

        if options["dry_run"]:
            for key, value in document.items():
                count = len(value) if isinstance(value, list) else 1
                self.stdout.write(f"  would import {key}: {count}")
            self.stdout.write(self.style.WARNING("Dry run — nothing written."))
            return

        with transaction.atomic():
            self._import(document, replace=options["replace"])

        self.stdout.write(self.style.SUCCESS("Resume imported."))

    # -- importers ----------------------------------------------------------

    def _import(self, doc: dict[str, Any], *, replace: bool) -> None:
        if "site_settings" in doc:
            obj = SiteSettings.load()
            for field, value in doc["site_settings"].items():
                setattr(obj, field, value)
            obj.full_clean()
            obj.save()
            self._report("site_settings", 1)

        if "profile" in doc:
            profile = Profile.load()
            for field, value in doc["profile"].items():
                setattr(profile, field, _date(value) if field == "date_of_birth" else value)
            profile.save()
            self._report("profile", 1)

        if "social_links" in doc:
            if replace:
                SocialLink.objects.all().delete()
            for index, item in enumerate(doc["social_links"]):
                SocialLink.objects.update_or_create(
                    platform=item["platform"],
                    defaults={
                        "url": item["url"],
                        "icon": item.get("icon", ""),
                        "order": index,
                    },
                )
            self._report("social_links", len(doc["social_links"]))

        skills = self._import_skills(doc, replace=replace)

        if "experience" in doc:
            if replace:
                Experience.objects.all().delete()
            for index, item in enumerate(doc["experience"]):
                experience, _ = Experience.objects.update_or_create(
                    company=item["company"],
                    role=item["role"],
                    defaults={
                        "company_url": item.get("company_url", ""),
                        "employment_type": item.get("employment_type", "full_time"),
                        "location": item.get("location", ""),
                        "is_remote": item.get("is_remote", False),
                        "start_date": _required_date(item["start_date"]),
                        "end_date": _date(item.get("end_date")),
                        "is_current": item.get("is_current", False),
                        "description": item.get("description", ""),
                        "order": index,
                    },
                )
                experience.skills.set(
                    [skills[name] for name in item.get("skills", []) if name in skills]
                )
                experience.highlights.all().delete()
                ExperienceHighlight.objects.bulk_create(
                    [
                        ExperienceHighlight(experience=experience, text=text, order=i)
                        for i, text in enumerate(item.get("highlights", []))
                    ]
                )
            self._report("experience", len(doc["experience"]))

        if "education" in doc:
            if replace:
                Education.objects.all().delete()
            for index, item in enumerate(doc["education"]):
                Education.objects.update_or_create(
                    institution=item["institution"],
                    degree=item["degree"],
                    defaults={
                        "field_of_study": item.get("field_of_study", ""),
                        "grade_value": item.get("grade_value", ""),
                        "grade_scale": item.get("grade_scale", ""),
                        "start_date": _required_date(item["start_date"]),
                        "end_date": _date(item.get("end_date")),
                        "is_current": item.get("is_current", False),
                        "location": item.get("location", ""),
                        "thesis_title": item.get("thesis_title", ""),
                        "thesis_url": item.get("thesis_url", ""),
                        "coursework": item.get("coursework", []),
                        "description": item.get("description", ""),
                        "order": index,
                    },
                )
            self._report("education", len(doc["education"]))

        if "projects" in doc:
            if replace:
                Project.objects.all().delete()
            for index, item in enumerate(doc["projects"]):
                project, _ = Project.objects.update_or_create(
                    title=item["title"],
                    defaults={
                        "summary": item["summary"],
                        "description": item.get("description", ""),
                        "case_study": item.get("case_study", ""),
                        "role": item.get("role", ""),
                        "start_date": _date(item.get("start_date")),
                        "end_date": _date(item.get("end_date")),
                        "repo_url": item.get("repo_url", ""),
                        "live_url": item.get("live_url", ""),
                        "is_featured": item.get("is_featured", False),
                        "metrics": item.get("metrics", {}),
                        "order": index,
                    },
                )
                project.skills.set(
                    [skills[name] for name in item.get("skills", []) if name in skills]
                )
            self._report("projects", len(doc["projects"]))

        self._import_simple(doc, replace=replace)

    def _import_skills(self, doc: dict[str, Any], *, replace: bool) -> dict[str, Skill]:
        lookup: dict[str, Skill] = {}
        if "skill_categories" not in doc:
            return {skill.name: skill for skill in Skill.objects.all()}
        if replace:
            Skill.objects.all().delete()
            SkillCategory.objects.all().delete()
        for cat_index, category_data in enumerate(doc["skill_categories"]):
            category, _ = SkillCategory.objects.update_or_create(
                name=category_data["name"],
                defaults={"icon": category_data.get("icon", ""), "order": cat_index},
            )
            for skill_index, skill_data in enumerate(category_data.get("skills", [])):
                skill, _ = Skill.objects.update_or_create(
                    name=skill_data["name"],
                    category=category,
                    defaults={
                        "proficiency": skill_data.get("proficiency", 3),
                        "years_experience": skill_data.get("years_experience"),
                        "is_featured": skill_data.get("is_featured", False),
                        "icon": skill_data.get("icon", ""),
                        "order": skill_index,
                    },
                )
                lookup[skill.name] = skill
        self._report("skill_categories", len(doc["skill_categories"]))
        return lookup

    def _import_simple(self, doc: dict[str, Any], *, replace: bool) -> None:
        """The collections that are a flat field mapping with one natural key."""
        specs: list[tuple[str, type[Any], str, tuple[str, ...], tuple[str, ...]]] = [
            # (doc key, model, natural key field, date fields, plain fields)
            ("certifications", Certification, "name",
             ("issue_date", "expiry_date"), ("issuer", "credential_id", "credential_url")),
            ("publications", Publication, "title",
             ("date",), ("authors", "venue", "doi", "url", "abstract")),
            ("awards", Award, "title", ("date",), ("issuer", "description")),
            ("languages", Language, "name", (), ("level", "notes")),
            ("volunteering", Volunteering, "organisation",
             ("start_date", "end_date"), ("role", "is_current", "description")),
            ("talks", Talk, "title", ("date",), ("event", "url", "slides_url")),
            ("interests", Interest, "name", (), ("icon",)),
            ("references", Reference, "name", (),
             ("role", "company", "relationship", "email", "phone", "is_public")),
        ]
        for key, model, natural_key, date_fields, plain_fields in specs:
            if key not in doc:
                continue
            if replace:
                model.objects.all().delete()
            for index, item in enumerate(doc[key]):
                defaults: dict[str, Any] = {"order": index}
                for field in date_fields:
                    defaults[field] = _date(item.get(field))
                for field in plain_fields:
                    if field in item:
                        defaults[field] = item[field]
                model.objects.update_or_create(
                    **{natural_key: item[natural_key]}, defaults=defaults
                )
            self._report(key, len(doc[key]))

    def _report(self, label: str, count: int) -> None:
        self.stdout.write(f"  {label}: {count}")
