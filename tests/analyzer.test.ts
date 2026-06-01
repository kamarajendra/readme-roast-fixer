import { describe, expect, it } from "vitest";

import { analyzeReadme } from "@/lib/analyzer";

describe("analyzeReadme", () => {
  it("returns a zero score for empty markdown", () => {
    const result = analyzeReadme("   ");
    expect(result.overallScore).toBe(0);
    expect(result.findings[0]?.id).toBe("empty-readme");
  });

  it("rewards complete readmes with setup, usage, proof, and license", () => {
    const result = analyzeReadme(`
# Product Atlas

Product Atlas helps engineering teams document service ownership, environments, and deployment risks in one place.

## Overview

Use Product Atlas to explain why a service exists, who maintains it, and where its critical dependencies live.

## Install

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

\`\`\`bash
npm run sync-services
\`\`\`

## Demo

![dashboard](https://example.com/screenshot.png)

## Architecture

This repo tracks service metadata, owners, and delivery risks.

## Contributing

Open an issue first and check the roadmap.

## License

MIT

[![CI](https://example.com/ci.svg)](https://example.com/actions)
`);

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.findings).toHaveLength(0);
  });

  it("prioritizes summary and setup gaps first", () => {
    const result = analyzeReadme("# Hello\n\nSmall project.");
    expect(result.findings[0]?.id).toBe("summary-gap");
    expect(result.findings[1]?.id).toBe("setup-gap");
  });
});
