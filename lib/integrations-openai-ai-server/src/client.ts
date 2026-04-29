import OpenAI from "openai";

const apiKey =
  process.env.OPENAI_API_KEY1 ||
  process.env.OPENAI_API_KEY ||
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY1 (or OPENAI_API_KEY / AI_INTEGRATIONS_OPENAI_API_KEY) must be set.",
  );
}

const baseURL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";

export const openai = new OpenAI({
  apiKey,
  baseURL,
});
