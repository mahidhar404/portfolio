"""Write the resume JSON Schema to disk so editors can validate against it."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from portfolio.resume_schema import RESUME_SCHEMA


class Command(BaseCommand):
    help = "Export the resume import JSON Schema to docs/resume.schema.json."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--output",
            default=str(Path(settings.BASE_DIR) / "docs" / "resume.schema.json"),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        path = Path(options["output"])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(RESUME_SCHEMA, indent=2) + "\n")
        self.stdout.write(self.style.SUCCESS(f"Wrote {path}"))
