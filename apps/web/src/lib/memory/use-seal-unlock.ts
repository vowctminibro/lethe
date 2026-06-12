"use client";

/**
 * useSealUnlocking — true while the one-time per-session Seal SessionKey
 * signature is in flight. Surfaces the quiet "unlocking your memories…"
 * state without any component knowing about Seal internals.
 */

import { useSyncExternalStore } from "react";
import { subscribeSealUnlock, getSealUnlockState } from "./seal-session";

export function useSealUnlocking(): boolean {
  return useSyncExternalStore(
    subscribeSealUnlock,
    () => getSealUnlockState() === "unlocking",
    () => false,
  );
}
