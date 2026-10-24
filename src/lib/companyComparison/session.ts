import type {
  ComparisonSelection,
  ComparisonSnapshot,
  MutationOutcome,
} from "../workspace/contracts";
import type { FixedRequest } from "../workspace/client";
import type { InterestLevel } from "../comparison";
import { parseSnapshot, validateSelection } from "./model";
export type FieldKind = "interest" | "reason";
export type FieldValue = InterestLevel | string | null;
export interface ComparisonField {
  kind: FieldKind;
  companyId: string;
  memoId: string | null;
  baseVersion: string;
  baseValue: FieldValue;
  draftValue: FieldValue;
  status:
    | "editing"
    | "saving"
    | "unknown"
    | "committed"
    | "rejected"
    | "conflict"
    | "unavailable";
  latest?: { value: FieldValue; version: string };
  intent?: { request: FixedRequest; value: FieldValue; lookupUnknown: boolean };
  outcome?: MutationOutcome;
  readbackState: "idle" | "loading" | "ready" | "error";
  error: string;
}
export interface ComparisonState {
  selected: ComparisonSelection[];
  snapshot: ComparisonSnapshot | null;
  status: "no-selection" | "loading" | "ready" | "stale" | "error";
  fields: Map<string, ComparisonField>;
  unavailableReferences: Set<string>;
  selectionGeneration: number;
  inputGeneration: number;
  requestGeneration: number;
  restorationRequired: boolean;
  exportStatus: "idle" | "checking" | "blocked";
  message: string;
}
export interface ComparisonToken {
  owner: string | null;
  ownerGeneration: number;
  selection: number;
  input: number;
  request: number;
}
function initialState(): ComparisonState {
  return {
    selected: [],
    snapshot: null,
    status: "no-selection",
    fields: new Map(),
    unavailableReferences: new Set(),
    selectionGeneration: 0,
    inputGeneration: 0,
    requestGeneration: 0,
    restorationRequired: false,
    exportStatus: "idle",
    message: "",
  };
}
export const normalizeField = (value: FieldValue) =>
  value === "" ? null : value;
export const fieldDirty = (field: ComparisonField) =>
  normalizeField(field.draftValue) !== normalizeField(field.baseValue);
const fieldIdentity = (field: Pick<ComparisonField, "kind" | "companyId" | "memoId">) =>
  `${field.kind}:${field.companyId}:${field.memoId ?? ""}`;
