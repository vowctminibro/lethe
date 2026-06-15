# @lethe/mcp — Lethe memory as an agent tool

A tiny, **dependency-free** [MCP](https://modelcontextprotocol.io) stdio server that
lets any MCP-capable agent (Claude Desktop/Code, etc.) read a user's **Lethe**
memory — gated by the user's **on-chain grant**, revocable any time.

It adds no new trust: it's a thin adapter over Lethe's existing public surface.

## Tools

| Tool | What it does | Grant needed? |
|------|--------------|---------------|
| `lethe_get_vault` | Public on-chain vault metadata (entry count, authorized apps, Suiscan link) read straight from a Sui fullnode. | No |
| `lethe_recall_granted` | Server-mediated, grant-gated read (`POST /api/grant/recall`). Returns the user's memories **only if this agent's address is in the vault's on-chain `authorized` list**; otherwise a clear grant-denied message. Seal entries are owner-decrypt-only and marked sealed. | Yes |

## Configure

```jsonc
// e.g. claude_desktop_config.json → mcpServers
{
  "lethe": {
    "command": "node",
    "args": ["/abs/path/to/lethe/packages/mcp/lethe-mcp.mjs"],
    "env": {
      "LETHE_APP_ADDRESS": "0x… your agent's on-chain address (the one the user grants)",
      "LETHE_BASE_URL": "https://lethe-gold.vercel.app"
    }
  }
}
```

| Env | Default | |
|-----|---------|--|
| `LETHE_APP_ADDRESS` | — | This agent's on-chain address. Required for `lethe_recall_granted`. |
| `LETHE_BASE_URL` | `https://lethe-gold.vercel.app` | Lethe app base. |
| `LETHE_FULLNODE_URL` | testnet public fullnode | Sui RPC for `lethe_get_vault`. |
| `LETHE_MEMORY_PKG` | the live Memory package id | Original `memory` package id. |

## The flow ("Continue with Lethe" for agents)

1. User grants the agent's address on their vault (`/memory` → grant, or `memory::grant`).
2. Agent calls `lethe_recall_granted({ ownerAddress })` → gets the user's memories.
3. User revokes any time → the next call returns **grant denied**, verifiable on Suiscan.

Decryption today is server-mediated / owner-session (Seal blobs are owner-only);
independent agent decrypt sessions arrive with the shared-registry policy (roadmap).
