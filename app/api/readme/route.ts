import { NextRequest, NextResponse } from "next/server";

import { fetchGitHubReadme } from "@/lib/github";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { url?: string };

  if (!body.url) {
    return NextResponse.json({ error: "A GitHub repo URL is required." }, { status: 400 });
  }

  try {
    const markdown = await fetchGitHubReadme(body.url);
    return NextResponse.json({ markdown });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch README." },
      { status: 400 },
    );
  }
}
