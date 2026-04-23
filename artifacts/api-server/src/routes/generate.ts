import { Router, type IRouter } from "express";
import { db, decksTable, cardsTable, generationsTable } from "@workspace/db";
import { GenerateCardsBody } from "@workspace/api-zod";
import { createCanvas, loadImage } from "canvas";

const router: IRouter = Router();

const MAX_PAGE_IMAGES = Number.MAX_SAFE_INTEGER;
const VISUAL_BATCH_SIZE = 6;
const MAX_VISUAL_PAGES = Number.MAX_SAFE_INTEGER;
const MAX_CARD_TARGET = Number.MAX_SAFE_INTEGER;
const CROP_PADDING = 0.085;
const MIN_CROP_DIMENSION = 0.18;
const VISUAL_CONCURRENCY = 2;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function isRetryableAIError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: unknown }).name;
  return name === "AbortError" || getErrorCode(error) === "ABORT_ERR";
}

async function createChatCompletionWithRetry(
  openai: Awaited<ReturnType<typeof getOpenAIClient>>,
  payload: Parameters<typeof openai.chat.completions.create>[0],
  requestLog: { warn: (obj: unknown, message: string) => void },
  signal?: AbortSignal,
) {
  const delays = [2000, 5000, 10000];

  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw new Error("Cancelled");
    try {
      return await openai.chat.completions.create(payload, { signal });
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw error;
      if (!isRetryableAIError(error) || attempt >= delays.length) {
        throw error;
      }
      const delayMs = delays[attempt];
      requestLog.warn({ err: error, attempt: attempt + 1, delayMs }, "Retrying AI card generation");
      await sleep(delayMs);
    }
  }
}

function parseJson<T>(raw: string): T[] {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const candidates = [
    cleaned,
    cleaned.match(/\[[\s\S]*\]/)?.[0],
    cleaned.match(/\{[\s\S]*\}/)?.[0],
  ].filter((v): v is string => Boolean(v));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed as T[];
      if (parsed && typeof parsed === "object") {
        const arr = (parsed as Record<string, unknown>).cards ?? (parsed as Record<string, unknown>).items;
        if (Array.isArray(arr)) return arr as T[];
      }
    } catch {
      continue;
    }
  }
  return [];
}

async function getOpenAIClient() {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    throw new Error("AI card generation is not configured yet.");
  }
  const { openai } = await import("@workspace/integrations-openai-ai-server");
  return openai;
}

type RawCard = { front: string; back: string };
type Bbox = { x: number; y: number; w: number; h: number };
type VisualRawCard = { pageIndex: number; front: string; back: string; bbox?: Bbox };
type VisualCardResult = { front: string; back: string; image: string; sourceImage: string; bbox: Bbox | null };

function clamp01(n: unknown, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(1, v));
}

function normalizeBbox(raw: unknown): Bbox | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  // Support {x,y,w,h} or {x,y,width,height} or [x,y,w,h]
  let x: unknown, y: unknown, w: unknown, h: unknown;
  if (Array.isArray(raw) && raw.length === 4) {
    [x, y, w, h] = raw;
  } else {
    x = r.x;
    y = r.y;
    w = r.w ?? r.width;
    h = r.h ?? r.height;
  }
  if ([x, y, w, h].some(v => typeof v !== "number")) return null;
  const bbox: Bbox = {
    x: clamp01(x, 0),
    y: clamp01(y, 0),
    w: clamp01(w, 1),
    h: clamp01(h, 1),
  };
  if (bbox.w < 0.03 || bbox.h < 0.03) return null;
  if (bbox.x + bbox.w > 1) bbox.w = 1 - bbox.x;
  if (bbox.y + bbox.h > 1) bbox.h = 1 - bbox.y;
  // Guarantee a minimum visible crop size so tiny boxes don't produce
  // postage-stamp images that miss labels/captions around the figure.
  if (bbox.w < MIN_CROP_DIMENSION) {
    const grow = (MIN_CROP_DIMENSION - bbox.w) / 2;
    bbox.x = Math.max(0, bbox.x - grow);
    bbox.w = Math.min(1 - bbox.x, MIN_CROP_DIMENSION);
  }
  if (bbox.h < MIN_CROP_DIMENSION) {
    const grow = (MIN_CROP_DIMENSION - bbox.h) / 2;
    bbox.y = Math.max(0, bbox.y - grow);
    bbox.h = Math.min(1 - bbox.y, MIN_CROP_DIMENSION);
  }
  return bbox;
}

