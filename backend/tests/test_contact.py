"""The contact form: validation, honeypot, throttling, and admin-only visibility."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from portfolio.models import ContactMessage

pytestmark = pytest.mark.django_db

VALID = {
    "name": "Recruiter",
    "email": "recruiter@example.com",
    "subject": "Role at ACME",
    "message": "We have a role that might interest you — are you open to a chat?",
}


@pytest.fixture(autouse=True)
def _clear_throttle_cache() -> Iterator[None]:
    """Throttle state lives in the cache; each test starts from a clean slate."""
    cache.clear()
    yield
    cache.clear()


class TestSubmission:
    def test_valid_message_is_accepted_and_stored(self, api: APIClient) -> None:
        response = api.post("/api/v1/contact/", VALID)
        assert response.status_code == 201
        message = ContactMessage.objects.get()
        assert message.email == "recruiter@example.com"
        assert message.is_read is False

    def test_client_metadata_is_recorded(self, api: APIClient) -> None:
        api.post("/api/v1/contact/", VALID, HTTP_USER_AGENT="Mozilla/5.0 Test")
        message = ContactMessage.objects.get()
        assert message.user_agent == "Mozilla/5.0 Test"
        assert message.ip_address is not None

    def test_invalid_email_is_rejected(self, api: APIClient) -> None:
        response = api.post("/api/v1/contact/", {**VALID, "email": "not-an-email"})
        assert response.status_code == 400
        assert ContactMessage.objects.count() == 0

    def test_short_message_is_rejected(self, api: APIClient) -> None:
        response = api.post("/api/v1/contact/", {**VALID, "message": "hi"})
        assert response.status_code == 400
        assert "10 characters" in str(response.json())

    def test_missing_name_is_rejected(self, api: APIClient) -> None:
        payload = {k: v for k, v in VALID.items() if k != "name"}
        assert api.post("/api/v1/contact/", payload).status_code == 400


class TestHoneypot:
    def test_filled_honeypot_is_rejected(self, api: APIClient) -> None:
        response = api.post("/api/v1/contact/", {**VALID, "website": "http://spam.example"})
        assert response.status_code == 400
        assert ContactMessage.objects.count() == 0

    def test_empty_honeypot_passes(self, api: APIClient) -> None:
        assert api.post("/api/v1/contact/", {**VALID, "website": ""}).status_code == 201


class TestThrottling:
    def test_sixth_message_in_an_hour_is_throttled(self, api: APIClient) -> None:
        for index in range(5):
            response = api.post("/api/v1/contact/", {**VALID, "subject": f"Message {index}"})
            assert response.status_code == 201, f"message {index} should have been accepted"

        blocked = api.post("/api/v1/contact/", {**VALID, "subject": "Sixth"})
        assert blocked.status_code == 429
        assert ContactMessage.objects.count() == 5

    def test_throttle_does_not_affect_reads(self, api: APIClient) -> None:
        for _ in range(6):
            api.post("/api/v1/contact/", VALID)
        assert api.get("/api/v1/portfolio/").status_code == 200


class TestVisibility:
    def test_messages_are_not_readable_over_the_api(self, api: APIClient) -> None:
        api.post("/api/v1/contact/", VALID)
        assert api.get("/api/v1/contact/").status_code in (404, 405)

    def test_messages_do_not_appear_in_the_aggregate_payload(self, api: APIClient) -> None:
        api.post("/api/v1/contact/", VALID)
        body = api.get("/api/v1/portfolio/").content.decode()
        assert "recruiter@example.com" not in body
