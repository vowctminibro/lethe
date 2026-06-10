/**
 * Minimal SSE body parser shared by streaming providers (SERVER-ONLY).
 *
 * Both Groq (OpenAI-compatible) and Gemini (`alt=sse`) stream as `data: {json}`
 * lines; `pick` extracts the token delta from each event's parsed payload.
 */

export async function* parseSse(
  body: ReadableStream<Uint8Array>,
  pick: (event: unknown) => string,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const token = pick(JSON.parse(payload));
          if (token) yield token;
        } catch {
          /* keep-alives / partial frames — skip */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
