/**
 * Lightweight retrieval scoring — keyword overlap + bag-of-words cosine.
 *
 * Deliberately simple: enough to rank a handful of personal memories against a
 * natural-language query for the demo. Real semantic embeddings arrive with the
 * MemWal data plane (0.0.4) / a vector index — this is the placeholder behind the
 * same `recall()` contract, so swapping it in later is a one-file change.
 */

const STOP = new Set([
  "a", "an", "the", "is", "are", "am", "i", "my", "me", "you", "your", "of",
  "to", "in", "on", "and", "or", "for", "what", "whats", "do", "does", "it",
  "this", "that", "with", "about", "how", "im", "ive",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9$\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/**
 * Score how well `text` answers `query`, in [0,1]. Combines cosine similarity of
 * term-frequency vectors with a small boost for the fraction of query terms that
 * appear at all (so short queries still discriminate).
 */
export function scoreEntry(query: string, text: string): number {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;
  const tTokens = tokenize(text);
  if (tTokens.length === 0) return 0;

  const qf = termFreq(qTokens);
  const tf = termFreq(tTokens);

  let dot = 0;
  for (const [term, qc] of qf) {
    const tc = tf.get(term);
    if (tc) dot += qc * tc;
  }
  const qMag = Math.sqrt([...qf.values()].reduce((s, c) => s + c * c, 0));
  const tMag = Math.sqrt([...tf.values()].reduce((s, c) => s + c * c, 0));
  const cosine = qMag && tMag ? dot / (qMag * tMag) : 0;

  const matched = [...qf.keys()].filter((t) => tf.has(t)).length;
  const coverage = matched / qf.size;

  return 0.7 * cosine + 0.3 * coverage;
}
