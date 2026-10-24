import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import { WorkspaceError } from "../workspace/errors";

export interface KeyRing {
  active: string;
  keys: Record<string, Buffer>;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
export interface TokenContext {
  sessionHash: string;
  userId: string;
}
const envelopeSchema = z.strictObject({
  version: z.literal(1),
  keyId: z.string(),
  nonce: z.string(),
  tag: z.string(),
  ciphertext: z.string(),
});
const tokensSchema = z.strictObject({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().finite(),
});
export type SealedTokens = z.infer<typeof envelopeSchema>;
export function assertKeyRing(ring: KeyRing) {
  if (!ring || !ring.keys[ring.active] || !Object.keys(ring.keys).length)
    throw new WorkspaceError("unavailable");
  for (const [id, key] of Object.entries(ring.keys))
    if (
      !/^[a-zA-Z0-9_-]{1,32}$/.test(id) ||
      !Buffer.isBuffer(key) ||
      key.length !== 32
    )
      throw new WorkspaceError("unavailable");
}
const aad = (context: TokenContext, keyId: string) =>
  Buffer.from(
    JSON.stringify([
      "app-session-token",
      1,
      context.sessionHash,
      context.userId,
      keyId,
    ]),
  );
function decode(value: string, length?: number) {
  const bytes = Buffer.from(value, "base64url");
  if (
    bytes.toString("base64url") !== value ||
    (length !== undefined && bytes.length !== length)
  )
    throw new WorkspaceError("unauthenticated");
  return bytes;
}
export function sealTokens(
  tokens: AuthTokens,
  context: TokenContext,
  ring: KeyRing,
): SealedTokens {
  assertKeyRing(ring);
  const parsed = tokensSchema.parse(tokens);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ring.keys[ring.active], nonce);
  cipher.setAAD(aad(context, ring.active));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(parsed), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    keyId: ring.active,
    nonce: nonce.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}
export function openTokens(
  value: unknown,
  context: TokenContext,
  ring: KeyRing,
): AuthTokens {
  assertKeyRing(ring);
  try {
    const envelope = envelopeSchema.parse(value);
    const key = ring.keys[envelope.keyId];
    if (!key) throw new Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      decode(envelope.nonce, 12),
    );
    decipher.setAAD(aad(context, envelope.keyId));
    decipher.setAuthTag(decode(envelope.tag, 16));
    // finalのtag検証が成功するまで平文を解析・返却しない。
    const plaintext = Buffer.concat([
      decipher.update(decode(envelope.ciphertext)),
      decipher.final(),
    ]);
    return tokensSchema.parse(JSON.parse(plaintext.toString("utf8")));
  } catch {
    throw new WorkspaceError("unauthenticated");
  }
}
