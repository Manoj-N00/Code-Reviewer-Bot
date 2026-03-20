export const env = {
  github: {
    appId: process.env.GITHUB_APP_ID!,
    privateKey: (process.env.GITHUB_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: "openai/gpt-oss-120b",
    baseUrl: "https://openrouter.ai/api/v1",
  },
} as const;
