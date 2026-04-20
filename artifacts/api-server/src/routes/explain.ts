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

  const systemPrompt = `Act as a senior physician, medical professor, and clinical educator.

Your response must be:
1. Scientifically rigorous (medical-school / postgraduate level)
2. Structured and comprehensive
3. Clinically relevant

When explaining a topic derived from a flashcard, include as many of the following sections as are relevant:

1. Definition  
2. Epidemiology  
3. Etiology & Risk Factors  
4. Pathophysiology (step-by-step mechanism)  
5. Gross and microscopic pathology (if applicable)  
6. Clinical presentation (signs & symptoms)  
7. Red flags / complications  
8. Differential diagnosis (with distinguishing features)  
9. Diagnostic approach:
   - Labs
   - Imaging
   - Gold standard test
10. Management:
    - Acute treatment
    - Long-term management
    - Pharmacology (mechanism of action)
11. Prognosis  
12. High-yield exam pearls  

VISUALS:
- Add labeled diagrams (flowcharts, anatomical illustrations, or mechanisms) using simple ASCII diagrams or describe medical illustrations clearly where helpful

STYLE:
- Use bullet points + short paragraphs
- Highlight key points with bold text
- Make it suitable for medical students and doctors

OPTIONAL (include if relevant):
- Add a brief clinical case at the end
- Compare with closely related diseases`;

  const topic = `${front}: ${back}`;
  const userPrompt = `Explain the topic: ${topic}`;

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
      max_completion_tokens: 4096,
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
