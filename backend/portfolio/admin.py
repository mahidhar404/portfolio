"""The content-entry interface. This is the primary way data gets into the site.

Conventions applied everywhere: drag-to-reorder on ordered models, thumbnail
previews on image fields, `is_published` editable straight from the list view,
and singletons that hide the add/delete buttons.
"""

from __future__ import annotations

from typing import Any, ClassVar

from adminsortable2.admin import SortableAdminBase, SortableAdminMixin, SortableTabularInline
from django.contrib import admin
from django.db.models import Model
from django.http import HttpRequest
from django.utils.html import format_html

from .models import (
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

admin.site.site_header = "Portfolio content"
admin.site.site_title = "Portfolio admin"
admin.site.index_title = "Everything on your site lives here"


def thumbnail(field_name: str, label: str = "Preview") -> Any:
    """Build a read-only admin field that renders an image field as a thumbnail."""

    @admin.display(description=label)
    def _thumb(_self: Any, obj: Model) -> str:
        image = getattr(obj, field_name, None)
        if not image:
            return "—"
        return format_html(
            '<img src="{}" style="height:44px;width:auto;border-radius:4px;'
            'border:1px solid rgba(0,0,0,.15)" />',
            image.url,
        )

    return _thumb


class SingletonAdmin(admin.ModelAdmin[Any]):
    """Exactly one row: no add button, no delete, and the changelist redirects to it."""

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: Model | None = None) -> bool:
        return False

    def changelist_view(self, request: HttpRequest, extra_context: Any = None) -> Any:
        from django.shortcuts import redirect
        from django.urls import reverse

        obj = self.model.load()
        meta = self.model._meta
        return redirect(reverse(f"admin:{meta.app_label}_{meta.model_name}_change", args=[obj.pk]))


@admin.register(SiteSettings)
class SiteSettingsAdmin(SingletonAdmin):
    fieldsets = (
        ("Identity", {"fields": ("site_title", "meta_description", "og_image", "og_preview")}),
        ("Appearance", {"fields": ("primary_color", "accent_color", "default_locale")}),
        (
            "Sections",
            {
                "fields": ("sections",),
                "description": (
                    "Ordered list of sections. Set <code>enabled</code> to false to hide one, "
                    "reorder the list to reorder the page. The frontend follows this exactly."
                ),
            },
        ),
        (
            "Visibility flags",
            {
                "fields": (
                    "show_photo",
                    "show_personal_details",
                    "show_references",
                    "show_hobbies",
                ),
                "description": (
                    "Personal details and references are German-CV conventions and are off "
                    "by default."
                ),
            },
        ),
        ("Analytics", {"fields": ("analytics_id",), "classes": ("collapse",)}),
    )
    readonly_fields = ("og_preview",)
    og_preview = thumbnail("og_image", "Current OG image")


@admin.register(Profile)
class ProfileAdmin(SingletonAdmin):
    fieldsets = (
        ("Name and pitch", {"fields": ("full_name", "headline", "tagline")}),
        ("Summary", {"fields": ("summary_short", "summary_long")}),
        ("Photo", {"fields": ("photo", "photo_preview")}),
        ("Contact", {"fields": ("email", "phone", "current_city", "country")}),
        (
            "Availability",
            {"fields": ("availability", "years_experience", "willing_to_relocate",
                        "work_authorisation")},
        ),
        (
            "Personal details (German CV)",
            {
                "fields": ("date_of_birth", "place_of_birth", "nationality", "marital_status"),
                "classes": ("collapse",),
                "description": (
                    "Only rendered when 'show personal details' is ticked in Site settings."
                ),
            },
        ),
        ("Resume files", {"fields": ("resume_pdf_en", "resume_pdf_de")}),
    )
    readonly_fields = ("photo_preview",)
    photo_preview = thumbnail("photo", "Current photo")


class ExperienceHighlightInline(SortableTabularInline):
    model = ExperienceHighlight
    extra = 3
    fields = ("text", "order")
    ordering = ("order",)


@admin.register(Experience)
class ExperienceAdmin(SortableAdminMixin, SortableAdminBase, admin.ModelAdmin[Experience]):
    list_display = ("role", "company", "employment_type", "start_date", "end_date",
                    "is_current", "is_published")
    list_filter = ("is_published", "is_current", "employment_type", "is_remote")
    list_editable = ("is_published",)
    search_fields = ("role", "company", "description", "location")
    filter_horizontal = ("skills",)
    inlines: ClassVar[list[Any]] = [ExperienceHighlightInline]
    date_hierarchy = "start_date"
    fieldsets = (
        ("Role", {"fields": ("role", "company", "company_url", "company_logo",
                             "employment_type")}),
        ("Where and when", {"fields": ("location", "is_remote", "start_date", "end_date",
                                       "is_current")}),
        ("Detail", {"fields": ("description", "skills")}),
        ("Visibility", {"fields": ("is_published",)}),
    )


class ProjectImageInline(SortableTabularInline):
    model = ProjectImage
    extra = 2
    fields = ("image", "caption", "order")
    ordering = ("order",)