export class ComparisonSession {
  private owners = new Map<string, ComparisonState>();
  private listeners = new Set<() => void>();
  private ownerGeneration = 0;
  private anonymous = initialState();
  owner: string | null = null;
  revision = 0;
  get state() {
    return this.owner === null ? this.anonymous : this.owners.get(this.owner)!;
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  notify() {
    this.revision++;
    for (const listener of this.listeners) listener();
  }
  setOwner(owner: string | null) {
    if (owner === this.owner) return;
    this.ownerGeneration++;
    if (this.owner) {
      const old = this.state;
      old.snapshot = null;
      old.status = old.selected.length ? "stale" : "no-selection";
      old.requestGeneration++;
      old.restorationRequired = old.fields.size > 0;
      old.exportStatus = "idle";
    }
    this.owner = owner;
    if (owner && !this.owners.has(owner))
      this.owners.set(owner, initialState());
    if (!owner) this.anonymous = initialState();
    this.notify();
  }
  token(): ComparisonToken {
    const s = this.state;
    return {
      owner: this.owner,
      ownerGeneration: this.ownerGeneration,
      selection: s.selectionGeneration,
      input: s.inputGeneration,
      request: s.requestGeneration,
    };
  }
  accepts(token: ComparisonToken, includeInput = false) {
    const s = this.state;
    return (
      this.owner !== null &&
      token.owner === this.owner &&
      token.ownerGeneration === this.ownerGeneration &&
      token.selection === s.selectionGeneration &&
      token.request === s.requestGeneration &&
      (!includeInput || token.input === s.inputGeneration)
    );
  }
  acceptsOwner(token: ComparisonToken) {
    return (
      this.owner !== null &&
      token.owner === this.owner &&
      token.ownerGeneration === this.ownerGeneration
    );
  }
  beginRequest() {
    this.state.requestGeneration++;
    this.state.status = this.state.selected.length ? "loading" : "no-selection";
    this.notify();
    return this.token();
  }
  isFieldAvailable(field: ComparisonField) {
    return !this.state.unavailableReferences.has(fieldIdentity(field));
  }
  invalidateReferences(token: ComparisonToken) {
    if (!this.accepts(token)) return false;
    // C3 does not identify the missing source: guard the fixed selection as a whole.
    for (const selected of this.state.selected) {
      this.state.unavailableReferences.add(`interest:${selected.companyId}:`);
      this.state.unavailableReferences.add(`reason:${selected.companyId}:${selected.memoId}`);
    }
    this.referenceStale();
    return true;
  }
  setReferenceAvailability(field: ComparisonField, available: boolean, token: ComparisonToken) {
    if (!this.accepts(token) || this.state.fields.get(fieldIdentity(field)) !== field) return false;
    if (available) this.state.unavailableReferences.delete(fieldIdentity(field));
    else {
      this.state.unavailableReferences.add(fieldIdentity(field));
      if (field.kind === "interest") {
        for (const related of this.state.fields.values())
          if (related.companyId === field.companyId)
            this.state.unavailableReferences.add(fieldIdentity(related));
      }
      this.referenceStale();
    }
    return true;
  }
  private referenceStale() {
    this.state.status = this.state.selected.length ? "stale" : "no-selection";
    this.state.exportStatus = "blocked";
    this.notify();
  }
  hasDirty() {
    return [...this.state.fields.values()].some(fieldDirty);
  }
  hasUnsaved() {
    return [...this.state.fields.values()].some(
      (f) => fieldDirty(f) || f.status === "saving" || f.status === "unknown",
    );
  }
  discard() {
    for (const field of this.state.fields.values())
      field.draftValue =
        (field.status === "saving" || field.status === "unknown") &&
        field.intent
          ? field.intent.value
          : field.baseValue;
    this.state.inputGeneration++;
    this.notify();
  }
  select(selected: ComparisonSelection[], confirm?: () => boolean) {
    if (selected.length) validateSelection(selected);
    if (this.hasUnsaved()) {
      if (!confirm?.()) return false;
      this.discard();
    }
    this.state.selected = structuredClone(selected);
    this.state.selectionGeneration++;
    this.state.requestGeneration++;
    this.state.snapshot = null;
    this.state.status = selected.length ? "stale" : "no-selection";
    this.state.exportStatus = "idle";
    this.notify();
    return true;
  }
  install(value: ComparisonSnapshot, token: ComparisonToken) {
    if (!this.accepts(token)) return false;
    const parsed = parseSnapshot(value, this.state.selected);
    this.state.snapshot = parsed;
    this.state.status = "ready";
    for (const source of parsed.sources) {
      for (const kind of ["interest", "reason"] as const) {
        const field = this.state.fields.get(this.ensureField(source, kind))!;
        this.state.unavailableReferences.delete(fieldIdentity(field));
        const value = kind === "interest" ? source.company.interestLevel : source.memo.comparisonReason;
        const version = kind === "interest" ? source.company.version : source.memo.version;
        field.latest = { value, version };
        if (!fieldDirty(field) && !["saving", "unknown", "conflict"].includes(field.status)) {
          field.baseVersion = version;field.baseValue = value;field.draftValue = value;
        }
      }
    }
    this.notify();
    return true;
  }
  ensureField(source: ComparisonSnapshot["sources"][number], kind: FieldKind) {
    const companyId = source.company.companyId,
      memoId = kind === "reason" ? source.memo.memoId : null,
      key = `${kind}:${companyId}:${memoId ?? ""}`;
    const value =
        kind === "interest"
          ? source.company.interestLevel
          : source.memo.comparisonReason,
      version =
        kind === "interest" ? source.company.version : source.memo.version;
    const old = this.state.fields.get(key);
    if (!old)
      this.state.fields.set(key, {
        kind,
        companyId,
        memoId,
        baseVersion: version,
        baseValue: value,
        draftValue: value,
        status: "editing",
        readbackState: "idle",
        error: "",
      });
    return key;
  }
  edit(key: string, value: FieldValue) {
    const field = this.state.fields.get(key);
    if (!field) throw Error("比較欄がありません。");
    field.draftValue = value;
    this.state.inputGeneration++;
    this.state.exportStatus = "idle";
    this.notify();
  }
  markStale() {
    this.state.status = this.state.selected.length ? "stale" : "no-selection";
    this.state.requestGeneration++;
    this.notify();
  }
  recover() {
    if (!this.state.snapshot) throw Error("最新参照を取得してください。");
    this.state.restorationRequired = false;
    this.notify();
  }
}
