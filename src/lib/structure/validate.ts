import { companyMemoSchema, type CompanyMemoStructured } from "./schema";

export type ValidateResult =
  | { ok: true; memo: CompanyMemoStructured }
  | { ok: false; code: "validation_failed" };

export function validateCompanyMemo(value: unknown): ValidateResult {
  const parsed = companyMemoSchema.safeParse(value);
  return parsed.success
    ? { ok: true, memo: parsed.data }
    : { ok: false, code: "validation_failed" };
}
