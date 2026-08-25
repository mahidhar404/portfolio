"""Read and write serializers.

Two rules hold throughout:

1. Field lists are always explicit — never ``fields = "__all__"`` — so adding a
   model field is a deliberate decision about what becomes public.
2. Read and write shapes are separate classes. Read serializers flatten and
   decorate; write serializers accept exactly what the admin/API can set.
"""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

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

# ---------------------------------------------------------------------------
# Leaf serializers
# ---------------------------------------------------------------------------


class SocialLinkSerializer(serializers.ModelSerializer[SocialLink]):
    class Meta:
        model = SocialLink
        fields = ["id", "platform", "url", "icon", "order"]


class SkillSerializer(serializers.ModelSerializer[Skill]):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "category",
            "category_name",
            "proficiency",
            "years_experience",
            "is_featured",
            "icon",
            "order",
        ]


class SkillCategorySerializer(serializers.ModelSerializer[SkillCategory]):
    skills = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ["id", "name", "icon", "order", "skills"]

    def get_skills(self, obj: SkillCategory) -> list[dict[str, Any]]:
        published = [skill for skill in obj.skills.all() if skill.is_published]
        return SkillSerializer(published, many=True, context=self.context).data


class ExperienceHighlightSerializer(serializers.ModelSerializer[ExperienceHighlight]):
    class Meta:
        model = ExperienceHighlight
        fields = ["id", "text", "order"]


class ExperienceSerializer(serializers.ModelSerializer[Experience]):
    highlights = ExperienceHighlightSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    employment_type_display = serializers.CharField(
        source="get_employment_type_display", read_only=True
    )

    class Meta:
        model = Experience
        fields = [
            "id",
            "company",
            "company_logo",
            "company_url",
            "role",
            "employment_type",
            "employment_type_display",
            "location",
            "is_remote",
            "start_date",
            "end_date",
            "is_current",
            "description",
            "highlights",
            "skills",
            "order",
        ]


class EducationSerializer(serializers.ModelSerializer[Education]):
    grade_scale_display = serializers.CharField(source="get_grade_scale_display", read_only=True)

    class Meta:
        model = Education
        fields = [
            "id",
            "institution",
            "logo",
            "degree",
            "field_of_study",
            "grade_value",
            "grade_scale",
            "grade_scale_display",
            "start_date",
            "end_date",
            "is_current",
            "location",
            "thesis_title",
            "thesis_url",
            "coursework",
            "description",
            "order",
        ]


class ProjectImageSerializer(serializers.ModelSerializer[ProjectImage]):
    class Meta:
        model = ProjectImage
        fields = ["id", "image", "caption", "order"]


class ProjectListSerializer(serializers.ModelSerializer[Project]):
    """The card shape — no case study, no gallery."""

    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "role",
            "start_date",
            "end_date",
            "cover_image",
            "skills",
            "repo_url",
            "live_url",
            "is_featured",
            "metrics",
            "order",
        ]


class ProjectDetailSerializer(ProjectListSerializer):
    """The full case-study shape used on /projects/{slug}."""

    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = [*ProjectListSerializer.Meta.fields, "description", "case_study", "images"]


class CertificationSerializer(serializers.ModelSerializer[Certification]):
    class Meta:
        model = Certification
        fields = [
            "id",
            "name",
            "issuer",
            "issuer_logo",
            "issue_date",
            "expiry_date",
            "credential_id",
            "credential_url",
            "order",
        ]


class PublicationSerializer(serializers.ModelSerializer[Publication]):
    class Meta:
        model = Publication
        fields = ["id", "title", "authors", "venue", "date", "doi", "url", "abstract", "order"]


class AwardSerializer(serializers.ModelSerializer[Award]):
    class Meta:
        model = Award
        fields = ["id", "title", "issuer", "date", "description", "order"]


class LanguageSerializer(serializers.ModelSerializer[Language]):
    level_display = serializers.CharField(source="get_level_display", read_only=True)

    class Meta:
        model = Language
        fields = ["id", "name", "level", "level_display", "notes", "order"]


class ReferenceSerializer(serializers.ModelSerializer[Reference]):
    """Contact details are withheld unless the reference is explicitly public.

    This is enforced here rather than in the view so that *every* code path that
    serialises a Reference — aggregate endpoint, list endpoint, detail endpoint —
    gets the same protection. See tests/test_privacy.py.
    """

    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = Reference
        fields = [
            "id",
            "name",
            "role",
            "company",
            "relationship",
            "email",
            "phone",
            "is_public",
            "order",
        ]

    def get_email(self, obj: Reference) -> str:
        return obj.email if obj.is_public else ""

    def get_phone(self, obj: Reference) -> str:
        return obj.phone if obj.is_public else ""


class VolunteeringSerializer(serializers.ModelSerializer[Volunteering]):
    class Meta:
        model = Volunteering
        fields = [
            "id",
            "organisation",
            "role",
            "start_date",
            "end_date",
            "is_current",
            "description",
            "order",
        ]


class InterestSerializer(serializers.ModelSerializer[Interest]):
    class Meta:
        model = Interest
        fields = ["id", "name", "icon", "order"]


class TalkSerializer(serializers.ModelSerializer[Talk]):
    class Meta:
        model = Talk
        fields = ["id", "title", "event", "date", "url", "slides_url", "order"]


# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------


class SectionConfigSerializer(serializers.Serializer[dict[str, Any]]):
    """One entry in SiteSettings.sections — what the frontend registry keys off."""

    key = serializers.CharField()
    enabled = serializers.BooleanField(default=True)
    label = serializers.CharField(allow_null=True, required=False)


