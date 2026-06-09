/**
 * Encryptor — the confidentiality seam for memory entries (SERVER-ONLY).
 *
 * Walrus blobs are public and discoverable, so entry *content* must be encrypted
 * before it is stored (see contracts/memory/sources/memory.move and
 * .walrus-docs/walrus-client/storing-blobs.mdx). This interface is the single
 * swap-point for that: today it's a lightweight AES-256-GCM scheme keyed per user;
 * next chunk it is replaced by @mysten/seal (threshold encryption + on-chain
 * `seal_approve` policy bound to the Memory object's `authorized` set), which is
 * what makes "revoke = forget" cryptographically enforced rather than app-enforced.
 *
 * Imports node:crypto — never import this from a client component.
 */

import { hkdfSync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

export interface Encryptor {
  /** Encrypt plaintext for `ownerAddress`; returns the bytes to store on Walrus. */
  encrypt(plaintext: string, ownerAddress: string): Promise<Uint8Array>;
  /** Decrypt bytes read back from Walrus for `ownerAddress`. */
  decrypt(ciphertext: Uint8Array, ownerAddress: string): Promise<string>;
  /** Short label of the scheme, surfaced in the verifiable view. */
  readonly scheme: string;
}

const VERSION = 0x01; // bumped if the wire format changes
const IV_LEN = 12; // GCM standard nonce length
const TAG_LEN = 16;

/**
 * Per-user AES-256-GCM. Key = HKDF-SHA256(masterSecret, salt=ownerAddress).
 * Wire format: [version(1)][iv(12)][tag(16)][ciphertext].
 *
 * This keeps blobs unreadable to anyone fetching them off Walrus, while staying
 * a faithful stand-in for Seal: same shape (encrypt before store, decrypt after
 * read, access keyed to the owner) so the provider above it doesn't change when
 * Seal lands.
 */
export class AesGcmEncryptor implements Encryptor {
  readonly scheme = "aes-256-gcm/hkdf(owner)";
  #master: Buffer;

  constructor(masterSecret: string) {
    if (!masterSecret) throw new Error("Missing MEMORY_ENCRYPTION_SECRET");
    this.#master = Buffer.from(masterSecret, "utf8");
  }

  #key(ownerAddress: string): Buffer {
    const salt = Buffer.from(ownerAddress.toLowerCase(), "utf8");
    const info = Buffer.from("lethe-memory-entry-v1", "utf8");
    return Buffer.from(hkdfSync("sha256", this.#master, salt, info, 32));
  }

  async encrypt(plaintext: string, ownerAddress: string): Promise<Uint8Array> {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv("aes-256-gcm", this.#key(ownerAddress), iv);
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Uint8Array.from(Buffer.concat([Buffer.from([VERSION]), iv, tag, ct]));
  }

  async decrypt(ciphertext: Uint8Array, ownerAddress: string): Promise<string> {
    const buf = Buffer.from(ciphertext);
    if (buf.length < 1 + IV_LEN + TAG_LEN) throw new Error("ciphertext too short");
    if (buf[0] !== VERSION) throw new Error(`unsupported ciphertext version ${buf[0]}`);
    const iv = buf.subarray(1, 1 + IV_LEN);
    const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
    const ct = buf.subarray(1 + IV_LEN + TAG_LEN);
    const decipher = createDecipheriv("aes-256-gcm", this.#key(ownerAddress), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  }
}

/** Process-wide encryptor built from env. Swap this factory for a Seal-backed one. */
let _enc: Encryptor | null = null;
export function getEncryptor(): Encryptor {
  if (!_enc) _enc = new AesGcmEncryptor(process.env.MEMORY_ENCRYPTION_SECRET ?? "");
  return _enc;
}
