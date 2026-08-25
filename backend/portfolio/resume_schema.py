"""JSON Schema for the resume import document.

Kept in Python so it is importable by the management command and the tests, and
written out to docs/resume.schema.json by `manage.py export_resume_schema` so
editors and other tools can validate against it too.
"""

from __future__ import annotations

from typing import Any

DATE = {"type": ["string", "null"], "pattern": r"^\d{4}-\d{2}-\d{2}$"}
TEXT = {"type": "string"}
OPTIONAL_TEXT = {"type": "string", "default": ""}

RESUME_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://example.com/resume.schema.json",
    "title": "Portfolio resume import",
    "description": (
        "One document containing an entire resume. Import with "
        "`python manage.py import_resume path/to/resume.json`. Every top-level key "
        "is optional: keys you omit are left untouched in the database."
    ),
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "site_settings": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "site_title": TEXT,
                "meta_description": TEXT,
                "primary_color": TEXT,
                "accent_color": TEXT,
                "default_locale": {"enum": ["en", "de"]},
                "analytics_id": TEXT,
                "show_photo": {"type": "boolean"},
                "show_personal_details": {"type": "boolean"},
                "show_references": {"type": "boolean"},
                "show_hobbies": {"type": "boolean"},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["key"],
                        "properties": {
                            "key": TEXT,
                            "enabled": {"type": "boolean"},
                            "label": {"type": ["string", "null"]},
                        },
                    },
                },
            },
        },
        "profile": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "full_name": TEXT,
                "headline": TEXT,
                "tagline": TEXT,
                "summary_short": TEXT,
                "summary_long": TEXT,
                "date_of_birth": DATE,
                "place_of_birth": TEXT,
                "nationality": TEXT,
                "marital_status": TEXT,
                "current_city": TEXT,
                "country": TEXT,
                "willing_to_relocate": {"type": "boolean"},
                "work_authorisation": TEXT,
                "email": TEXT,
                "phone": TEXT,
                "availability": TEXT,
                "years_experience": {"type": ["integer", "null"], "minimum": 0},
            },
        },
        "social_links": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["platform", "url"],
                "additionalProperties": False,
                "properties": {"platform": TEXT, "url": TEXT, "icon": OPTIONAL_TEXT},
            },
        },
        "skill_categories": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name"],
                "additionalProperties": False,
                "properties": {
                    "name": TEXT,
                    "icon": OPTIONAL_TEXT,
                    "skills": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["name"],
                            "additionalProperties": False,
                            "properties": {
                                "name": TEXT,
                                "proficiency": {"type": "integer", "minimum": 1, "maximum": 5},
                                "years_experience": {"type": ["number", "null"]},
                                "is_featured": {"type": "boolean"},
                                "icon": OPTIONAL_TEXT,
                            },
                        },
                    },
                },
            },
        },
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["company", "role", "start_date"],
                "additionalProperties": False,
                "properties": {
                    "company": TEXT,
                    "company_url": OPTIONAL_TEXT,
                    "role": TEXT,
                    "employment_type": {
                        "enum": [
                            "full_time", "part_time", "contract",
                            "freelance", "internship", "working_student",
                        ]
                    },
                    "location": OPTIONAL_TEXT,
                    "is_remote": {"type": "boolean"},
                    "start_date": DATE,
                    "end_date": DATE,
                    "is_current": {"type": "boolean"},
                    "description": OPTIONAL_TEXT,
                    "highlights": {"type": "array", "items": TEXT},
                    "skills": {"type": "array", "items": TEXT},
                },
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["institution", "degree", "start_date"],
                "additionalProperties": False,
                "properties": {
                    "institution": TEXT,
                    "degree": TEXT,
                    "field_of_study": OPTIONAL_TEXT,
                    "grade_value": OPTIONAL_TEXT,
                    "grade_scale": {
                        "enum": ["", "cgpa_10", "percentage", "gpa_4", "german_1_5", "ects"]
                    },
                    "start_date": DATE,
                    "end_date": DATE,
                    "is_current": {"type": "boolean"},
                    "location": OPTIONAL_TEXT,
                    "thesis_title": OPTIONAL_TEXT,
                    "thesis_url": OPTIONAL_TEXT,
                    "coursework": {"type": "array", "items": TEXT},
                    "description": OPTIONAL_TEXT,
                },
            },
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["title", "summary"],
                "additionalProperties": False,
                "properties": {
                    "title": TEXT,
                    "slug": OPTIONAL_TEXT,
                    "summary": TEXT,
                    "description": OPTIONAL_TEXT,
                    "case_study": OPTIONAL_TEXT,
                    "role": OPTIONAL_TEXT,
                    "start_date": DATE,
                    "end_date": DATE,
                    "repo_url": OPTIONAL_TEXT,
                    "live_url": OPTIONAL_TEXT,
                    "is_featured": {"type": "boolean"},
                    "metrics": {"type": "object"},
                    "skills": {"type": "array", "items": TEXT},
                },
            },
        },
        "certifications": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "issuer"],
                "additionalProperties": False,
                "properties": {
                    "name": TEXT, "issuer": TEXT, "issue_date": DATE, "expiry_date": DATE,
                    "credential_id": OPTIONAL_TEXT, "credential_url": OPTIONAL_TEXT,
                },
            },
        },
        "publications": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["title"],
                "additionalProperties": False,
                "properties": {
                    "title": TEXT, "authors": OPTIONAL_TEXT, "venue": OPTIONAL_TEXT,
                    "date": DATE, "doi": OPTIONAL_TEXT, "url": OPTIONAL_TEXT,
                    "abstract": OPTIONAL_TEXT,
                },
            },
        },
        "awards": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["title"],
                "additionalProperties": False,
                "properties": {
                    "title": TEXT, "issuer": OPTIONAL_TEXT, "date": DATE,
                    "description": OPTIONAL_TEXT,
                },
            },
        },
        "languages": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "level"],
                "additionalProperties": False,
                "properties": {
                    "name": TEXT,
                    "level": {"enum": ["A1", "A2", "B1", "B2", "C1", "C2", "native"]},
                    "notes": OPTIONAL_TEXT,
                },
            },
        },
        "volunteering": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["organisation"],
                "additionalProperties": False,
                "properties": {
                    "organisation": TEXT, "role": OPTIONAL_TEXT, "start_date": DATE,
                    "end_date": DATE, "is_current": {"type": "boolean"},
                    "description": OPTIONAL_TEXT,
                },
            },
        },
        "talks": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["title"],
                "additionalProperties": False,
                "properties": {
                    "title": TEXT, "event": OPTIONAL_TEXT, "date": DATE,
                    "url": OPTIONAL_TEXT, "slides_url": OPTIONAL_TEXT,
                },
            },
        },
        "interests": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name"],
                "additionalProperties": False,
                "properties": {"name": TEXT, "icon": OPTIONAL_TEXT},
            },
        },
        "references": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name"],
                "additionalProperties": False,
                "properties": {
                    "name": TEXT, "role": OPTIONAL_TEXT, "company": OPTIONAL_TEXT,
                    "relationship": OPTIONAL_TEXT, "email": OPTIONAL_TEXT,
                    "phone": OPTIONAL_TEXT, "is_public": {"type": "boolean"},
                },
            },
        },
    },
}
