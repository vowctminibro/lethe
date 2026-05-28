/**
 * Enoki zkLogin integration.
 * Docs: https://docs.enoki.mystenlabs.com
 *
 * Setup:
 * 1. Create Enoki API key at portal.enoki.mystenlabs.com
 * 2. Set NEXT_PUBLIC_ENOKI_API_KEY and ENOKI_SECRET_KEY in .env.local
 * 3. Configure Google OAuth client at console.cloud.google.com
 *    Redirect URI: https://api.enoki.mystenlabs.com/v1/auth/callback/google
 *
 * TODO (Day 3): wire EnokiProvider in layout.tsx
 * TODO (Day 3): use useEnokiSession() hook after provider is set up
 */

export const ENOKI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? "",
  secretKey: process.env.ENOKI_SECRET_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
} as const;

export type EnokiSession = {
  address: string;       // Sui address derived from zkLogin JWT
  userId: string;        // Google subject ID
  expiresAt: number;     // Unix timestamp
};
