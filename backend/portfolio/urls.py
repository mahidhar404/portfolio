"""URL map. Everything content-related lives under /api/v1/."""

from __future__ import annotations

from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("projects", views.ProjectViewSet, basename="project")
router.register("experience", views.ExperienceViewSet, basename="experience")
router.register("education", views.EducationViewSet, basename="education")
router.register("skills", views.SkillViewSet, basename="skill")
router.register("skill-categories", views.SkillCategoryViewSet, basename="skillcategory")
router.register("certifications", views.CertificationViewSet, basename="certification")
router.register("publications", views.PublicationViewSet, basename="publication")
router.register("awards", views.AwardViewSet, basename="award")
router.register("languages", views.LanguageViewSet, basename="language")
router.register("volunteering", views.VolunteeringViewSet, basename="volunteering")
router.register("interests", views.InterestViewSet, basename="interest")
router.register("talks", views.TalkViewSet, basename="talk")
router.register("social-links", views.SocialLinkViewSet, basename="sociallink")
router.register("references", views.ReferenceViewSet, basename="reference")
router.register("contact", views.ContactView, basename="contact")

v1_patterns = [
    path("portfolio/", views.PortfolioView.as_view(), name="portfolio"),
    path("site-settings/", views.SiteSettingsView.as_view(), name="site-settings"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    *router.urls,
]

urlpatterns = [
    path("v1/", include((v1_patterns, "v1"))),
    path("health/", views.HealthView.as_view(), name="health"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
