import { Router, type IRouter } from "express";

const router: IRouter = Router();

async function getOpenAIClient() {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    throw new Error("AI explanation is not configured yet.");
  }
  const { openai } = await import("@workspace/integrations-openai-ai-server");
  return openai;
}

router.post("/explain", async (req, res): Promise<void> => {
  const { front, back } = req.body as { front?: string; back?: string };

  if (!front || !back) {
    res.status(400).json({ error: "front and back are required." });
    return;
  }

  const systemPrompt = `You are a helpful tutor explaining flashcard answers. 
When given a flashcard question and answer, provide a clear, concise explanation (2-4 sentences) that:
- Clarifies why the answer is correct
- Adds useful context or memory aids
- Highlights any nuances or common misconceptions
Keep the explanation friendly and educational. Do not restate the question or answer verbatim.`;

  const userPrompt = `Flashcard question: "${front}"\nAnswer: "${back}"\n\nExplain this answer.`;

  let openai;
  try {
    openai = await getOpenAIClient();
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : "AI not configured." });
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 512,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) res.write(text);
    }
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI explanation failed");
    if (!res.headersSent) {
      res.status(503).json({ error: "AI explanation failed." });
    } else {
      res.end();
    }
  }
});

export default router;