function expandBbox(bbox: Bbox, pad: number): Bbox {
  const x = Math.max(0, bbox.x - pad);
  const y = Math.max(0, bbox.y - pad);
  const right = Math.min(1, bbox.x + bbox.w + pad);
  const bottom = Math.min(1, bbox.y + bbox.h + pad);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

async function cropImage(dataUrlOrB64: string, bbox: Bbox | null): Promise<string> {
  const src = dataUrlOrB64.startsWith("data:") ? dataUrlOrB64 : `data:image/jpeg;base64,${dataUrlOrB64}`;
  if (!bbox) return src;
  try {
    const img = await loadImage(src);
    // If the box already covers most of the page, just return the original — avoids re-encoding loss.
    if (bbox.w >= 0.9 && bbox.h >= 0.9) return src;
    const padded = expandBbox(bbox, CROP_PADDING);
    const sx = Math.round(padded.x * img.width);
    const sy = Math.round(padded.y * img.height);
    const sw = Math.max(1, Math.min(img.width - sx, Math.round(padded.w * img.width)));
    const sh = Math.max(1, Math.min(img.height - sy, Math.round(padded.h * img.height)));
    const canvas = createCanvas(sw, sh);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return src;
  }
}

const SOURCE_THUMB_MAX = 720;

async function downscaleSourcePage(dataUrlOrB64: string): Promise<string> {
  const src = dataUrlOrB64.startsWith("data:") ? dataUrlOrB64 : `data:image/jpeg;base64,${dataUrlOrB64}`;
  try {
    const img = await loadImage(src);
    if (img.width <= SOURCE_THUMB_MAX) return src;
    const scale = SOURCE_THUMB_MAX / img.width;
    const w = SOURCE_THUMB_MAX;
    const h = Math.round(img.height * scale);
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return src;
  }
}

function customPromptBlock(customPrompt: string | undefined): string {
  const trimmed = (customPrompt ?? "").trim();
  if (!trimmed) return "";
  // Cap to keep total prompt reasonable
  const capped = trimmed.length > 1500 ? trimmed.slice(0, 1500) + "…" : trimmed;
  return `\n\nADDITIONAL USER INSTRUCTIONS (these override the defaults above when they conflict, except for the JSON output format which is mandatory):\n"""\n${capped}\n"""`;
}

async function generateTextCards(
  openai: Awaited<ReturnType<typeof getOpenAIClient>>,
  text: string,
  maxCards: number,
  requestLog: { warn: (obj: unknown, message: string) => void },
  signal?: AbortSignal,
  customPrompt?: string,
): Promise<RawCard[]> {
  const systemPrompt = `You are an expert Anki flashcard creator. Generate high-quality question-answer flashcards from the provided text that test understanding, not just recall.

Rules:
- Questions should be specific and unambiguous
- Answers should be concise but complete  
- Avoid trivial or overly obvious cards
- Focus on key concepts, definitions, relationships, mechanisms, and important facts
- Each card should be self-contained (understandable without context)
- Use simple, clear language

Respond ONLY with a JSON array of objects with "front" (question) and "back" (answer) fields. No markdown, no explanation.${customPromptBlock(customPrompt)}`;

  const userContent = `Generate exactly ${maxCards} Anki flashcards from the following text:\n\n${text.slice(0, 400000)}`;

  const response = await createChatCompletionWithRetry(openai, {
    model: "gpt-4.1-mini",
    max_completion_tokens: 16384,
    stream: false as const,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  }, requestLog, signal);

  const raw = (response as { choices: Array<{ message: { content: string | null } }> })
    .choices[0]?.message?.content ?? "[]";
  return parseJson<RawCard>(raw);
}

async function generateVisualCardsForBatch(
  openai: Awaited<ReturnType<typeof getOpenAIClient>>,
  batchImages: string[],
  batchStart: number,
  cardsPerPage: number,
  requestLog: { warn: (obj: unknown, message: string) => void },
  signal?: AbortSignal,
  customPrompt?: string,
): Promise<VisualRawCard[]> {
  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } };

  const imageUrls: ContentPart[] = batchImages.map(img => ({
    type: "image_url" as const,
    image_url: {
      url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
      detail: "high" as const,
    },
  }));

  const cardsRange = cardsPerPage <= 1 ? "1" : `1–${cardsPerPage}`;

  const systemPrompt = `You are an expert visual learning designer and clinical/scientific illustrator. You convert PDF page images into Anki flashcards centered on the figures shown on each page. You will receive ${batchImages.length} page image(s) (pages ${batchStart + 1}–${batchStart + batchImages.length}).

═══════════════════════════════════════════════
STEP 1 — DETECT EVERY VISUAL ON EACH PAGE
═══════════════════════════════════════════════
Carefully scan each page like a librarian indexing it. Identify EVERY distinct visual element. Do not miss any. Visuals include (non-exhaustive):
  • Diagrams, schematics, flowcharts, algorithms, decision trees
  • Anatomical drawings, cross-sections, organ illustrations, embryology stages
  • Medical imaging: X-ray, CT, MRI, ultrasound, PET, angiography, fluoroscopy
  • Histology / cytology / microscopy slides, gross pathology photos
  • Dermatology, ophthalmology, ENT clinical photos
  • ECG / EEG / EMG / spirometry / capnography traces
  • Tables that present clinical/scientific data visually (drug doses, classifications, scoring systems, criteria, differential lists)
  • Charts, graphs, dose-response curves, Kaplan-Meier curves, growth charts
  • Chemical structures, biochemical pathways, cell signalling diagrams
  • Mathematical/physics equations, derivations, vector diagrams, circuits, free-body diagrams
  • Maps, geological cross-sections, engineering blueprints
  • Photographs, micrographs, electrophoresis gels, Western blots

If a page has multiple distinct figures (e.g., Figure 5.1 and Figure 5.2), each gets its OWN card with its OWN bounding box. Do not lump them.

If a single figure has multiple sub-panels (A, B, C, D) AND each panel teaches a clearly different concept, you may make one card per panel with a tight bbox around just that panel — but always include that panel's individual label/caption inside the bbox.

If the entire page is one large visual (a full-page diagram), use {"x":0,"y":0,"w":1,"h":1}.

Skip a page only if it genuinely contains no meaningful visual learning content (pure prose, table of contents, copyright notice, blank page).

═══════════════════════════════════════════════
STEP 2 — DRAW BOUNDING BOXES PROFESSIONALLY
═══════════════════════════════════════════════
Coordinates are NORMALIZED 0..1 where (0,0) is the TOP-LEFT of the page and (1,1) is the BOTTOM-RIGHT. The bbox is {"x", "y", "w", "h"}.

Hard rules — every box MUST include:
  1. The entire figure body (no clipping of arms, branches, edges, ROI, organ borders).
  2. ALL labels, arrows, leader lines, callouts, sub-panel letters (A/B/C/D), and the structures they point to.
  3. The figure's caption / title / footnote (e.g., "Figure 5.1: Cardiac conduction system").
  4. Axis labels, axis numbers/units, tick marks, legends, colour keys, scale bars, and orientation markers (R/L, anterior/posterior).
  5. Any annotation directly describing the visual (e.g., "Note the ST-segment elevation in II, III, aVF").
  6. ~6–10% of empty/white margin on EACH side of the visual content. Generous breathing room is REQUIRED.

Hard rules — every box MUST NEVER:
  ✗ Clip text mid-line, mid-word, or mid-character.
  ✗ Cut through arrows, leader lines, or anatomical structures.
  ✗ Omit any sub-panel of a multi-part figure that you're referencing.
  ✗ Miss the figure number/caption — these orient the learner.
  ✗ Be tight to the visible pixels of the diagram. Always pad outward to clean white space.

Decision algorithm for each box:
  a. Find the visible bounding rectangle of all ink belonging to this figure (lines, labels, captions, leaders, legends).
  b. Expand outward to the nearest margin of true whitespace on each side.
  c. Add an extra ~6–10% safety margin in every direction.
  d. Snap to page edges if you reach them.
  e. When in doubt, make the box LARGER, not smaller. A slightly oversized box is professional; a tight box that clips a label is unusable.

═══════════════════════════════════════════════
STEP 3 — WRITE FOCUSED VISUAL CARDS
═══════════════════════════════════════════════
Each card must be:
  • Image-first: the question should require the learner to look at the cropped image (identify, label, interpret, diagnose, name the structure, calculate from the graph, recognise the pattern).
  • Self-contained: do not say "as shown above" or "from the previous figure". Reference what's in the cropped image itself.
  • Specific: prefer "Identify the structure indicated by arrow A in this CT scan" over "What is this?".
  • Concise on the back: a clear answer + 1–2 lines of context if useful (e.g., "Right middle lobe consolidation — typical for community-acquired pneumonia").
  • Free of trivial questions ("What colour is this?" unless colour is diagnostic).

═══════════════════════════════════════════════
OUTPUT FORMAT (STRICT)
═══════════════════════════════════════════════
Return ONLY a JSON array. Each item must have exactly:
  - "pageIndex": integer (0-based index within the images you received, so 0 = first image in this batch)
  - "front": string (question)
  - "back": string (answer)
  - "bbox": object {"x": number, "y": number, "w": number, "h": number} — all between 0 and 1, following STEP 2 strictly.

Aim for ${cardsRange} card(s) per page when there is meaningful visual content. If a page has more distinct figures than that, you MAY exceed the upper bound up to one card per distinct figure (do not invent cards for non-existent visuals).

No markdown, no commentary, no \`\`\` fences — just the JSON array.${customPromptBlock(customPrompt)}`;

  try {
    const response = await createChatCompletionWithRetry(openai, {
      model: "gpt-4.1",
      max_completion_tokens: 16384,
      stream: false as const,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text" as const, text: `Here are the ${batchImages.length} page image(s) for pages ${batchStart + 1}–${batchStart + batchImages.length}. Detect EVERY visual on each page (do not miss any) and produce generous, professional bounding boxes that include all labels, captions, and ~6–10% breathing room. Then write image-first Anki cards. Output JSON only.` },
            ...imageUrls,
          ],
        },
      ],
    }, requestLog, signal);

    const raw = (response as { choices: Array<{ message: { content: string | null } }> })
      .choices[0]?.message?.content ?? "[]";
    return parseJson<VisualRawCard>(raw)
      .filter(c => typeof c.pageIndex === "number" && typeof c.front === "string" && typeof c.back === "string")
      .map(c => ({ ...c, bbox: normalizeBbox(c.bbox) ?? undefined }));
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error;
    return [];
  }
}

