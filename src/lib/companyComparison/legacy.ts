import { z } from "zod";
import {
  SAVED_COMPANY_MEMOS_STORAGE_KEY,
  toComparisonMarkdown,
  type SavedCompanyMemo,
  type InterestNote,
} from "../comparison";
import { companyMemoSchema } from "../structure/schema";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
const interestSchema = z.object({
  level: z.enum(["high", "medium", "low", "undecided"]),
  memo: z.string(),
});
const recordSchema = z.object({
  id: z.string().min(1),
  memo: companyMemoSchema,
  markdown: z.string(),
  interestNote: interestSchema,
  savedAt: z.string(),
  updatedAt: z.string(),
});
export interface LegacyRead {
  state: "ready" | "empty" | "corrupt" | "unavailable";
  records: SavedCompanyMemo[];
  writable: boolean;
}
export function readLegacy(storage: StoragePort): LegacyRead {
  let raw: string | null;
  try {
    raw = storage.getItem(SAVED_COMPANY_MEMOS_STORAGE_KEY);
  } catch {
    return { state: "unavailable", records: [], writable: false };
  }
  if (raw === null) return { state: "empty", records: [], writable: true };
  let values: unknown;
  try {
    values = JSON.parse(raw);
  } catch {
    return { state: "corrupt", records: [], writable: false };
  }
  if (!Array.isArray(values))
    return { state: "corrupt", records: [], writable: false };
  const records: SavedCompanyMemo[] = [];
  let corrupt = false;
  const ids = new Set<string>();
  for (const value of values) {
    const parsed = recordSchema.safeParse(value);
    if (!parsed.success || ids.has(parsed.data.id)) {
      corrupt = true;
      continue;
    }
    ids.add(parsed.data.id);
    records.push(value as SavedCompanyMemo);
  }
  return {
    state: corrupt ? "corrupt" : records.length ? "ready" : "empty",
    records,
    writable: !corrupt,
  };
}
export function updateLegacy(
  storage: StoragePort,
  id: string,
  interestNote: InterestNote,
): SavedCompanyMemo[] {
  const read = readLegacy(storage);
  if (!read.writable)
    throw new Error("旧データを安全に保持できないため編集を停止しています。");
  const valid = interestSchema.parse(interestNote);
  if (!read.records.some((record) => record.id === id))
    throw new Error("旧メモが見つかりません。");
  const updated = read.records.map((record) =>
    record.id === id
      ? { ...record, interestNote: valid, updatedAt: new Date().toISOString() }
      : record,
  );
  storage.setItem(SAVED_COMPANY_MEMOS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
export const legacyMarkdown = (records: SavedCompanyMemo[]) =>
  toComparisonMarkdown(records);
