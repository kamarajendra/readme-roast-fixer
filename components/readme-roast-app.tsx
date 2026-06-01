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

function scoreTone(score: number) {
  if (score >= 80) return "var(--color-success)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-danger)";
}

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
  const analysis = useMemo(() => analyzeReadme(markdown), [markdown]);
  const report = useMemo(() => buildMarkdownReport(markdown, analysis), [analysis, markdown]);

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
      setStatus("Clipboard copy is unavailable here. Copy the report from the panel below.");
      return;
    }

    try {
      await navigator.clipboard.writeText(report);
      setStatus("Copied markdown report to clipboard.");
    } catch {
      setStatus("Clipboard permission was denied. Copy the report from the panel below.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <section className="grid gap-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[0_18px_60px_rgba(29,32,66,0.08)] lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div className="space-y-5">
          <div className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
            Rule-based README diagnostics
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Roast weak docs, then turn them into something a maintainer would trust.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Score README quality across setup clarity, examples, visual proof, and maintenance signals. No AI API, no vague advice.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Scorecard", "7 categories"],
              ["Priority fixes", "Sorted by severity"],
              ["Quick wins", "Actionable rewrite prompts"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                <div className="text-sm text-[var(--color-muted)]">{label}</div>
                <div className="mt-2 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[24px] bg-[var(--color-canvas)] p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">GitHub repo URL</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={handleFetchReadme}
                disabled={isFetching}
                className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetching ? "Fetching..." : "Fetch README"}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--color-muted)]">README Markdown</span>
            <textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              className="min-h-[280px] w-full rounded-[22px] border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          {status ? <p className="text-sm text-[var(--color-muted)]">{status}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
          <div>
            <div className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Overall</div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-6xl font-semibold">{analysis.overallScore}</div>
              <div className="pb-2 text-lg text-[var(--color-muted)]">/ 100</div>
            </div>
            <div className="mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium" style={{ background: `${scoreTone(analysis.overallScore)}1f`, color: scoreTone(analysis.overallScore) }}>
              {analysis.overallScore >= 80 ? "Publishable" : analysis.overallScore >= 60 ? "Needs polish" : "Needs repair"}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">What is already working</h2>
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
              {analysis.strengths.length > 0 ? analysis.strengths.map((strength) => <li key={strength}>{strength}</li>) : <li>No standout strengths yet. Start with the highest-severity fixes.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analysis.categories.map((category) => (
              <article key={category.category} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
                <div className="text-sm font-medium text-[var(--color-muted)]">{category.label}</div>
                <div className="mt-3 text-3xl font-semibold">{category.score}<span className="text-base font-medium text-[var(--color-muted)]">/{category.maxScore}</span></div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{category.summary}</p>
              </article>
            ))}
          </div>

          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Priority fixes</h2>
              <span className="text-sm text-[var(--color-muted)]">What hurts trust first</span>
            </div>

            <div className="mt-5 space-y-4">
              {analysis.findings.map((finding) => (
                <article key={finding.id} className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-canvas)] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ background: finding.severity === "high" ? "color-mix(in oklab, var(--color-danger) 14%, transparent)" : finding.severity === "medium" ? "color-mix(in oklab, var(--color-warning) 18%, transparent)" : "color-mix(in oklab, var(--color-accent) 14%, transparent)", color: finding.severity === "high" ? "var(--color-danger)" : finding.severity === "medium" ? "oklch(0.5 0.12 82)" : "var(--color-accent)" }}>
                      {finding.severity}
                    </span>
                    <h3 className="text-lg font-semibold">{finding.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{finding.detail}</p>
                  <div className="mt-4 rounded-2xl bg-[var(--color-panel)] p-4 text-sm leading-6">
                    <span className="font-semibold">Suggested fix:</span> {finding.suggestion}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Export-ready markdown report</h2>
              <button
                type="button"
                onClick={handleCopyReport}
                className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Copy report
              </button>
            </div>
            <pre className="mt-5 whitespace-pre-wrap rounded-[22px] bg-[var(--color-canvas)] p-4 text-sm leading-6 text-[var(--color-muted)] overflow-x-auto">
              {report}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
