"use client";

import { useMemo, useState } from "react";

import { analyzeReadme } from "@/lib/analyzer";

const SAMPLE_MARKDOWN = `# Orbit Notes

Orbit Notes is a fast note-taking workspace for people who want folders, tags, and keyboard shortcuts without the weight of a full wiki.

## Install

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

\`\`\`bash
npm run import ./notes
\`\`\`

## Demo

See the live app at https://example.com and review the screenshot below.

![Orbit Notes dashboard](https://placehold.co/1200x700/png)

## Contributing

Please open an issue before large changes.

## License

MIT
`;

function scoreRing(score: number) {
  if (score >= 80) return { color: "var(--color-score-high)", label: "Ship it" };
  if (score >= 60) return { color: "var(--color-score-mid)", label: "Needs work" };
  return { color: "var(--color-score-low)", label: "Rough" };
}

const CATEGORY_ICONS: Record<string, string> = {
  projectSummary: "[S]",
  installSetup: "[I]",
  usageExamples: "[U]",
  screenshotsDemo: "[M]",
  license: "[L]",
  contributionDocs: "[C]",
  trustSignals: "[T]",
  releaseReadiness: "[R]",
};

function buildMarkdownReport(markdown: string, analysis: ReturnType<typeof analyzeReadme>) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? "README Review";

  return [
    `# ${title} README Report`,
    "",
    `Overall score: **${analysis.overallScore}/100**`,
    "",
    "## Category breakdown",
    ...analysis.categories.map(
      (category) => `- **${category.label}:** ${category.score}/${category.maxScore} - ${category.summary}`,
    ),
    "",
    "## Priority fixes",
    ...analysis.findings.map(
      (finding) => `- **${finding.title} (${finding.severity})**: ${finding.suggestion}`,
    ),
    "",
    "## Strengths",
    ...(analysis.strengths.length > 0
      ? analysis.strengths.map((strength) => `- ${strength}`)
      : ["- No standout strengths yet."]),
  ].join("\n");
}

export function ReadmeRoastApp() {
  const [repoUrl, setRepoUrl] = useState("");
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [status, setStatus] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const analysis = useMemo(() => analyzeReadme(markdown), [markdown]);
  const report = useMemo(() => buildMarkdownReport(markdown, analysis), [analysis, markdown]);

  const ring = scoreRing(analysis.overallScore);

  async function handleFetchReadme() {
    setStatus(null);
    setIsFetching(true);

    try {
      const response = await fetch("/api/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      const payload = (await response.json()) as { markdown?: string; error?: string };

      if (!response.ok || !payload.markdown) {
        throw new Error(payload.error ?? "Could not fetch README.");
      }

      setMarkdown(payload.markdown);
      setStatus("Fetched README from GitHub.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not fetch README.");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleCopyReport() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setStatus("Clipboard copy is unavailable here.");
      return;
    }

    try {
      await navigator.clipboard.writeText(report);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Clipboard permission was denied.");
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-1 flex-col px-4 font-mono py-4 sm:px-6 lg:px-8 lg:py-8">
      {/* Terminal-style status bar */}
      <header className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--color-muted)]">
        <span className="text-[var(--color-accent)]">readme-roast v0.1.2</span>
        <span className="h-3 w-px bg-[var(--color-border)]" />
        <span>analyzer ready</span>
        <span className="ml-auto hidden sm:inline">{new Date().toLocaleDateString()}</span>
      </header>

      {/* Hero + Input */}
      <section className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-[var(--color-accent)] text-sm font-bold text-black">
              RF
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">
              Rule-based README diagnostics
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-6xl">
              Roast your
              <br />
              <span className="text-[var(--color-accent)]">README.</span>
            </h1>
            <p className="max-w-xl leading-relaxed text-[var(--color-muted)]">
              No fluff, no AI. Seven rule categories that score setup clarity, proof, trust signals, and maintenance readiness. Paste a README or pull one from any public GitHub repo.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              ["7 categories", "scored"],
              ["Priority fixes", "by severity"],
              ["Copy report", "markdown export"],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2">
                <span className="text-[var(--color-accent)]">{label}</span>
                <span className="ml-1.5 text-[var(--color-muted)]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">GitHub URL</span>
            <div className="flex gap-2">
              <input
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={handleFetchReadme}
                disabled={isFetching}
                className="rounded border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFetching ? "Fetching..." : "Pull"}
              </button>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">README Markdown</span>
            <textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              className="min-h-[200px] w-full rounded border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </label>
          {status ? <p className="text-xs text-[var(--color-muted)]">{status}</p> : null}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Score sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-center">
            <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Score</div>
            <div className="mt-3 flex items-baseline justify-center gap-1">
              <span className="text-6xl font-black" style={{ color: ring.color }}>
                {analysis.overallScore}
              </span>
              <span className="text-sm text-[var(--color-muted)]">/100</span>
            </div>
            <div
              className="mt-3 inline-block rounded px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ background: `color-mix(in oklab, ${ring.color} 20%, transparent)`, color: ring.color }}
            >
              {ring.label}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
            <div className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Strengths</div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {analysis.strengths.length > 0
                ? analysis.strengths.map((strength) => <li key={strength} className="flex gap-2 before:mt-0.5 before:text-[var(--color-score-high)] before:content-['+']">{strength}</li>)
                : <li className="text-[var(--color-score-low)]">No strengths detected yet.</li>}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            {showReport ? "Hide report" : "Show export report"}
          </button>

          {showReport ? (
            <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Markdown</span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="rounded border border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]"
                >
                  Copy
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-muted)]">
                {report}
              </pre>
            </div>
          ) : null}
        </div>

        {/* Main results area */}
        <div className="space-y-6">
          {/* Category grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {analysis.categories.map((category) => (
              <article
                key={category.category}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-accent)] font-semibold">
                    {CATEGORY_ICONS[category.category] ?? "[?]"}
                  </span>
                  <span className="text-sm font-bold" style={{ color: category.score >= category.maxScore * 0.7 ? "var(--color-score-high)" : "var(--color-score-mid)" }}>
                    {category.score}/{category.maxScore}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold">{category.label}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">{category.summary}</p>
              </article>
            ))}
          </div>

          {/* Findings */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-widest">Priority fixes</h2>
              <span className="rounded bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs text-[var(--color-accent)]">
                {analysis.findings.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {analysis.findings.map((finding) => (
                <article key={finding.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className="mt-0.5 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em]"
                      style={{
                        background:
                          finding.severity === "high"
                            ? "color-mix(in oklab, var(--color-danger) 25%, transparent)"
                            : finding.severity === "medium"
                              ? "color-mix(in oklab, var(--color-score-mid) 25%, transparent)"
                              : "color-mix(in oklab, var(--color-accent) 20%, transparent)",
                        color:
                          finding.severity === "high"
                            ? "var(--color-danger)"
                            : finding.severity === "medium"
                              ? "var(--color-score-mid)"
                              : "var(--color-accent)",
                      }}
                    >
                      {finding.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold">{finding.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{finding.detail}</p>
                      <div className="mt-2 rounded border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-xs leading-relaxed">
                        <span className="font-semibold text-[var(--color-accent)]">fix:</span> {finding.suggestion}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer terminal bar */}
      <footer className="mt-auto flex items-center gap-3 border-t border-[var(--color-border)] pt-4 text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
        <span>{analysis.categories.length} categories</span>
        <span className="h-3 w-px bg-[var(--color-border)]" />
        <span>{analysis.findings.length} issues</span>
        <span className="h-3 w-px bg-[var(--color-border)]" />
        <span>{analysis.strengths.length} strengths</span>
      </footer>
    </main>
  );
}