@admin.register(Project)
class ProjectAdmin(SortableAdminMixin, SortableAdminBase, admin.ModelAdmin[Project]):
    list_display = ("title", "cover_preview", "role", "is_featured", "is_published")
    list_filter = ("is_published", "is_featured")
    list_editable = ("is_featured", "is_published")
    search_fields = ("title", "summary", "description", "case_study")
    prepopulated_fields: ClassVar[dict[str, Any]] = {"slug": ("title",)}
    filter_horizontal = ("skills",)
    inlines: ClassVar[list[Any]] = [ProjectImageInline]
    readonly_fields = ("cover_preview",)
    cover_preview = thumbnail("cover_image", "Cover")
    fieldsets = (
        ("Headline", {"fields": ("title", "slug", "summary", "is_featured")}),
        ("Story", {"fields": ("description", "case_study", "role", "metrics")}),
        ("Links", {"fields": ("repo_url", "live_url")}),
        ("Media", {"fields": ("cover_image", "cover_preview")}),
        ("When", {"fields": ("start_date", "end_date")}),
        ("Detail", {"fields": ("skills",)}),
        ("Visibility", {"fields": ("is_published",)}),
    )


@admin.register(Education)
class EducationAdmin(SortableAdminMixin, admin.ModelAdmin[Education]):
    list_display = ("degree", "institution", "grade_display", "start_date", "end_date",
                    "is_published")
    list_filter = ("is_published", "grade_scale", "is_current")
    list_editable = ("is_published",)
    search_fields = ("institution", "degree", "field_of_study", "thesis_title")

    @admin.display(description="Grade")
    def grade_display(self, obj: Education) -> str:
        if not obj.grade_value:
            return "—"
        return f"{obj.grade_value} ({obj.get_grade_scale_display()})"


@admin.register(SkillCategory)
class SkillCategoryAdmin(SortableAdminMixin, admin.ModelAdmin[SkillCategory]):
    list_display = ("name", "skill_count", "is_published")
    list_editable = ("is_published",)
    search_fields = ("name",)

    @admin.display(description="Skills")
    def skill_count(self, obj: SkillCategory) -> int:
        return obj.skills.count()


@admin.register(Skill)
class SkillAdmin(SortableAdminMixin, admin.ModelAdmin[Skill]):
    list_display = ("name", "category", "proficiency", "years_experience", "is_featured",
                    "is_published")
    list_filter = ("is_published", "is_featured", "category", "proficiency")
    list_editable = ("proficiency", "is_featured", "is_published")
    search_fields = ("name",)
    list_select_related = ("category",)
    autocomplete_fields = ("category",)


@admin.register(Certification)
class CertificationAdmin(SortableAdminMixin, admin.ModelAdmin[Certification]):
    list_display = ("name", "issuer", "issue_date", "expiry_date", "is_published")
    list_filter = ("is_published", "issuer")
    list_editable = ("is_published",)
    search_fields = ("name", "issuer", "credential_id")


@admin.register(Publication)
class PublicationAdmin(SortableAdminMixin, admin.ModelAdmin[Publication]):
    list_display = ("title", "venue", "date", "is_published")
    list_filter = ("is_published",)
    list_editable = ("is_published",)
    search_fields = ("title", "authors", "venue", "abstract", "doi")


@admin.register(Award)
class AwardAdmin(SortableAdminMixin, admin.ModelAdmin[Award]):
    list_display = ("title", "issuer", "date", "is_published")
    list_filter = ("is_published",)
    list_editable = ("is_published",)
    search_fields = ("title", "issuer", "description")


@admin.register(Language)
class LanguageAdmin(SortableAdminMixin, admin.ModelAdmin[Language]):
    list_display = ("name", "level", "notes", "is_published")
    list_filter = ("is_published", "level")
    list_editable = ("level", "is_published")
    search_fields = ("name",)


@admin.register(Reference)
class ReferenceAdmin(SortableAdminMixin, admin.ModelAdmin[Reference]):
    list_display = ("name", "role", "company", "is_public", "is_published")
    list_filter = ("is_published", "is_public")
    list_editable = ("is_public", "is_published")
    search_fields = ("name", "company", "role")
    fieldsets = (
        ("Person", {"fields": ("name", "role", "company", "relationship")}),
        (
            "Contact details",
            {
                "fields": ("email", "phone", "is_public"),
                "description": (
                    "<strong>Email and phone are never sent to the website unless "
                    "'is public' is ticked.</strong> Only tick it with their permission."
                ),
            },
        ),
        ("Visibility", {"fields": ("is_published",)}),
    )


@admin.register(Volunteering)
class VolunteeringAdmin(SortableAdminMixin, admin.ModelAdmin[Volunteering]):
    list_display = ("organisation", "role", "start_date", "end_date", "is_published")
    list_filter = ("is_published", "is_current")
    list_editable = ("is_published",)
    search_fields = ("organisation", "role", "description")


@admin.register(Talk)
class TalkAdmin(SortableAdminMixin, admin.ModelAdmin[Talk]):
    list_display = ("title", "event", "date", "is_published")
    list_filter = ("is_published",)
    list_editable = ("is_published",)
    search_fields = ("title", "event")


@admin.register(Interest)
class InterestAdmin(SortableAdminMixin, admin.ModelAdmin[Interest]):
    list_display = ("name", "icon", "is_published")
    list_editable = ("is_published",)
    search_fields = ("name",)


@admin.register(SocialLink)
class SocialLinkAdmin(SortableAdminMixin, admin.ModelAdmin[SocialLink]):
    list_display = ("platform", "url", "icon", "is_published")
    list_editable = ("is_published",)
    search_fields = ("platform", "url")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin[ContactMessage]):
    """Read-only: messages arrive from the public form, they are never authored here."""

    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_filter = ("is_read", "created_at")
    list_editable = ("is_read",)
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "ip_address", "user_agent",
                       "created_at", "updated_at")
    date_hierarchy = "created_at"

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False