class SiteSettingsSerializer(serializers.ModelSerializer[SiteSettings]):
    sections = SectionConfigSerializer(many=True, read_only=True)

    class Meta:
        model = SiteSettings
        fields = [
            "site_title",
            "meta_description",
            "og_image",
            "primary_color",
            "accent_color",
            "default_locale",
            "analytics_id",
            "sections",
            "show_photo",
            "show_personal_details",
            "show_references",
            "show_hobbies",
        ]


class ProfileSerializer(serializers.ModelSerializer[Profile]):
    """Personal details are stripped unless SiteSettings.show_personal_details is on.

    The context carries the SiteSettings instance so this does not re-query.
    """

    class Meta:
        model = Profile
        fields = [
            "full_name",
            "headline",
            "tagline",
            "summary_short",
            "summary_long",
            "photo",
            "date_of_birth",
            "place_of_birth",
            "nationality",
            "marital_status",
            "current_city",
            "country",
            "willing_to_relocate",
            "work_authorisation",
            "email",
            "phone",
            "availability",
            "years_experience",
            "resume_pdf_en",
            "resume_pdf_de",
        ]

    PERSONAL_DETAIL_FIELDS = ("date_of_birth", "place_of_birth", "nationality", "marital_status")

    def to_representation(self, instance: Profile) -> dict[str, Any]:
        data = super().to_representation(instance)
        site_settings: SiteSettings | None = self.context.get("site_settings")
        if site_settings is not None:
            if not site_settings.show_personal_details:
                for field in self.PERSONAL_DETAIL_FIELDS:
                    data[field] = None
            if not site_settings.show_photo:
                data["photo"] = None
        return data


# ---------------------------------------------------------------------------
# The aggregate payload
# ---------------------------------------------------------------------------


class PortfolioSerializer(serializers.Serializer[dict[str, Any]]):
    """The whole site in one response. Declared explicitly so the OpenAPI schema
    (and therefore the generated TypeScript) describes it accurately."""

    settings = SiteSettingsSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)
    section_order = serializers.ListField(child=serializers.CharField(), read_only=True)
    social_links = SocialLinkSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    education = EducationSerializer(many=True, read_only=True)
    skill_categories = SkillCategorySerializer(many=True, read_only=True)
    projects = ProjectListSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    publications = PublicationSerializer(many=True, read_only=True)
    awards = AwardSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    volunteering = VolunteeringSerializer(many=True, read_only=True)
    interests = InterestSerializer(many=True, read_only=True)
    talks = TalkSerializer(many=True, read_only=True)
    references = ReferenceSerializer(many=True, read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class ContactMessageSerializer(serializers.ModelSerializer[ContactMessage]):
    """Public write-only endpoint. ``website`` is a honeypot: real browsers leave
    it empty, bots fill everything in."""

    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message", "website"]

    def validate_website(self, value: str) -> str:
        if value:
            raise serializers.ValidationError("Rejected.")
        return value

    def validate_message(self, value: str) -> str:
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Please write at least 10 characters.")
        return value

    def create(self, validated_data: dict[str, Any]) -> ContactMessage:
        validated_data.pop("website", None)
        request = self.context.get("request")
        if request is not None:
            validated_data["ip_address"] = _client_ip(request)
            validated_data["user_agent"] = request.META.get("HTTP_USER_AGENT", "")[:400]
        return ContactMessage.objects.create(**validated_data)


def _client_ip(request: Any) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    ip: str | None = request.META.get("REMOTE_ADDR")
    return ip


def _writable(model: type[Any], name: str) -> type[serializers.ModelSerializer[Any]]:
    """Build an admin-only write serializer exposing every editable model field."""
    exclude_fields = {"id", "created_at", "updated_at"}
    field_names = [
        field.name
        for field in model._meta.get_fields()
        if getattr(field, "editable", False) and field.name not in exclude_fields
    ]
    meta = type("Meta", (), {"model": model, "fields": field_names})
    return type(name, (serializers.ModelSerializer,), {"Meta": meta})


SocialLinkWriteSerializer = _writable(SocialLink, "SocialLinkWriteSerializer")
SkillCategoryWriteSerializer = _writable(SkillCategory, "SkillCategoryWriteSerializer")
SkillWriteSerializer = _writable(Skill, "SkillWriteSerializer")
ExperienceWriteSerializer = _writable(Experience, "ExperienceWriteSerializer")
EducationWriteSerializer = _writable(Education, "EducationWriteSerializer")
ProjectWriteSerializer = _writable(Project, "ProjectWriteSerializer")
CertificationWriteSerializer = _writable(Certification, "CertificationWriteSerializer")
PublicationWriteSerializer = _writable(Publication, "PublicationWriteSerializer")
AwardWriteSerializer = _writable(Award, "AwardWriteSerializer")
LanguageWriteSerializer = _writable(Language, "LanguageWriteSerializer")
ReferenceWriteSerializer = _writable(Reference, "ReferenceWriteSerializer")
VolunteeringWriteSerializer = _writable(Volunteering, "VolunteeringWriteSerializer")
InterestWriteSerializer = _writable(Interest, "InterestWriteSerializer")
TalkWriteSerializer = _writable(Talk, "TalkWriteSerializer")
SiteSettingsWriteSerializer = _writable(SiteSettings, "SiteSettingsWriteSerializer")
ProfileWriteSerializer = _writable(Profile, "ProfileWriteSerializer")
