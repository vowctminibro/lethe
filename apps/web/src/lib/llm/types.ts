/**
 * LLMProvider — the swappable contract for the chat/reasoning plane (SERVER-ONLY).
 *
 * Mirrors the MemoryProvider/Encryptor seams: one small interface, multiple
 * implementations chosen by env, never importing a paid/secret key into a client
 * component. The factory in ./index.ts chains free providers (Groq → Gemini) so
 * the repo stays open-source-cloneable: a judge sets ONE free key and chat works.
 *
 * All implementations read keys from process.env only — nothing is hardcoded.
 */

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface CompleteOptions {
  /** Cap on output tokens. */
  maxTokens?: number;
  /** Sampling temperature; lower = more deterministic. */
  temperature?: number;
  /** Ask the provider for a strict JSON object back (best-effort across providers). */
  json?: boolean;
  signal?: AbortSignal;
}

export interface LLMProvider {
  /** Stable id surfaced in responses so we can report WHICH model answered. */
  readonly id: string;
  /** True when the provider has the env it needs to run (e.g. its API key). */
  isConfigured(): boolean;
  /** Run a chat completion and return the assistant's text. */
  complete(messages: ChatMessage[], opts?: CompleteOptions): Promise<string>;
  /**
   * Stream a completion token-by-token. Connection/setup errors throw before
   * the first token, so the factory can fall through to the next provider.
   * Optional — providers without it fall back to complete().
   */
  stream?(messages: ChatMessage[], opts?: CompleteOptions): Promise<AsyncIterable<string>>;
}
