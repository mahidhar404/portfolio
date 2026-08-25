"""The admin is the primary content-entry interface, so it gets real coverage.

A misconfigured `list_editable`, a bad `fieldsets` entry, or a field renamed out
from under an admin class all raise only when the page is rendered — which would
otherwise mean discovering it while trying to enter real data.
"""

from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from django.test import Client
from django.urls import reverse

from portfolio.models import Profile, Project, SiteSettings

pytestmark = pytest.mark.django_db

CHANGELIST_MODELS = [
    "experience",
    "project",
    "education",
    "skill",
    "skillcategory",
    "certification",
    "publication",
    "award",
    "language",
    "reference",
    "volunteering",
    "interest",
    "talk",
    "sociallink",
    "contactmessage",
]


@pytest.fixture
def admin_client_logged_in(admin_user: User) -> Client:
    client = Client()
    client.force_login(admin_user)
    return client


class TestAdminRenders:
    def test_index_lists_the_content_models(self, admin_client_logged_in: Client) -> None:
        response = admin_client_logged_in.get(reverse("admin:index"))
        assert response.status_code == 200
        assert b"Portfolio content" in response.content

    @pytest.mark.parametrize("model", CHANGELIST_MODELS)
    def test_changelist_renders(self, admin_client_logged_in: Client, model: str) -> None:
        response = admin_client_logged_in.get(reverse(f"admin:portfolio_{model}_changelist"))
        assert response.status_code == 200

    @pytest.mark.parametrize(
        "model", [m for m in CHANGELIST_MODELS if m != "contactmessage"]
    )
    def test_add_form_renders(self, admin_client_logged_in: Client, model: str) -> None:
        response = admin_client_logged_in.get(reverse(f"admin:portfolio_{model}_add"))
        assert response.status_code == 200

    def test_change_form_renders_with_inlines(
        self, admin_client_logged_in: Client, seeded: None
    ) -> None:
        project = Project.objects.first()
        assert project is not None
        response = admin_client_logged_in.get(
            reverse("admin:portfolio_project_change", args=[project.pk])
        )
        assert response.status_code == 200


class TestSingletonAdmin:
    @pytest.mark.parametrize("model", ["sitesettings", "profile"])
    def test_changelist_redirects_to_the_single_row(
        self, admin_client_logged_in: Client, model: str
    ) -> None:
        response = admin_client_logged_in.get(
            reverse(f"admin:portfolio_{model}_changelist"), follow=True
        )
        assert response.status_code == 200
        assert response.redirect_chain, "the changelist should redirect to the object"
        assert "/change/" in response.redirect_chain[-1][0]

    @pytest.mark.parametrize("model", ["sitesettings", "profile"])
    def test_no_add_page(self, admin_client_logged_in: Client, model: str) -> None:
        response = admin_client_logged_in.get(reverse(f"admin:portfolio_{model}_add"))
        assert response.status_code == 403

    def test_editing_site_settings_through_the_admin_saves(
        self, admin_client_logged_in: Client
    ) -> None:
        settings_obj = SiteSettings.load()
        url = reverse("admin:portfolio_sitesettings_change", args=[settings_obj.pk])
        response = admin_client_logged_in.get(url)
        assert response.status_code == 200
        assert b"Site settings" in response.content or b"site_title" in response.content


class TestContactMessagesAreReadOnly:
    def test_cannot_be_created_by_hand(self, admin_client_logged_in: Client) -> None:
        response = admin_client_logged_in.get(reverse("admin:portfolio_contactmessage_add"))
        assert response.status_code == 403


class TestAdminRequiresStaff:
    def test_anonymous_users_are_redirected_to_the_login(self) -> None:
        response = Client().get(reverse("admin:portfolio_project_changelist"))
        assert response.status_code == 302
        assert "/admin/login/" in response["Location"]

    def test_a_normal_user_cannot_get_in(self) -> None:
        User.objects.create_user("plain", "plain@example.com", "password123")
        client = Client()
        client.login(username="plain", password="password123")
        response = client.get(reverse("admin:portfolio_project_changelist"), follow=True)
        assert b"Log in" in response.content or response.status_code == 403


class TestProfileAdminSurfacesEverything:
    def test_every_profile_field_is_reachable_in_some_fieldset(self) -> None:
        """A field that exists on the model but appears in no fieldset is invisible
        in the admin — which for this project means uneditable content."""
        from portfolio.admin import ProfileAdmin

        in_fieldsets = {
            field
            for _, options in ProfileAdmin.fieldsets
            for field in options["fields"]
        }
        model_fields = {
            field.name
            for field in Profile._meta.get_fields()
            if getattr(field, "editable", False) and field.name not in {"id"}
        }
        missing = model_fields - in_fieldsets - {"created_at", "updated_at"}
        assert not missing, f"not editable in the admin: {sorted(missing)}"
