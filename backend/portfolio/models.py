"""The single source of truth for every word on the portfolio site.

Three abstract bases carry the conventions the whole app relies on:

* ``TimeStamped``  — ``created_at`` / ``updated_at`` on everything, which the
  aggregate endpoint's ETag is computed from.
* ``Orderable``    — ``is_published`` + ``order`` on every list-type model, so any
  entry can be hidden or reordered from the admin without a deploy.
* ``Singleton``    — enforces exactly one row for site-wide configuration.
"""

from __future__ import annotations

from typing import Any, ClassVar, Self

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify


class SectionKey(models.TextChoices):
    """Every renderable section. The frontend maps these to components."""

    ABOUT = "about", "About / summary"
    EXPERIENCE = "experience", "Work experience"
    EDUCATION = "education", "Education"
    SKILLS = "skills", "Skills"
    PROJECTS = "projects", "Projects"
    CERTIFICATIONS = "certifications", "Certifications"
    PUBLICATIONS = "publications", "Publications"
    AWARDS = "awards", "Awards"
    LANGUAGES = "languages", "Languages"
    VOLUNTEERING = "volunteering", "Volunteering"
    TALKS = "talks", "Talks & workshops"
    INTERESTS = "interests", "Interests"
    REFERENCES = "references", "References"
    CONTACT = "contact", "Contact"


def default_sections() -> list[dict[str, Any]]:
    """Default section order — every section on, in a sensible resume order."""
    return [
        {"key": key.value, "enabled": True, "label": None}
        for key in (
            SectionKey.ABOUT,
            SectionKey.EXPERIENCE,
            SectionKey.PROJECTS,
            SectionKey.SKILLS,
            SectionKey.EDUCATION,
            SectionKey.CERTIFICATIONS,
            SectionKey.PUBLICATIONS,
            SectionKey.AWARDS,
            SectionKey.LANGUAGES,
            SectionKey.VOLUNTEERING,
            SectionKey.TALKS,
            SectionKey.INTERESTS,
            SectionKey.REFERENCES,
            SectionKey.CONTACT,
        )
    ]


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Orderable(TimeStamped):
    """List-type content: hideable and reorderable from the admin."""

    is_published = models.BooleanField(
        default=True, help_text="Untick to hide this entry from the site without deleting it."
    )
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ["order", "-pk"]


class Singleton(TimeStamped):
    """Site-wide configuration that must have exactly one row."""

    class Meta:
        abstract = True

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        raise ValidationError(f"{type(self).__name__} is a singleton and cannot be deleted.")

    @classmethod
    def load(cls) -> Self:
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------


class SiteSettings(Singleton):
    """Site chrome, SEO defaults, and which sections render in what order."""

    class Locale(models.TextChoices):
        EN = "en", "English"
        DE = "de", "Deutsch"

    site_title = models.CharField(max_length=120, default="Portfolio")
    meta_description = models.TextField(
        max_length=320, blank=True, help_text="Shown in search results and link previews."
    )
    og_image = models.ImageField(upload_to="site/", blank=True, null=True)
    primary_color = models.CharField(max_length=9, default="#1E4FD8")
    accent_color = models.CharField(max_length=9, default="#0EA5A4")
    default_locale = models.CharField(max_length=2, choices=Locale.choices, default=Locale.EN)
    analytics_id = models.CharField(
        max_length=80, blank=True, help_text="Plausible domain or GA4 measurement id."
    )
    sections = models.JSONField(
        default=default_sections,
        help_text="Ordered list of {key, enabled, label}. Controls the whole page layout.",
    )
    show_photo = models.BooleanField(default=True)
    show_personal_details = models.BooleanField(
        default=False, help_text="German CV convention: DOB, nationality, marital status."
    )
    show_references = models.BooleanField(default=False)
    show_hobbies = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self) -> str:
        return self.site_title

    def clean(self) -> None:
        if not isinstance(self.sections, list):
            raise ValidationError({"sections": "Must be a list of section objects."})
        valid = set(SectionKey.values)
        seen: set[str] = set()
        for index, item in enumerate(self.sections):
            if not isinstance(item, dict) or "key" not in item:
                raise ValidationError({"sections": f"Entry {index} needs a 'key'."})
            key = item["key"]
            if key not in valid:
                raise ValidationError({"sections": f"Unknown section key {key!r}."})
            if key in seen:
                raise ValidationError({"sections": f"Duplicate section key {key!r}."})
            seen.add(key)

    def enabled_section_keys(self) -> list[str]:
        return [
            item["key"]
            for item in self.sections
            if isinstance(item, dict) and item.get("enabled", True)
        ]


