import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { handlePullRequestEvent } from "@/lib/review-engine";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  // Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only handle pull_request events
  if (event !== "pull_request") {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  const payload = JSON.parse(rawBody);

  // Only react to opened and synchronize (new commits pushed)
  if (!["opened", "synchronize"].includes(payload.action)) {
    return NextResponse.json({ message: "Action ignored" }, { status: 200 });
  }

  // Process review inline (not in background — after() doesn't work on Hobby plan)
  try {
    await handlePullRequestEvent(payload);
    return NextResponse.json({ message: "Review posted" }, { status: 200 });
  } catch (error) {
    console.error("Error processing PR review:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Code Reviewer Bot webhook endpoint",
  });
}
