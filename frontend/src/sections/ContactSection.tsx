import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { ApiError, fieldErrors } from "@/api/client";
import { useSendMessage } from "@/api/hooks";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

import type { SectionProps } from "./types";

const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };

export function ContactSection({ data, id, title, eyebrow }: SectionProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const mutation = useSendMessage();
  const { profile, social_links: socialLinks } = data;

  const serverErrors = fieldErrors(mutation.error);
  const throttled = mutation.error instanceof ApiError && mutation.error.status === 429;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    mutation.mutate(form, { onSuccess: () => setForm(EMPTY) });
  }

  function update(field: keyof typeof EMPTY, value: string): void {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {profile.availability ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand/10 px-3.5 py-1.5 text-sm text-brand">
              <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
              {profile.availability}
            </p>
          ) : null}

          <dl className="space-y-2 text-sm">
            {profile.email ? (
              <div className="flex gap-2">
                <dt className="text-faint">Email</dt>
                <dd>
                  <a href={`mailto:${profile.email}`} className="text-brand hover:underline">
                    {profile.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {profile.current_city || profile.country ? (
              <div className="flex gap-2">
                <dt className="text-faint">Location</dt>
                <dd className="text-ink">
                  {[profile.current_city, profile.country].filter(Boolean).join(", ")}
                </dd>
              </div>
            ) : null}
          </dl>

          {socialLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-full border border-rule bg-surface px-4 py-1.5 text-sm text-muted transition-colors hover:border-brand hover:text-ink"
                  >
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="no-print space-y-4" noValidate>
          <Field
            id="contact-name"
            label={t("contact.name")}
            value={form.name}
            error={serverErrors["name"]}
            onChange={(value) => update("name", value)}
            required
          />
          <Field
            id="contact-email"
            label={t("contact.email")}
            type="email"
            value={form.email}
            error={serverErrors["email"]}
            onChange={(value) => update("email", value)}
            required
          />
          <Field
            id="contact-subject"
            label={t("contact.subject")}
            value={form.subject}
            error={serverErrors["subject"]}
            onChange={(value) => update("subject", value)}
          />
          <Field
            id="contact-message"
            label={t("contact.message")}
            value={form.message}
            error={serverErrors["message"]}
            onChange={(value) => update("message", value)}
            multiline
            required
          />

          {/* Honeypot: hidden from people and assistive tech, catnip for bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label htmlFor="contact-website">Leave this field empty</label>
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? t("contact.sending") : t("contact.send")}
          </button>

          <div aria-live="polite" className="min-h-6 text-sm">
            {mutation.isSuccess ? <p className="text-brand">{t("contact.sent")}</p> : null}
            {mutation.isError ? (
              <p className="text-red-600 dark:text-red-400">
                {throttled ? t("contact.throttled") : t("contact.error")}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </Section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string | undefined;
  multiline?: boolean;
  required?: boolean;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  multiline = false,
  required = false,
}: FieldProps) {
  const inputClass = cn(
    "w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink",
    "placeholder:text-faint focus:border-brand focus:outline-none",
    error ? "border-red-500" : "border-rule",
  );

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={5}
          value={value}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