class Profile(Singleton):
    """Who I am. The personal-details block is gated behind a SiteSettings flag."""

    full_name = models.CharField(max_length=160, default="Your Name")
    headline = models.CharField(
        max_length=180, blank=True, help_text="One line under your name, e.g. job title."
    )
    tagline = models.CharField(max_length=240, blank=True)
    summary_short = models.TextField(blank=True, help_text="Markdown. Shown in the hero.")
    summary_long = models.TextField(blank=True, help_text="Markdown. Shown on the About page.")
    photo = models.ImageField(upload_to="profile/", blank=True, null=True)

    # German-CV personal details — every one optional and individually nullable.
    date_of_birth = models.DateField(blank=True, null=True)
    place_of_birth = models.CharField(max_length=120, blank=True)
    nationality = models.CharField(max_length=120, blank=True)
    marital_status = models.CharField(max_length=60, blank=True)

    current_city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    willing_to_relocate = models.BooleanField(default=False)
    work_authorisation = models.CharField(
        max_length=240, blank=True, help_text="e.g. 'EU Blue Card holder', 'requires sponsorship'."
    )

    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    availability = models.CharField(
        max_length=160, blank=True, help_text="e.g. 'Open to roles from March 2026'."
    )
    years_experience = models.PositiveSmallIntegerField(blank=True, null=True)

    resume_pdf_en = models.FileField(upload_to="resume/", blank=True, null=True)
    resume_pdf_de = models.FileField(upload_to="resume/", blank=True, null=True)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self) -> str:
        return self.full_name


# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------


class SocialLink(Orderable):
    platform = models.CharField(max_length=60, help_text="GitHub, LinkedIn, …")
    url = models.URLField(max_length=500)
    icon = models.CharField(
        max_length=60, blank=True, help_text="Icon key the frontend maps to an SVG."
    )

    def __str__(self) -> str:
        return self.platform


class SkillCategory(Orderable):
    name = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=60, blank=True)

    class Meta(Orderable.Meta):
        verbose_name_plural = "Skill categories"

    def __str__(self) -> str:
        return self.name


class Skill(Orderable):
    name = models.CharField(max_length=80)
    category = models.ForeignKey(
        SkillCategory, on_delete=models.CASCADE, related_name="skills", blank=True, null=True
    )
    proficiency = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1–5. Drives the proficiency bars.",
    )
    years_experience = models.DecimalField(
        max_digits=4, decimal_places=1, blank=True, null=True
    )
    is_featured = models.BooleanField(default=False)
    icon = models.CharField(max_length=60, blank=True)

    class Meta(Orderable.Meta):
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.UniqueConstraint(fields=["name", "category"], name="unique_skill_per_category")
        ]

    def __str__(self) -> str:
        return self.name


class Experience(Orderable):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"
        WORKING_STUDENT = "working_student", "Working student"

    company = models.CharField(max_length=160)
    company_logo = models.ImageField(upload_to="companies/", blank=True, null=True)
    company_url = models.URLField(max_length=500, blank=True)
    role = models.CharField(max_length=160)
    employment_type = models.CharField(
        max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME
    )
    location = models.CharField(max_length=160, blank=True)
    is_remote = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True, help_text="Markdown.")
    skills = models.ManyToManyField(Skill, related_name="experiences", blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-start_date"]
        verbose_name_plural = "Experience"

    def __str__(self) -> str:
        return f"{self.role} @ {self.company}"

    def clean(self) -> None:
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before the start date."})
        if self.is_current and self.end_date:
            raise ValidationError({"end_date": "A current role cannot have an end date."})


class ExperienceHighlight(models.Model):
    """One achievement bullet. A row per bullet so they reorder independently."""

    experience = models.ForeignKey(
        Experience, on_delete=models.CASCADE, related_name="highlights"
    )
    text = models.TextField()
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self) -> str:
        return self.text[:70]


class Education(Orderable):
    class GradeScale(models.TextChoices):
        CGPA_10 = "cgpa_10", "CGPA (out of 10)"
        PERCENTAGE = "percentage", "Percentage"
        GPA_4 = "gpa_4", "GPA (out of 4)"
        GERMAN_1_5 = "german_1_5", "German grade (1.0–5.0)"
        ECTS = "ects", "ECTS grade (A–F)"

    institution = models.CharField(max_length=200)
    logo = models.ImageField(upload_to="institutions/", blank=True, null=True)
    degree = models.CharField(max_length=200, help_text="e.g. M.Sc., B.Tech.")
    field_of_study = models.CharField(max_length=200, blank=True)
    grade_value = models.CharField(
        max_length=30, blank=True, help_text="The number or letter itself, e.g. '8.7' or '1.7'."
    )
    grade_scale = models.CharField(
        max_length=20, choices=GradeScale.choices, blank=True,
        help_text="Which scale the grade is on, so it renders correctly for the audience.",
    )
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    location = models.CharField(max_length=160, blank=True)
    thesis_title = models.CharField(max_length=300, blank=True)
    thesis_url = models.URLField(max_length=500, blank=True)
    coursework = models.JSONField(default=list, blank=True, help_text="List of course names.")
    description = models.TextField(blank=True, help_text="Markdown.")

    class Meta(Orderable.Meta):
        ordering = ["order", "-start_date"]
        verbose_name_plural = "Education"

    def __str__(self) -> str:
        return f"{self.degree} — {self.institution}"

    def clean(self) -> None:
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before the start date."})
        if self.grade_value and not self.grade_scale:
            raise ValidationError({"grade_scale": "Pick a scale so the grade is unambiguous."})