async function generateAllVisualCards(
  openai: Awaited<ReturnType<typeof getOpenAIClient>>,
  images: string[],
  targetCount: number | undefined,
  requestLog: { warn: (obj: unknown, message: string) => void },
  onBatchGroupDone?: (doneBatches: number, totalBatches: number) => void,
  signal?: AbortSignal,
  customPrompt?: string,
): Promise<VisualCardResult[]> {
  const pagesToProcess = images.slice(0, MAX_VISUAL_PAGES);
  const batches: { start: number; imgs: string[] }[] = [];

  for (let i = 0; i < pagesToProcess.length; i += VISUAL_BATCH_SIZE) {
    batches.push({ start: i, imgs: pagesToProcess.slice(i, i + VISUAL_BATCH_SIZE) });
  }

  // Compute upper bound of cards per page from target. The model is also
  // instructed it MAY exceed this when a page has more distinct figures than
  // this number, so genuinely figure-rich pages aren't artificially capped.
  const cardsPerPage = targetCount && targetCount > 0
    ? Math.max(1, Math.min(8, Math.ceil(targetCount / pagesToProcess.length)))
    : 3;

  const results: VisualCardResult[] = [];
  let doneBatches = 0;

  for (let i = 0; i < batches.length; i += VISUAL_CONCURRENCY) {
    if (signal?.aborted) throw new Error("Cancelled");
    const chunk = batches.slice(i, i + VISUAL_CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map(b => generateVisualCardsForBatch(openai, b.imgs, b.start, cardsPerPage, requestLog, signal, customPrompt).then(async cards => {
        const out: VisualCardResult[] = [];
        const thumbCache = new Map<number, string>();
        for (const c of cards) {
          if (c.pageIndex < 0 || c.pageIndex >= b.imgs.length) continue;
          const cropped = await cropImage(b.imgs[c.pageIndex], c.bbox ?? null);
          let thumb = thumbCache.get(c.pageIndex);
          if (!thumb) {
            thumb = await downscaleSourcePage(b.imgs[c.pageIndex]);
            thumbCache.set(c.pageIndex, thumb);
          }
          out.push({
            front: c.front.trim(),
            back: c.back.trim(),
            image: cropped,
            sourceImage: thumb,
            bbox: c.bbox ?? null,
          });
        }
        return out;
      }))
    );

    for (const r of settled) {
      if (r.status === "fulfilled") results.push(...r.value);
    }

    doneBatches += chunk.length;
    onBatchGroupDone?.(doneBatches, batches.length);

    if (i + VISUAL_CONCURRENCY < batches.length) await sleep(500);
  }

  // If a target was given, trim down
  if (targetCount && targetCount > 0 && results.length > targetCount) {
    return results.slice(0, targetCount);
  }
  return results;
}

