"""API views.

The aggregate endpoint is the important one: `/api/v1/portfolio/` returns the
entire published site in a single response so the frontend paints from one round
trip. Everything else exists for detail pages, for writing content, and for ops.
"""

from __future__ import annotations

import hashlib
from typing import Any

from django.conf import settings as django_settings
from django.db import connection
from django.db.models import Max, Model, Prefetch, QuerySet
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Award,
    Certification,
    Education,
    Experience,
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
from .serializers import (
    AwardSerializer,
    AwardWriteSerializer,
    CertificationSerializer,
    CertificationWriteSerializer,
    ContactMessageSerializer,
    EducationSerializer,
    EducationWriteSerializer,
    ExperienceSerializer,
    ExperienceWriteSerializer,
    InterestSerializer,
    InterestWriteSerializer,
    LanguageSerializer,
    LanguageWriteSerializer,
    PortfolioSerializer,
    ProfileSerializer,
    ProfileWriteSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
    PublicationSerializer,
    PublicationWriteSerializer,
    ReferenceSerializer,
    ReferenceWriteSerializer,
    SiteSettingsSerializer,
    SiteSettingsWriteSerializer,
    SkillCategorySerializer,
    SkillCategoryWriteSerializer,
    SkillSerializer,
    SkillWriteSerializer,
    SocialLinkSerializer,
    SocialLinkWriteSerializer,
    TalkSerializer,
    TalkWriteSerializer,
    VolunteeringSerializer,
    VolunteeringWriteSerializer,
)

# Every model whose updated_at contributes to the content ETag.
VERSIONED_MODELS: tuple[type[Model], ...] = (
    SiteSettings,
    Profile,
    SocialLink,
    Experience,
    Education,
    SkillCategory,
    Skill,
    Project,
    Certification,
    Publication,
    Award,
    Language,
    Volunteering,
    Interest,
    Talk,
    Reference,
)


def content_version() -> str:
    """Latest ``updated_at`` across all content, in a single query.

    Used as the ETag: any admin edit anywhere changes it, and nothing else does.
    Written as raw SQL because ``QuerySet.union()`` cannot slice its operands on
    SQLite. Table names come from Django's model metadata, never from input.
    """
    selects = " UNION ALL ".join(
        f'SELECT MAX(updated_at) AS ts FROM "{model._meta.db_table}"'
        for model in VERSIONED_MODELS
    )
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT MAX(ts) FROM ({selects}) AS versions")  # noqa: S608
        row = cursor.fetchone()
    latest = row[0] if row else None
    if latest is None:
        return "empty"
    return hashlib.sha1(str(latest).encode()).hexdigest()[:16]  # noqa: S324


class PublicReadMixin:
    """Read is public and cacheable; write requires a staff token."""

    def get_permissions(self) -> list[Any]:
        if self.request.method in ("GET", "HEAD", "OPTIONS"):  # type: ignore[attr-defined]
            return []
        return [IsAdminUser()]

    def finalize_response(self, request: Request, response: Any, *args: Any, **kwargs: Any) -> Any:
        response = super().finalize_response(request, response, *args, **kwargs)  # type: ignore[misc]
        if request.method in ("GET", "HEAD") and response.status_code == 200:
            response["Cache-Control"] = django_settings.PORTFOLIO_CACHE_CONTROL
        return response


# ---------------------------------------------------------------------------
# The aggregate endpoint
# ---------------------------------------------------------------------------


class PortfolioView(APIView):
    """The whole published site in one request."""

    permission_classes: list[Any] = []

    @extend_schema(
        operation_id="portfolio_retrieve",
        responses={200: PortfolioSerializer, 304: OpenApiResponse(description="Not modified")},
        description=(
            "The entire published portfolio in a single response: settings, profile, "
            "and every enabled section in the order configured in the admin. Send "
            "If-None-Match with a previously returned ETag to get a 304."
        ),
    )
    def get(self, request: Request) -> Response:
        etag = f'W/"{content_version()}"'
        if request.headers.get("If-None-Match") == etag:
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
            response["ETag"] = etag
            response["Cache-Control"] = django_settings.PORTFOLIO_CACHE_CONTROL
            return response

        payload = build_portfolio_payload()
        context = {"request": request, **payload.pop("_context")}
        response = Response(PortfolioSerializer(payload, context=context).data)
        response["ETag"] = etag
        response["Cache-Control"] = django_settings.PORTFOLIO_CACHE_CONTROL
        return response


