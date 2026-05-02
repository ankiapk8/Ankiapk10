/**
 * Default AI model constants.
 *
 * All models are available on OpenRouter (openrouter.ai).
 * Override at runtime by setting the corresponding env var.
 *
 * google/gemini-2.0-flash-001
 *   - Stable Gemini 2.0 Flash release: 1M context, vision support,
 *     excellent structured-JSON output, fast.
 *   - Ideal for: flashcard generation, visual detection,
 *     explanations, mind-map generation, QBank creation.
 */

export const FREE_TEXT_MODEL =
  process.env.AI_TEXT_MODEL ?? "google/gemini-2.0-flash-001";

export const FREE_VISION_MODEL =
  process.env.AI_VISION_MODEL ?? "google/gemini-2.0-flash-001";
