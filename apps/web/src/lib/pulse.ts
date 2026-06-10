/**
 * Pulse — the second Lethe-powered surface (hero 0:40–1:05, the money shot).
 *
 * Pulse's on-chain identity is a well-known app address: "pulse" in hex,
 * left-padded to a valid Sui address. The user grants/revokes THIS address on
 * their Memory vault (`memory::grant` / `memory::revoke`) — so "can Pulse read
 * my memory" is a judge-verifiable fact in the vault's `authorized` vector on
 * Suiscan, not an app-side toggle.
 */

export const PULSE_APP_ADDRESS =
  "0x00000000000000000000000000000000000000000000000000000070756c7365";

export const PULSE_NAME = "Pulse";
export const PULSE_TAGLINE = "Portfolio companion — powered by Lethe memory";
