"""Populate the database with the demo persona.

    python manage.py seed_demo           # add demo content
    python manage.py seed_demo --clear   # wipe all content first, then seed
    python manage.py seed_demo --no-images   # skip placeholder image generation

Everything it writes is fictional. Replace it through the admin or with
`import_resume` — you never need to edit the seeded rows by hand.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction

from portfolio import demo_data as demo
from portfolio.models import (
    Award,
    Certification,
    ContactMessage,
    Education,
    Experience,
    ExperienceHighlight,
    Interest,
    Language,
    Profile,
    Project,
    ProjectImage,
    Publication,
    Reference,
    SiteSettings,
    Skill,
    SkillCategory,
    SocialLink,
    Talk,
    Volunteering,
)
from portfolio.placeholders import avatar_image, gradient_image, logo_image

CONTENT_MODELS = (
    ExperienceHighlight,
    ProjectImage,
    Experience,
    Project,
    Education,
    Skill,
    SkillCategory,
    Certification,
    Publication,
    Award,
    Language,
    Reference,
    Volunteering,
    Interest,
    Talk,
    SocialLink,
    ContactMessage,
)


def _date(value: str | None) -> dt.date | None:
    return dt.date.fromisoformat(value) if value else None


class Command(BaseCommand):
    help = "Seed the database with a complete demo portfolio."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing portfolio content before seeding.",
        )
        parser.add_argument(
            "--no-images",
            action="store_true",
            help="Skip generating placeholder images (faster, used by tests).",
        )

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        clear: bool = options["clear"]
        with_images: bool = not options["no_images"]

        if clear:
            for model in CONTENT_MODELS:
                model.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing content."))

        self._seed_site_settings()
        self._seed_profile(with_images)
        self._seed_social_links()
        skills = self._seed_skills()
        self._seed_experience(skills, with_images)
        self._seed_education(with_images)
        self._seed_projects(skills, with_images)
        self._seed_simple_collections()

        self.stdout.write(self.style.SUCCESS("Demo portfolio seeded."))
        self.stdout.write("Next: python manage.py createsuperuser, then visit /admin/")

    # -- individual seeders -------------------------------------------------

    def _seed_site_settings(self) -> None:
        settings_obj = SiteSettings.load()
        for field, value in demo.SITE_SETTINGS.items():
            setattr(settings_obj, field, value)
        settings_obj.save()

    def _seed_profile(self, with_images: bool) -> None:
        profile = Profile.load()
        for field, value in demo.PROFILE.items():
            setattr(profile, field, _date(value) if field == "date_of_birth" else value)
        if with_images and not profile.photo:
            profile.photo.save("demo-portrait.jpg", avatar_image("portrait"), save=False)
        profile.save()

    def _seed_social_links(self) -> None:
        for index, item in enumerate(demo.SOCIAL_LINKS):
            SocialLink.objects.update_or_create(
                platform=item["platform"],
                defaults={"url": item["url"], "icon": item["icon"], "order": index},
            )

    def _seed_skills(self) -> dict[str, Skill]:
        lookup: dict[str, Skill] = {}
        for cat_index, category_data in enumerate(demo.SKILL_CATEGORIES):
            category, _ = SkillCategory.objects.update_or_create(
                name=category_data["name"],
                defaults={"icon": category_data["icon"], "order": cat_index},
            )
            for skill_index, skill_data in enumerate(category_data["skills"]):
                skill, _ = Skill.objects.update_or_create(
                    name=skill_data["name"],
                    category=category,
                    defaults={
                        "proficiency": skill_data["proficiency"],
                        "years_experience": skill_data.get("years_experience"),
                        "is_featured": skill_data.get("is_featured", False),
                        "order": skill_index,
                    },
                )
                lookup[skill.name] = skill
        return lookup

    def _seed_experience(self, skills: dict[str, Skill], with_images: bool) -> None:
        for index, item in enumerate(demo.EXPERIENCE):
            experience, _ = Experience.objects.update_or_create(
                company=item["company"],
                role=item["role"],
                defaults={
                    "company_url": item["company_url"],
                    "employment_type": item["employment_type"],
                    "location": item["location"],
                    "is_remote": item["is_remote"],
                    "start_date": _date(item["start_date"]),
                    "end_date": _date(item["end_date"]),
                    "is_current": item["is_current"],
                    "description": item["description"],
                    "order": index,
                },
            )
            if with_images and not experience.company_logo:
                experience.company_logo.save(
                    f"{experience.pk}-logo.jpg",
                    logo_image(item["company"], item["company"]),
                    save=True,
                )
            experience.skills.set([skills[name] for name in item["skills"] if name in skills])
            experience.highlights.all().delete()
            ExperienceHighlight.objects.bulk_create(
                [
                    ExperienceHighlight(experience=experience, text=text, order=i)
                    for i, text in enumerate(item["highlights"])
                ]
            )

    def _seed_education(self, with_images: bool) -> None:
        for index, item in enumerate(demo.EDUCATION):
            education, _ = Education.objects.update_or_create(
                institution=item["institution"],
                degree=item["degree"],
                defaults={
                    "field_of_study": item["field_of_study"],
                    "grade_value": item["grade_value"],
                    "grade_scale": item["grade_scale"],
                    "start_date": _date(item["start_date"]),
                    "end_date": _date(item["end_date"]),
                    "location": item["location"],
                    "thesis_title": item["thesis_title"],
                    "thesis_url": item.get("thesis_url", ""),
                    "coursework": item["coursework"],
                    "description": item["description"],
                    "order": index,
                },
            )
            if with_images and not education.logo:
                education.logo.save(
                    f"{education.pk}-logo.jpg",
                    logo_image(item["institution"], item["institution"]),
                    save=True,
                )

    def _seed_projects(self, skills: dict[str, Skill], with_images: bool) -> None:
        for index, item in enumerate(demo.PROJECTS):
            project, _ = Project.objects.update_or_create(
                title=item["title"],
                defaults={
                    "summary": item["summary"],
                    "description": item["description"],
                    "case_study": item["case_study"],
                    "role": item["role"],
                    "start_date": _date(item["start_date"]),
                    "end_date": _date(item["end_date"]),
                    "repo_url": item.get("repo_url", ""),
                    "live_url": item.get("live_url", ""),
                    "is_featured": item["is_featured"],
                    "metrics": item["metrics"],
                    "order": index,
                },
            )
            project.skills.set([skills[name] for name in item["skills"] if name in skills])
            if with_images and not project.cover_image:
                project.cover_image.save(
                    f"{project.slug}-cover.jpg",
                    gradient_image(project.title, 1200, 675, label=project.title),
                    save=True,
                )
            if with_images and not project.images.exists():
                for shot in range(2):
                    image = ProjectImage(
                        project=project,
                        caption=f"{project.title} — screen {shot + 1}",
                        order=shot,
                    )
                    image.image.save(
                        f"{project.slug}-{shot}.jpg",
                        gradient_image(f"{project.title}{shot}", 1200, 750),
                        save=False,
                    )
                    image.save()

    def _seed_simple_collections(self) -> None:
        for index, item in enumerate(demo.CERTIFICATIONS):
            Certification.objects.update_or_create(
                name=item["name"],
                issuer=item["issuer"],
                defaults={
                    "issue_date": _date(item.get("issue_date")),
                    "expiry_date": _date(item.get("expiry_date")),
                    "credential_id": item.get("credential_id", ""),
                    "credential_url": item.get("credential_url", ""),
                    "order": index,
                },
            )
        for index, item in enumerate(demo.PUBLICATIONS):
            Publication.objects.update_or_create(
                title=item["title"],
                defaults={
                    "authors": item["authors"],
                    "venue": item["venue"],
                    "date": _date(item["date"]),
                    "doi": item["doi"],
                    "url": item["url"],
                    "abstract": item["abstract"],
                    "order": index,
                },
            )
        for index, item in enumerate(demo.AWARDS):
            Award.objects.update_or_create(
                title=item["title"],
                defaults={
                    "issuer": item["issuer"],
                    "date": _date(item["date"]),
                    "description": item["description"],
                    "order": index,
                },
            )
        for index, item in enumerate(demo.LANGUAGES):
            Language.objects.update_or_create(
                name=item["name"],
                defaults={"level": item["level"], "notes": item["notes"], "order": index},
            )
        for index, item in enumerate(demo.VOLUNTEERING):
            Volunteering.objects.update_or_create(
                organisation=item["organisation"],
                role=item["role"],
                defaults={
                    "start_date": _date(item["start_date"]),
                    "end_date": _date(item["end_date"]),
                    "is_current": item["is_current"],
                    "description": item["description"],
                    "order": index,
                },
            )
        for index, item in enumerate(demo.TALKS):
            Talk.objects.update_or_create(
                title=item["title"],
                defaults={
                    "event": item["event"],
                    "date": _date(item["date"]),
                    "url": item.get("url", ""),
                    "slides_url": item.get("slides_url", ""),
                    "order": index,
                },
            )
        for index, item in enumerate(demo.INTERESTS):
            Interest.objects.update_or_create(
                name=item["name"], defaults={"icon": item["icon"], "order": index}
            )
        for index, item in enumerate(demo.REFERENCES):
            Reference.objects.update_or_create(
                name=item["name"],
                defaults={
                    "role": item["role"],
                    "company": item["company"],
                    "relationship": item["relationship"],
                    "email": item["email"],
                    "phone": item.get("phone", ""),
                    "is_public": item["is_public"],
                    "order": index,
                },
            )
