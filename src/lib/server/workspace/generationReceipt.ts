import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { assertKeyRing, type KeyRing } from "../auth/crypto";
import { WorkspaceError } from "./errors";
const receiptSchema = z.strictObject({
  purpose: z.literal("memo-generation"),
  version: z.literal(1),
  keyId: z.string().max(32),
  userId: z.uuid(),
  generationId: z.uuid(),
  providerOrigin: z.enum(["dummy", "openai"]),
});
/** Only server-validated output may call this issuer; the proof is not a fact check. */
export function issueGenerationReceipt(
  userId: string,
  providerOrigin: "dummy" | "openai",
  keys: KeyRing,
  generationId: string = randomUUID(),
) {
  assertKeyRing(keys);
  const payload = receiptSchema.parse({
    purpose: "memo-generation",
    version: 1,
    keyId: keys.active,
    userId,
    generationId,
    providerOrigin,
  });
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", keys.keys[keys.active])
    .update(`memo-generation:v1:${body}`)
    .digest("base64url");
  return `${body}.${signature}`;
}
export function verifyGenerationReceipt(
  receipt: string,
  userId: string,
  providerOrigin: "dummy" | "openai",
  keys: KeyRing,
) {
  assertKeyRing(keys);
  try {
    if (receipt.length > 4096) throw new Error();
    const [body, signature, ...extra] = receipt.split(".");
    if (extra.length) throw new Error();
    const payload = receiptSchema.parse(
      JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
    );
    const key = keys.keys[payload.keyId];
    if (
      !key ||
      payload.userId !== userId ||
      payload.providerOrigin !== providerOrigin
    )
      throw new Error();
    const expected = createHmac("sha256", key)
      .update(`memo-generation:v1:${body}`)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected) ||
      actual.toString("base64url") !== signature
    )
      throw new Error();
    return payload;
  } catch {
    throw new WorkspaceError("invalid_input");
  }
}