def build_portfolio_payload() -> dict[str, Any]:
    """Assemble the aggregate payload with a bounded number of queries.

    Every relation the serializers touch is prefetched here; the query count is
    asserted in tests/test_portfolio_endpoint.py so an accidental N+1 fails CI.
    """
    site_settings = SiteSettings.load()
    profile = Profile.load()
    published_skills = Skill.objects.filter(is_published=True).select_related("category")

    return {
        "settings": site_settings,
        "profile": profile,
        "section_order": site_settings.enabled_section_keys(),
        "social_links": SocialLink.objects.filter(is_published=True),
        "experience": (
            Experience.objects.filter(is_published=True)
            .prefetch_related("highlights", Prefetch("skills", queryset=published_skills))
        ),
        "education": Education.objects.filter(is_published=True),
        "skill_categories": (
            SkillCategory.objects.filter(is_published=True).prefetch_related(
                Prefetch("skills", queryset=published_skills)
            )
        ),
        "projects": (
            Project.objects.filter(is_published=True).prefetch_related(
                Prefetch("skills", queryset=published_skills)
            )
        ),
        "certifications": Certification.objects.filter(is_published=True),
        "publications": Publication.objects.filter(is_published=True),
        "awards": Award.objects.filter(is_published=True),
        "languages": Language.objects.filter(is_published=True),
        "volunteering": Volunteering.objects.filter(is_published=True),
        "interests": Interest.objects.filter(is_published=True),
        "talks": Talk.objects.filter(is_published=True),
        "references": (
            Reference.objects.filter(is_published=True)
            if site_settings.show_references
            else Reference.objects.none()
        ),
        "generated_at": timezone.now(),
        "_context": {"site_settings": site_settings},
    }


# ---------------------------------------------------------------------------
# Granular endpoints
# ---------------------------------------------------------------------------


class ContentViewSet(PublicReadMixin, viewsets.ModelViewSet[Any]):
    """Base for the per-model endpoints: public read, staff-only write."""

    read_serializer_class: type[Any]
    write_serializer_class: type[Any]

    def get_serializer_class(self) -> type[Any]:
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return self.read_serializer_class
        return self.write_serializer_class

    def get_queryset(self) -> QuerySet[Any]:
        queryset: QuerySet[Any] = super().get_queryset()
        if self.request.method in ("GET", "HEAD") and not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        return queryset


class ExperienceViewSet(ContentViewSet):
    queryset = Experience.objects.prefetch_related("highlights", "skills__category")
    read_serializer_class = ExperienceSerializer
    write_serializer_class = ExperienceWriteSerializer
    filterset_fields = ["employment_type", "is_current", "is_remote"]
    search_fields = ["role", "company", "description", "location"]
    ordering_fields = ["start_date", "end_date", "order"]


class EducationViewSet(ContentViewSet):
    queryset = Education.objects.all()
    read_serializer_class = EducationSerializer
    write_serializer_class = EducationWriteSerializer
    filterset_fields = ["grade_scale", "is_current"]
    search_fields = ["institution", "degree", "field_of_study", "thesis_title"]


class ProjectViewSet(ContentViewSet):
    queryset = Project.objects.prefetch_related("skills__category", "images")
    read_serializer_class = ProjectListSerializer
    write_serializer_class = ProjectWriteSerializer
    lookup_field = "slug"
    filterset_fields = ["is_featured"]
    search_fields = ["title", "summary", "description", "case_study"]
    ordering_fields = ["start_date", "title", "order"]

    def get_serializer_class(self) -> type[Any]:
        if self.action == "retrieve" and self.request.method == "GET":
            return ProjectDetailSerializer
        return super().get_serializer_class()


class SkillViewSet(ContentViewSet):
    queryset = Skill.objects.select_related("category")
    read_serializer_class = SkillSerializer
    write_serializer_class = SkillWriteSerializer
    filterset_fields = ["category", "is_featured", "proficiency"]
    search_fields = ["name"]
    ordering_fields = ["name", "proficiency", "order"]


class SkillCategoryViewSet(ContentViewSet):
    queryset = SkillCategory.objects.prefetch_related("skills")
    read_serializer_class = SkillCategorySerializer
    write_serializer_class = SkillCategoryWriteSerializer
    search_fields = ["name"]


class CertificationViewSet(ContentViewSet):
    queryset = Certification.objects.all()
    read_serializer_class = CertificationSerializer
    write_serializer_class = CertificationWriteSerializer
    search_fields = ["name", "issuer"]


class PublicationViewSet(ContentViewSet):
    queryset = Publication.objects.all()
    read_serializer_class = PublicationSerializer
    write_serializer_class = PublicationWriteSerializer
    search_fields = ["title", "authors", "venue"]


class AwardViewSet(ContentViewSet):
    queryset = Award.objects.all()
    read_serializer_class = AwardSerializer
    write_serializer_class = AwardWriteSerializer
    search_fields = ["title", "issuer"]


