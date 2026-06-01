export type RuleCategory =
  | "projectSummary"
  | "installSetup"
  | "usageExamples"
  | "screenshotsDemo"
  | "license"
  | "contributionDocs"
  | "trustSignals";

export type Severity = "high" | "medium" | "low";

export type CategoryResult = {
  category: RuleCategory;
  label: string;
  score: number;
  maxScore: number;
  summary: string;
};

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  suggestion: string;
};

export type ReadmeAnalysis = {
  overallScore: number;
  categories: CategoryResult[];
  findings: Finding[];
  strengths: string[];
};

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  projectSummary: "Project Summary",
  installSetup: "Install & Setup",
  usageExamples: "Usage & Examples",
  screenshotsDemo: "Screenshots & Demo",
  license: "License",
  contributionDocs: "Contribution & Docs",
  trustSignals: "Trust Signals",
};

function hasHeading(markdown: string, patterns: RegExp[]) {
  return markdown
    .split(/\r?\n/)
    .some((line) => patterns.some((pattern) => pattern.test(line)));
}

function hasAny(markdown: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(markdown));
}

function scoreCategory(
  category: RuleCategory,
  checks: Array<{ ok: boolean; points: number }>,
  summary: string,
): CategoryResult {
  const maxScore = checks.reduce((sum, check) => sum + check.points, 0);
  const score = checks.reduce((sum, check) => sum + (check.ok ? check.points : 0), 0);

  return { category, label: CATEGORY_LABELS[category], score, maxScore, summary };
}

export function analyzeReadme(markdown: string): ReadmeAnalysis {
  const source = markdown.trim();

  if (!source) {
    return {
      overallScore: 0,
      categories: Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
        category: category as RuleCategory,
        label,
        score: 0,
        maxScore: 10,
        summary: "No README content provided yet.",
      })),
      findings: [
        {
          id: "empty-readme",
          severity: "high",
          title: "README content is empty",
          detail: "The analyzer needs pasted Markdown before it can assess trust gaps.",
          suggestion: "Paste a README or fetch it from a public GitHub repo URL.",
        },
      ],
      strengths: [],
    };
  }

  const categories = [
    scoreCategory(
      "projectSummary",
      [
        { ok: /^#\s+.+/m.test(source), points: 4 },
        { ok: source.split(/\s+/).length >= 80, points: 3 },
        { ok: hasAny(source, [/overview/i, /why/i, /purpose/i, /problem/i]), points: 3 },
      ],
      "A strong opening explains what the project is, who it helps, and why it exists.",
    ),
    scoreCategory(
      "installSetup",
      [
        { ok: hasHeading(source, [/^##?\s+install/i, /^##?\s+setup/i, /^##?\s+getting started/i]), points: 5 },
        { ok: /```[\s\S]*?(npm|pnpm|yarn|bun|pip|cargo|go)[\s\S]*?```/i.test(source), points: 5 },
      ],
      "Reviewers should not guess how to install or run the project.",
    ),
    scoreCategory(
      "usageExamples",
      [
        { ok: hasHeading(source, [/^##?\s+usage/i, /^##?\s+examples?/i, /^##?\s+how to use/i]), points: 5 },
        { ok: /```[\s\S]+?```/.test(source), points: 5 },
      ],
      "Examples prove the tool can be understood after setup.",
    ),
    scoreCategory(
      "screenshotsDemo",
      [
        { ok: /!\[[^\]]*\]\([^)]+\)/.test(source), points: 5 },
        { ok: hasAny(source, [/demo/i, /preview/i, /live/i, /screenshot/i]), points: 5 },
      ],
      "Visual proof and live demos reduce uncertainty for first-time visitors.",
    ),
    scoreCategory(
      "license",
      [
        { ok: hasHeading(source, [/^##?\s+license/i]), points: 5 },
        { ok: /mit|apache|bsd|gpl|mozilla public license/i.test(source), points: 5 },
      ],
      "Explicit licensing makes open-source usage feel safe.",
    ),
    scoreCategory(
      "contributionDocs",
      [
        { ok: hasHeading(source, [/^##?\s+contributing/i, /^##?\s+development/i]), points: 5 },
        { ok: hasAny(source, [/pull request/i, /issue/i, /roadmap/i, /changelog/i]), points: 5 },
      ],
      "A maintenance path helps the repo feel active, not abandoned.",
    ),
    scoreCategory(
      "trustSignals",
      [
        { ok: /\[!\[[^\]]+\]\([^)]+\)\]\([^)]+\)/.test(source), points: 4 },
        { ok: hasAny(source, [/ci/i, /github actions/i, /tested/i, /vercel/i, /netlify/i]), points: 3 },
        { ok: hasAny(source, [/architecture/i, /limitations/i, /faq/i, /known issues/i]), points: 3 },
      ],
      "Badges, deployment links, and architecture notes build confidence.",
    ),
  ];

  const findings: Finding[] = [];
  const strengths: string[] = [];

  if (categories[0].score < 7) {
    findings.push({
      id: "summary-gap",
      severity: "high",
      title: "Open with a clearer project story",
      detail: "The top of the README should immediately explain the product and outcome.",
      suggestion: "Add a short overview under the title that names the user, the problem, and the value.",
    });
  } else {
    strengths.push("The README opens with enough context to understand the project quickly.");
  }

  if (categories[1].score < 8) {
    findings.push({
      id: "setup-gap",
      severity: "high",
      title: "Setup flow is underspecified",
      detail: "A reviewer should not have to guess commands or environment setup.",
      suggestion: "Add an Install or Getting Started section with exact commands and required configuration.",
    });
  } else {
    strengths.push("The README gives contributors a concrete path from clone to local run.");
  }

  if (categories[2].score < 8) {
    findings.push({
      id: "usage-gap",
      severity: "medium",
      title: "Usage examples need more proof",
      detail: "Good repos demonstrate at least one realistic flow, command, or output.",
      suggestion: "Add a Usage section with one example input and one example result.",
    });
  }

  if (categories[3].score < 5) {
    findings.push({
      id: "visual-proof-gap",
      severity: "medium",
      title: "Missing visual proof or demo link",
      detail: "Screenshots and live previews reduce friction for first-time visitors.",
      suggestion: "Add one screenshot, GIF, or demo URL near the top half of the README.",
    });
  }

  if (categories[4].score < 10) {
    findings.push({
      id: "license-gap",
      severity: "medium",
      title: "License information is incomplete",
      detail: "Open-source repos feel unfinished when licensing is implied but not explicit.",
      suggestion: "Add a License heading and mention the exact license name.",
    });
  }

  if (categories[5].score < 7) {
    findings.push({
      id: "maintenance-gap",
      severity: "low",
      title: "Maintenance story is thin",
      detail: "Contribution notes and roadmap links help the repo feel cared for.",
      suggestion: "Mention how to propose changes and link your roadmap or contribution guide.",
    });
  }

  if (categories[6].score < 6) {
    findings.push({
      id: "trust-gap",
      severity: "low",
      title: "Add more trust signals",
      detail: "Badges, CI, architecture notes, and limitations help reviewers trust the repo faster.",
      suggestion: "Add CI or release badges and a short architecture or limitations section.",
    });
  } else {
    strengths.push("The README includes trust-building details beyond the minimum feature list.");
  }

  const totalScore = categories.reduce((sum, category) => sum + category.score, 0);
  const maxScore = categories.reduce((sum, category) => sum + category.maxScore, 0);
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

  findings.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity]);

  return {
    overallScore: Math.round((totalScore / maxScore) * 100),
    categories,
    findings,
    strengths,
  };
}
