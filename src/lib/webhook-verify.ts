import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/config/env";

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  // If no webhook secret is configured, skip verification
  if (!env.github.webhookSecret) return true;

  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    createHmac("sha256", env.github.webhookSecret)
      .update(rawBody)
      .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    // Length mismatch — secrets don't match
    console.error("Webhook signature mismatch", {
      received: signatureHeader.slice(0, 20) + "...",
      expected: expected.slice(0, 20) + "...",
    });
    return false;
  }
}