class LanguageViewSet(ContentViewSet):
    queryset = Language.objects.all()
    read_serializer_class = LanguageSerializer
    write_serializer_class = LanguageWriteSerializer
    filterset_fields = ["level"]


class VolunteeringViewSet(ContentViewSet):
    queryset = Volunteering.objects.all()
    read_serializer_class = VolunteeringSerializer
    write_serializer_class = VolunteeringWriteSerializer
    search_fields = ["organisation", "role"]


class InterestViewSet(ContentViewSet):
    queryset = Interest.objects.all()
    read_serializer_class = InterestSerializer
    write_serializer_class = InterestWriteSerializer


class TalkViewSet(ContentViewSet):
    queryset = Talk.objects.all()
    read_serializer_class = TalkSerializer
    write_serializer_class = TalkWriteSerializer
    search_fields = ["title", "event"]


class SocialLinkViewSet(ContentViewSet):
    queryset = SocialLink.objects.all()
    read_serializer_class = SocialLinkSerializer
    write_serializer_class = SocialLinkWriteSerializer


class ReferenceViewSet(ContentViewSet):
    """Contact details are masked by the serializer, not here — see ReferenceSerializer."""

    queryset = Reference.objects.all()
    read_serializer_class = ReferenceSerializer
    write_serializer_class = ReferenceWriteSerializer


# ---------------------------------------------------------------------------
# Singleton endpoints
# ---------------------------------------------------------------------------


class SingletonView(PublicReadMixin, APIView):
    model: type[Any]
    read_serializer_class: type[Any]
    write_serializer_class: type[Any]

    def get(self, request: Request) -> Response:
        instance = self.model.load()
        context: dict[str, Any] = {"request": request}
        if self.model is Profile:
            context["site_settings"] = SiteSettings.load()
        return Response(self.read_serializer_class(instance, context=context).data)

    def put(self, request: Request) -> Response:
        instance = self.model.load()
        serializer = self.write_serializer_class(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request: Request) -> Response:
        instance = self.model.load()
        serializer = self.write_serializer_class(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema(tags=["site-settings"])
class SiteSettingsView(SingletonView):
    model = SiteSettings
    read_serializer_class = SiteSettingsSerializer
    write_serializer_class = SiteSettingsWriteSerializer

    @extend_schema(responses=SiteSettingsSerializer)
    def get(self, request: Request) -> Response:
        return super().get(request)

    @extend_schema(request=SiteSettingsWriteSerializer, responses=SiteSettingsWriteSerializer)
    def put(self, request: Request) -> Response:
        return super().put(request)

    @extend_schema(request=SiteSettingsWriteSerializer, responses=SiteSettingsWriteSerializer)
    def patch(self, request: Request) -> Response:
        return super().patch(request)


@extend_schema(tags=["profile"])
class ProfileView(SingletonView):
    model = Profile
    read_serializer_class = ProfileSerializer
    write_serializer_class = ProfileWriteSerializer

    @extend_schema(responses=ProfileSerializer)
    def get(self, request: Request) -> Response:
        return super().get(request)

    @extend_schema(request=ProfileWriteSerializer, responses=ProfileWriteSerializer)
    def put(self, request: Request) -> Response:
        return super().put(request)

    @extend_schema(request=ProfileWriteSerializer, responses=ProfileWriteSerializer)
    def patch(self, request: Request) -> Response:
        return super().patch(request)


# ---------------------------------------------------------------------------
# Contact + health
# ---------------------------------------------------------------------------


class ContactView(mixins.CreateModelMixin, viewsets.GenericViewSet[Any]):
    """Public, throttled, honeypot-protected. Messages are readable only in the admin."""

    serializer_class = ContactMessageSerializer
    throttle_scope = "contact"
    permission_classes: list[Any] = []

    @extend_schema(
        request=ContactMessageSerializer,
        responses={201: OpenApiResponse(description="Message received")},
        description="Send a message from the site's contact form. Rate limited to 5/hour per IP.",
    )
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Message received."}, status=status.HTTP_201_CREATED)


class HealthView(APIView):
    """Liveness probe for Render, and the target of the keep-warm cron job."""

    permission_classes: list[Any] = []

    @extend_schema(
        responses={200: OpenApiResponse(description="Service healthy")},
        description="Liveness check. Also used by the keep-warm cron to prevent cold starts.",
    )
    def get(self, request: Request) -> Response:
        latest = Project.objects.aggregate(latest=Max("updated_at"))["latest"]
        return Response(
            {
                "status": "ok",
                "content_version": content_version(),
                "last_content_update": latest,
            }
        )