class Project(Orderable):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    summary = models.CharField(max_length=300, help_text="One line for the project card.")
    description = models.TextField(blank=True, help_text="Markdown.")
    case_study = models.TextField(blank=True, help_text="Markdown. The long write-up.")
    role = models.CharField(max_length=160, blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    cover_image = models.ImageField(upload_to="projects/", blank=True, null=True)
    skills = models.ManyToManyField(Skill, related_name="projects", blank=True)
    repo_url = models.URLField(max_length=500, blank=True)
    live_url = models.URLField(max_length=500, blank=True)
    is_featured = models.BooleanField(default=False)
    metrics = models.JSONField(
        default=dict, blank=True, help_text='Headline numbers, e.g. {"latency": "-40%"}.'
    )

    class Meta(Orderable.Meta):
        ordering = ["order", "-start_date", "-pk"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = self._unique_slug()
        super().save(*args, **kwargs)

    def _unique_slug(self) -> str:
        base = slugify(self.title)[:200] or "project"
        candidate, suffix = base, 2
        while Project.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base}-{suffix}"
            suffix += 1
        return candidate


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="projects/gallery/")
    caption = models.CharField(max_length=240, blank=True)
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self) -> str:
        return self.caption or f"Image {self.pk}"


class Certification(Orderable):
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200)
    issuer_logo = models.ImageField(upload_to="certifications/", blank=True, null=True)
    issue_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    credential_id = models.CharField(max_length=200, blank=True)
    credential_url = models.URLField(max_length=500, blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-issue_date"]

    def __str__(self) -> str:
        return self.name


class Publication(Orderable):
    title = models.CharField(max_length=300)
    authors = models.CharField(max_length=400, blank=True)
    venue = models.CharField(max_length=240, blank=True)
    date = models.DateField(blank=True, null=True)
    doi = models.CharField(max_length=120, blank=True)
    url = models.URLField(max_length=500, blank=True)
    abstract = models.TextField(blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-date"]

    def __str__(self) -> str:
        return self.title


class Award(Orderable):
    title = models.CharField(max_length=240)
    issuer = models.CharField(max_length=200, blank=True)
    date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-date"]

    def __str__(self) -> str:
        return self.title


class Language(Orderable):
    class Level(models.TextChoices):
        A1 = "A1", "A1 — Beginner"
        A2 = "A2", "A2 — Elementary"
        B1 = "B1", "B1 — Intermediate"
        B2 = "B2", "B2 — Upper intermediate"
        C1 = "C1", "C1 — Advanced"
        C2 = "C2", "C2 — Proficient"
        NATIVE = "native", "Native"

    name = models.CharField(max_length=80)
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.B2)
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.get_level_display()})"


class Reference(Orderable):
    """Contact details are never serialised unless is_public is explicitly True."""

    name = models.CharField(max_length=160)
    role = models.CharField(max_length=160, blank=True)
    company = models.CharField(max_length=160, blank=True)
    relationship = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    is_public = models.BooleanField(
        default=False,
        help_text="Off by default. Only tick this if this person agreed to public contact details.",
    )

    def __str__(self) -> str:
        return self.name


class Volunteering(Orderable):
    organisation = models.CharField(max_length=200)
    role = models.CharField(max_length=160, blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-start_date"]
        verbose_name_plural = "Volunteering"

    def __str__(self) -> str:
        return f"{self.role} @ {self.organisation}" if self.role else self.organisation


class Interest(Orderable):
    name = models.CharField(max_length=80)
    icon = models.CharField(max_length=60, blank=True)

    def __str__(self) -> str:
        return self.name


class Talk(Orderable):
    title = models.CharField(max_length=240)
    event = models.CharField(max_length=200, blank=True)
    date = models.DateField(blank=True, null=True)
    url = models.URLField(max_length=500, blank=True)
    slides_url = models.URLField(max_length=500, blank=True)

    class Meta(Orderable.Meta):
        ordering = ["order", "-date"]

    def __str__(self) -> str:
        return self.title


class ContactMessage(TimeStamped):
    """Written by the public contact form, read only in the admin."""

    name = models.CharField(max_length=160)
    email = models.EmailField()
    subject = models.CharField(max_length=240, blank=True)
    message = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=400, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"
