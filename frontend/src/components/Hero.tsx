import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { Portfolio } from "@/api/types";
import { Image } from "@/components/ui/Image";
import { initials, mediaUrl } from "@/lib/format";

export function Hero({ data }: { data: Portfolio }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { profile, settings, social_links: socialLinks } = data;
  const resume = profile.resume_pdf_en ?? profile.resume_pdf_de;

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay },
        };

  return (
    <section className="border-b border-rule py-16 md:py-24" aria-label="Introduction">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          {profile.availability ? (
            <motion.p
              {...rise(0)}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand bg-brand/10 px-3.5 py-1.5 text-xs text-brand"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
              {profile.availability}
            </motion.p>
          ) : null}

          <motion.h1
            {...rise(0.05)}
            className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl"
          >
            {profile.full_name}
          </motion.h1>

          {profile.headline ? (
            <motion.p {...rise(0.12)} className="mt-4 text-lg text-muted md:text-xl">
              {profile.headline}
            </motion.p>
          ) : null}

          {profile.tagline ? (
            <motion.p {...rise(0.18)} className="mt-3 max-w-[58ch] text-muted">
              {profile.tagline}
            </motion.p>
          ) : null}

          <motion.div {...rise(0.24)} className="mt-7 flex flex-wrap items-center gap-3">
            {resume ? (
              <a
                href={mediaUrl(resume)}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("common.downloadResume")}
              </a>
            ) : null}
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-md border border-rule bg-surface px-4 py-2.5 text-sm text-muted transition-colors hover:border-brand hover:text-ink"
              >
                {link.platform}
              </a>
            ))}
          </motion.div>
        </div>

        {settings.show_photo && profile.photo ? (
          <motion.div {...rise(0.1)}>
            <Image
              src={profile.photo}
              alt={profile.full_name}
              width={280}
              height={340}
              eager
              fallback={initials(profile.full_name)}
              className="w-44 rounded-xl border border-rule shadow-[var(--shadow-lift)] md:w-64"
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
