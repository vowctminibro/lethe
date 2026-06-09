import { complete } from "../src/lib/llm/index";
const KINDS = ["trading-style","market-view","holding","preference","fact"];
const sys = [
  "You are Lethe — a crypto-native AI agent with user-owned memory.",
  "You have no memories about this user yet.",
  'Respond ONLY with JSON: { "reply": string, "remember": { "text": string, "kind": string } | null }',
  "- reply: 1-4 sentences. - remember: a NEW durable fact or null.",
  `- kind one of: ${KINDS.join(", ")}.`,
].join("\n");
async function main(){
  const { text, provider } = await complete(
    [{role:"system",content:sys},{role:"user",content:"I'm a momentum trader on Sui and I never use leverage."}],
    { json:true, temperature:0.5 }
  );
  console.log("provider:", provider);
  console.log("raw:", text);
}
main().catch(e=>{console.error("CHAT SMOKE FAILED:", e instanceof Error?e.message:e);process.exit(1);});
