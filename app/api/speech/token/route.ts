import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return NextResponse.json(
      { error: "Server missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION" },
      { status: 503 },
    );
  }

  const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": "0",
    },
  });

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json(
      { error: "Failed to issue speech token", detail: t },
      { status: 502 },
    );
  }

  const token = await res.text();
  return NextResponse.json({ token, region });
}