function sseEmit(res: import("express").Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

type DeckType = "text" | "visual" | "both";

function resolveDeckType(input: unknown, hasImages: boolean): DeckType {
  const t = input === "text" || input === "visual" || input === "both" ? input : "both";
  if (!hasImages && t !== "text") return "text";
  return t;
}

router.post("/generate/stream", async (req, res, next): Promise<void> => {
  const parsed = GenerateCardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, deckName, cardCount = 20, visualCardCount, parentId, pageImages, deckType: rawDeckType, customPrompt } = parsed.data;

  if (!text || text.trim().length < 10) {
    res.status(400).json({ error: "Text is too short to generate cards from." });
    return;
  }

  const runStartedAt = Date.now();
  let recorded = false;
  const recordRun = async (status: "success" | "error" | "cancelled", cardsGenerated: number, errorMessage?: string) => {
    if (recorded) return;
    recorded = true;
    try {
      await db.insert(generationsTable).values({
        deckName,
        deckType: rawDeckType ?? "both",
        status,
        cardsGenerated,
        pageCount: Array.isArray(pageImages) ? pageImages.length : 0,
        durationMs: Date.now() - runStartedAt,
        customPrompt: customPrompt?.trim() ? customPrompt.trim().slice(0, 1500) : null,
        errorMessage: errorMessage ? errorMessage.slice(0, 500) : null,
        startedAt: new Date(runStartedAt),
        completedAt: new Date(),
      });
    } catch (err) {
      req.log.warn({ err }, "Failed to record generation history");
    }
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send SSE comment heartbeats to keep proxies (Replit edge, Cloudflare,
  // Android Chrome on mobile networks, etc.) from closing the long-lived
  // connection during slow AI calls. Comments start with ":" and are ignored
  // by EventSource/fetch consumers.
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      /* socket may be closed */
    }
  }, 12_000);
  const stopHeartbeat = () => clearInterval(heartbeat);
  res.on("close", stopHeartbeat);
  res.on("finish", stopHeartbeat);

  const selectedImages = Array.isArray(pageImages) && pageImages.length > 0
    ? pageImages.slice(0, MAX_PAGE_IMAGES)
    : [];
  const hasImages = selectedImages.length > 0;
  const deckType = resolveDeckType(rawDeckType, hasImages);
  const wantText = deckType === "text" || deckType === "both";
  const wantVisual = (deckType === "visual" || deckType === "both") && hasImages;

  const maxTextCards = wantText ? Math.max(cardCount, 1) : 0;
  const maxVisualCards = wantVisual
    ? Math.max(visualCardCount ?? cardCount, 1)
    : 0;

  sseEmit(res, { type: "progress", percent: 5, message: "Connecting to AI…" });

  let openai: Awaited<ReturnType<typeof getOpenAIClient>>;
  try {
    openai = await getOpenAIClient();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI not configured.";
    await recordRun("error", 0, msg);
    sseEmit(res, { type: "error", message: msg });
    res.end();
    return;
  }

  sseEmit(res, { type: "progress", percent: 12, message: wantText ? "Generating text cards…" : "Analyzing pages…" });

  const abortController = new AbortController();
  const onClientClose = () => abortController.abort();
  req.on("close", onClientClose);
  const signal = abortController.signal;

  const TEXT_DONE_PERCENT = wantVisual ? 40 : 82;
  const VISUAL_START = wantText ? 42 : 15;
  const VISUAL_END = 85;

  let textCards: RawCard[] = [];
  let visualCards: VisualCardResult[] = [];

  try {
    const textPromise = wantText
      ? generateTextCards(openai, text, maxTextCards, req.log, signal, customPrompt).then(cards => {
          textCards = cards;
          sseEmit(res, { type: "progress", percent: TEXT_DONE_PERCENT, message: `Text cards done (${cards.length} generated)` });
        })
      : Promise.resolve();

    const visualPromise = wantVisual
      ? generateAllVisualCards(openai, selectedImages, maxVisualCards, req.log, (done, total) => {
          const frac = done / total;
          const pct = Math.round(VISUAL_START + frac * (VISUAL_END - VISUAL_START));
          const pages = Math.min(done * VISUAL_BATCH_SIZE, selectedImages.length);
          sseEmit(res, { type: "progress", percent: pct, message: `Analyzing & cropping images… (${pages}/${selectedImages.length} pages)` });
        }, signal, customPrompt).then(cards => { visualCards = cards; })
      : Promise.resolve();

    await Promise.all([textPromise, visualPromise]);
  } catch (error) {
    req.off("close", onClientClose);
    if (isAbortError(error) || signal.aborted) {
      req.log.info("AI card generation cancelled by client");
      await recordRun("cancelled", 0);
      try { sseEmit(res, { type: "error", message: "Cancelled" }); } catch { /* socket may be gone */ }
      try { res.end(); } catch { /* ignore */ }
      return;
    }
    req.log.error({ err: error }, "SSE AI card generation failed");
    const status = getErrorStatus(error);
    const code = getErrorCode(error);
    let msg: string;
    if (status === 429 || code === "too_many_requests") {
      msg = "AI is temporarily rate-limited. Wait a minute and try again.";
    } else {
      msg = error instanceof Error ? error.message : "AI card generation failed.";
    }
    await recordRun("error", 0, msg);
    sseEmit(res, { type: "error", message: msg });
    res.end();
    return;
  }
  req.off("close", onClientClose);
  if (signal.aborted) {
    await recordRun("cancelled", 0);
    try { res.end(); } catch { /* ignore */ }
    return;
  }

  sseEmit(res, { type: "progress", percent: 90, message: "Saving cards to database…" });

  try {
    const filteredText = textCards
      .filter(c => typeof c.front === "string" && typeof c.back === "string")
      .map(c => ({ front: c.front.trim(), back: c.back.trim() }))
      .filter(c => c.front.length > 0 && c.back.length > 0);

    const filteredVisual = visualCards
      .filter(c => c.front.length > 0 && c.back.length > 0);

    if (filteredText.length === 0 && filteredVisual.length === 0) {
      await recordRun("error", 0, "AI did not return any usable cards.");
      sseEmit(res, { type: "error", message: "AI did not return any usable cards." });
      res.end();
      return;
    }

    let textDeck: typeof decksTable.$inferSelect | null = null;
    let visualDeck: typeof decksTable.$inferSelect | null = null;
    let totalInserted = 0;

    const wantTextDeck = wantText && filteredText.length > 0;
    const wantVisualDeck = wantVisual && filteredVisual.length > 0;
    const splitting = wantTextDeck && wantVisualDeck;

    if (wantTextDeck) {
      const name = splitting ? `${deckName} – Text` : deckName;
      const [d] = await db
        .insert(decksTable)
        .values({ name, parentId: parentId ?? null })
        .returning();
      textDeck = d;
      const inserted = await db.insert(cardsTable).values(
        filteredText.map(c => ({ deckId: d.id, front: c.front, back: c.back, image: null }))
      ).returning();
      totalInserted += inserted.length;
    }

    if (wantVisualDeck) {
      const name = splitting ? `${deckName} – Visual` : deckName;
      const [d] = await db
        .insert(decksTable)
        .values({ name, parentId: parentId ?? null })
        .returning();
      visualDeck = d;
      const inserted = await db.insert(cardsTable).values(
        filteredVisual.map(c => ({
          deckId: d.id,
          front: c.front,
          back: c.back,
          image: c.image.startsWith("data:") ? c.image : `data:image/jpeg;base64,${c.image}`,
          sourceImage: c.sourceImage ?? null,
          bbox: c.bbox ? JSON.stringify(c.bbox) : null,
        }))
      ).returning();
      totalInserted += inserted.length;
    }

    const primaryDeck = textDeck ?? visualDeck;
    if (!primaryDeck) {
      await recordRun("error", 0, "Failed to save deck.");
      sseEmit(res, { type: "error", message: "Failed to save deck." });
      res.end();
      return;
    }

    await recordRun("success", totalInserted);
    sseEmit(res, {
      type: "done",
      percent: 100,
      generatedCount: totalInserted,
      deck: { ...primaryDeck, cardCount: totalInserted, createdAt: primaryDeck.createdAt.toISOString() },
      ...(textDeck && visualDeck
        ? { visualDeck: { ...visualDeck, cardCount: filteredVisual.length, createdAt: visualDeck.createdAt.toISOString() } }
        : {}),
    });
    res.end();
  } catch (err) {
    await recordRun("error", 0, err instanceof Error ? err.message : "Unknown error");
    next(err);
  }
});

