import type { FixedRequest } from "./client";
interface Draft {
  value: unknown;
  baseVersion: string;
}
const copy = <T>(value: T): T => structuredClone(value);
export class DraftVault {
  private owner: string | null = null;
  private drafts = new Map<string, Map<string, Draft>>();
  private requests = new Map<string, Map<string, FixedRequest>>();
  switchOwner(owner: string | null) {
    this.owner = owner;
  }
  private map<T>(all: Map<string, Map<string, T>>) {
    if (!this.owner) return null;
    let map = all.get(this.owner);
    if (!map) {
      map = new Map();
      all.set(this.owner, map);
    }
    return map;
  }
  put(target: string, value: unknown, baseVersion: string) {
    this.map(this.drafts)?.set(target, { value: copy(value), baseVersion });
  }
  get(target: string) {
    const value = this.map(this.drafts)?.get(target);
    return value ? copy(value) : null;
  }
  recover(target: string, latestVersion: string) {
    const value = this.get(target);
    return value
      ? { ...value, needsRebase: value.baseVersion !== latestVersion }
      : null;
  }
  discard(target: string) {
    this.map(this.drafts)?.delete(target);
  }
  hasDirty() {
    return (this.map(this.drafts)?.size ?? 0) > 0;
  }
  discardAll() {
    this.map(this.drafts)?.clear();
  }
  reconcile(
    target: string,
    saved: Record<string, unknown>,
    version: string,
    sent: Record<string, unknown>,
    newTarget = target,
  ) {
    const draft = this.get(target);
    if (!draft || !draft.value || typeof draft.value !== "object") return;
    const current = copy(draft.value) as Record<string, unknown>;
    for (const key of Object.keys(current)) {
      if (
        Object.hasOwn(sent, key) &&
        JSON.stringify(current[key]) === JSON.stringify(sent[key])
      )
        current[key] = copy(saved[key]);
    }
    this.discard(target);
    if (
      Object.keys(current).some(
        (key) => JSON.stringify(current[key]) !== JSON.stringify(saved[key]),
      )
    )
      this.put(newTarget, current, version);
  }
  markPending(target: string, request: FixedRequest) {
    const map = this.map(this.requests);
    if (!map) return;
    const prior = map.get(target);
    if (prior && JSON.stringify(prior) !== JSON.stringify(request))
      throw new Error("結果不明の要求を先に確認してください。");
    map.set(target, Object.freeze(copy(request)));
  }
  pending(target: string) {
    const request = this.map(this.requests)?.get(target);
    return request ? Object.freeze(copy(request)) : null;
  }
  resolve(target: string) {
    this.map(this.requests)?.delete(target);
  }
}
export const workspaceDrafts = new DraftVault();
export class RequestGeneration {
  private version = 0;
  private controller: AbortController | null = null;
  next() {
    this.controller?.abort();
    this.controller = new AbortController();
    return { version: ++this.version, signal: this.controller.signal };
  }
  accepts(token: { version: number; signal: AbortSignal }) {
    return token.version === this.version && !token.signal.aborted;
  }
  invalidate() {
    this.version++;
    this.controller?.abort();
  }
}
