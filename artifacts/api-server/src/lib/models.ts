/**
 * Default AI model constants.
 *
 * All models are free tiers on OpenRouter (openrouter.ai).
 * Override at runtime by setting the corresponding env var.
 *
 * google/gemini-2.0-flash-exp:free
 *   - Best free all-round model: 1M context, vision support,
 *     excellent structured-JSON output, fast.
 *   - Ideal for: flashcard generation, visual detection,
 *     explanations, mind-map generation, QBank creation.
 */

export const FREE_TEXT_MODEL =
  process.env.AI_TEXT_MODEL ?? "google/gemini-2.0-flash-exp:free";

export const FREE_VISION_MODEL =
  process.env.AI_VISION_MODEL ?? "google/gemini-2.0-flash-exp:free";
