import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { Portfolio } from "@/api/types";
import { cn } from "@/lib/cn";

interface Entry {
  id: string;
  label: string;
  group: string;
  run: () => void;
}

/**
 * ⌘K palette for jumping to a section or project.
 *
 * Implemented directly rather than pulled from a library: it needs exactly two
 * kinds of entry, and a dependency for that would cost more bundle than it saves.
 *
 * The dialog is a separate component that only mounts while open, so its query
 * and selection state reset naturally on each open — no effect, no manual reset.
 */
export function CommandPalette({ data }: { data: Portfolio }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const sections: Entry[] = data.section_order.map((key) => ({
      id: `section-${key}`,
      label: t(`sections.${key}`, { defaultValue: key }),
      group: t("palette.sections"),
      run: () => {
        void navigate("/");
        requestAnimationFrame(() => {
          document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      },
    }));
    const projects: Entry[] = data.projects.map((project) => ({
      id: `project-${project.slug}`,
      label: project.title,
      group: t("palette.projects"),
      run: () => void navigate(`/projects/${project.slug}`),
    }));
    return [...sections, ...projects];
  }, [data.section_order, data.projects, navigate, t]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="no-print hidden items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-brand hover:text-ink sm:inline-flex"
      >
        <span>{t("palette.open")}</span>
        <kbd className="rounded border border-rule bg-raised px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {open ? <PaletteDialog entries={entries} onClose={close} /> : null}
    </>
  );
}

function PaletteDialog({ entries, onClose }: { entries: Entry[]; onClose: () => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => entry.label.toLowerCase().includes(needle));
  }, [entries, query]);

  function choose(entry: Entry | undefined): void {
    entry?.run();
    onClose();
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[highlighted]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.placeholder")}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-rule bg-surface shadow-[var(--shadow-lift)]"
      >
        <input
          // autoFocus is right here: the dialog exists only because the user
          // just asked for it, and the input is its entire purpose.
          autoFocus
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-autocomplete="list"
          value={query}
          placeholder={t("palette.placeholder")}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlighted(0);
          }}
          onKeyDown={onInputKeyDown}
          className="w-full border-b border-rule bg-transparent px-4 py-3.5 text-sm text-ink placeholder:text-faint focus:outline-none"
        />

        <ul id="palette-results" role="listbox" className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-faint">{t("palette.empty")}</li>
          ) : (
            results.map((entry, index) => (
              <li key={entry.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(entry)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm",
                    index === highlighted ? "bg-brand/10 text-ink" : "text-muted",
                  )}
                >
                  <span>{entry.label}</span>
                  <span className="font-mono text-[10px] tracking-wide text-faint uppercase">
                    {entry.group}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
