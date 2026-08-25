import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * The actual markdown renderer. Split into its own module so it can be lazily
 * loaded — react-markdown and its unified/micromark dependencies are ~31 kB
 * gzipped, which is too much to spend before first paint.
 */
export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children: c }) => (
          <h3 className="font-display text-lg font-semibold text-ink">{c}</h3>
        ),
        h3: ({ children: c }) => <h4 className="font-semibold text-ink">{c}</h4>,
        p: ({ children: c }) => <p className="max-w-[68ch]">{c}</p>,
        ul: ({ children: c }) => <ul className="ml-5 list-disc space-y-1.5">{c}</ul>,
        ol: ({ children: c }) => <ol className="ml-5 list-decimal space-y-1.5">{c}</ol>,
        strong: ({ children: c }) => <strong className="font-semibold text-ink">{c}</strong>,
        a: ({ children: c, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand underline underline-offset-2"
          >
            {c}
          </a>
        ),
        code: ({ children: c }) => (
          <code className="rounded border border-rule bg-raised px-1.5 py-0.5 font-mono text-[0.85em]">
            {c}
          </code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