router.post("/generate", async (req, res, next): Promise<void> => {
  const parsed = GenerateCardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, deckName, cardCount = 20, visualCardCount, parentId, pageImages, deckType: rawDeckType, customPrompt } = parsed.data;

  if (!text || text.trim().length < 10) {
    res.status(400).json({ error: "Text is too short to generate cards from." });
    return;
  }

  const selectedImages = Array.isArray(pageImages) && pageImages.length > 0
    ? pageImages.slice(0, MAX_PAGE_IMAGES)
    : [];
  const hasImages = selectedImages.length > 0;
  const deckType = resolveDeckType(rawDeckType, hasImages);
  const wantText = deckType === "text" || deckType === "both";
  const wantVisual = (deckType === "visual" || deckType === "both") && hasImages;
  const maxTextCards = wantText ? Math.max(cardCount, 1) : 0;
  const maxVisualCards = wantVisual ? Math.max(visualCardCount ?? cardCount, 1) : 0;

  let openai: Awaited<ReturnType<typeof getOpenAIClient>>;
  try {
    openai = await getOpenAIClient();
  } catch (error) {
    req.log.error({ err: error }, "AI card generation failed");
    res.status(503).json({ error: error instanceof Error ? error.message : "AI card generation failed." });
    return;
  }

  let textCards: RawCard[] = [];
  let visualCards: VisualCardResult[] = [];

  try {
    [textCards, visualCards] = await Promise.all([
      wantText ? generateTextCards(openai, text, maxTextCards, req.log, undefined, customPrompt) : Promise.resolve([] as RawCard[]),
      wantVisual ? generateAllVisualCards(openai, selectedImages, maxVisualCards, req.log, undefined, undefined, customPrompt) : Promise.resolve([]),
    ]);
  } catch (error) {
    req.log.error({ err: error }, "AI card generation failed");
    const status = getErrorStatus(error);
    const code = getErrorCode(error);
    if (status === 429 || code === "too_many_requests") {
      res.status(429).json({ error: "AI is temporarily rate-limited. Wait a minute and try again." });
      return;
    }
    res.status(503).json({ error: error instanceof Error ? error.message : "AI card generation failed." });
    return;
  }

  const filteredText = textCards
    .filter(c => typeof c.front === "string" && typeof c.back === "string")
    .map(c => ({ front: c.front.trim(), back: c.back.trim() }))
    .filter(c => c.front.length > 0 && c.back.length > 0);
  const filteredVisual = visualCards.filter(c => c.front.length > 0 && c.back.length > 0);

  if (filteredText.length === 0 && filteredVisual.length === 0) {
    res.status(500).json({ error: "AI did not generate any cards." });
    return;
  }

  try {
    let textDeck: typeof decksTable.$inferSelect | null = null;
    let visualDeck: typeof decksTable.$inferSelect | null = null;
    const allInserted: (typeof cardsTable.$inferSelect)[] = [];

    const wantTextDeck = wantText && filteredText.length > 0;
    const wantVisualDeck = wantVisual && filteredVisual.length > 0;
    const splitting = wantTextDeck && wantVisualDeck;

    if (wantTextDeck) {
      const name = splitting ? `${deckName} – Text` : deckName;
      const [d] = await db.insert(decksTable).values({ name, parentId: parentId ?? null }).returning();
      textDeck = d;
      const inserted = await db.insert(cardsTable).values(
        filteredText.map(c => ({ deckId: d.id, front: c.front, back: c.back, image: null }))
      ).returning();
      allInserted.push(...inserted);
    }

    if (wantVisualDeck) {
      const name = splitting ? `${deckName} – Visual` : deckName;
      const [d] = await db.insert(decksTable).values({ name, parentId: parentId ?? null }).returning();
      visualDeck = d;
      const inserted = await db.insert(cardsTable).values(
        filteredVisual.map(c => ({
          deckId: d.id,
          front: c.front,
          back: c.back,
          image: c.image.startsWith("data:") ? c.image : `data:image/jpeg;base64,${c.image}`,
          sourceImage: c.sourceImage ?? null,
          bbox: c.bbox ? JSON.stringify(c.bbox) : null,
        }))
      ).returning();
      allInserted.push(...inserted);
    }

    const primaryDeck = textDeck ?? visualDeck;
    if (!primaryDeck) {
      res.status(500).json({ error: "Failed to save deck." });
      return;
    }

    res.status(201).json({
      deck: { ...primaryDeck, cardCount: allInserted.filter(c => c.deckId === primaryDeck.id).length, createdAt: primaryDeck.createdAt.toISOString() },
      ...(textDeck && visualDeck
        ? { visualDeck: { ...visualDeck, cardCount: filteredVisual.length, createdAt: visualDeck.createdAt.toISOString() } }
        : {}),
      cards: allInserted.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      generatedCount: allInserted.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
