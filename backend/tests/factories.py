"""factory_boy factories. Kept minimal — each test builds only what it asserts on.

factory_boy ships ``py.typed`` but leaves ``FactoryMetaClass.__call__`` unannotated,
so under mypy strict ``ProjectFactory()`` appears to return the factory class rather
than a Project. ``TypedFactory`` is a thin facade that restores the real return type,
so tests can stay fully type-checked without a single ``type: ignore``.
"""

from __future__ import annotations

import datetime as dt
from typing import Any, cast

import factory

from portfolio.models import (
    Certification,
    Education,
    Experience,
    ExperienceHighlight,
    Language,
    Project,
    Reference,
    Skill,
    SkillCategory,
)


class TypedFactory[T]:
    """Calling a factory returns a model instance — say so, in the type system."""

    def __init__(self, factory_class: type[factory.base.Factory[Any]]) -> None:
        self._factory = factory_class

    def __call__(self, **kwargs: Any) -> T:
        return cast("T", self._factory(**kwargs))

    def create(self, **kwargs: Any) -> T:
        return cast("T", self._factory.create(**kwargs))

    def build(self, **kwargs: Any) -> T:
        return cast("T", self._factory.build(**kwargs))

    def create_batch(self, size: int, **kwargs: Any) -> list[T]:
        return cast("list[T]", self._factory.create_batch(size, **kwargs))

class _SkillCategoryFactory(factory.django.DjangoModelFactory[SkillCategory]):
    class Meta:
        model = SkillCategory

    name = factory.Sequence(lambda n: f"Category {n}")


class _SkillFactory(factory.django.DjangoModelFactory[Skill]):
    class Meta:
        model = Skill

    name = factory.Sequence(lambda n: f"Skill {n}")
    category = factory.SubFactory(_SkillCategoryFactory)
    proficiency = 4


class _ExperienceFactory(factory.django.DjangoModelFactory[Experience]):
    class Meta:
        model = Experience

    company = factory.Sequence(lambda n: f"Company {n}")
    role = factory.Sequence(lambda n: f"Role {n}")
    start_date = dt.date(2020, 1, 1)


class _ExperienceHighlightFactory(factory.django.DjangoModelFactory[ExperienceHighlight]):
    class Meta:
        model = ExperienceHighlight

    experience = factory.SubFactory(_ExperienceFactory)
    text = factory.Sequence(lambda n: f"Shipped thing number {n}")


class _ProjectFactory(factory.django.DjangoModelFactory[Project]):
    class Meta:
        model = Project

    title = factory.Sequence(lambda n: f"Project {n}")
    summary = "A summary."


class _EducationFactory(factory.django.DjangoModelFactory[Education]):
    class Meta:
        model = Education

    institution = factory.Sequence(lambda n: f"University {n}")
    degree = "M.Sc."
    start_date = dt.date(2015, 10, 1)


class _CertificationFactory(factory.django.DjangoModelFactory[Certification]):
    class Meta:
        model = Certification

    name = factory.Sequence(lambda n: f"Certification {n}")
    issuer = "Issuer"


class _LanguageFactory(factory.django.DjangoModelFactory[Language]):
    class Meta:
        model = Language

    name = factory.Sequence(lambda n: f"Language {n}")
    level = Language.Level.B2


class _ReferenceFactory(factory.django.DjangoModelFactory[Reference]):
    class Meta:
        model = Reference

    name = factory.Sequence(lambda n: f"Referee {n}")
    email = factory.Sequence(lambda n: f"referee{n}@example.com")
    phone = "+49 30 000000"
    is_public = False


# Typed facades — these are what the tests import.
SkillCategoryFactory = TypedFactory[SkillCategory](_SkillCategoryFactory)
SkillFactory = TypedFactory[Skill](_SkillFactory)
ExperienceFactory = TypedFactory[Experience](_ExperienceFactory)
ExperienceHighlightFactory = TypedFactory[ExperienceHighlight](_ExperienceHighlightFactory)
ProjectFactory = TypedFactory[Project](_ProjectFactory)
EducationFactory = TypedFactory[Education](_EducationFactory)
CertificationFactory = TypedFactory[Certification](_CertificationFactory)
LanguageFactory = TypedFactory[Language](_LanguageFactory)
ReferenceFactory = TypedFactory[Reference](_ReferenceFactory)
