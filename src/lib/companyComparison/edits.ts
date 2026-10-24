import { ClientFailure } from "../workspace/client";
import type { ComparisonClient } from "./client";
import type { MutationOutcome } from "../workspace/contracts";
import type { InterestLevel } from "../comparison";
import {
  ComparisonSession,
  fieldDirty,
  normalizeField,
  type ComparisonField,
  type ComparisonToken,
} from "./session";
type Port = Pick<
  ComparisonClient,
  | "prepareInterest"
  | "prepareReason"
  | "send"
  | "lookup"
  | "readCompany"
  | "readMemo"
>;
export class ComparisonEdits {
  constructor(
    private readonly session: ComparisonSession,
    private readonly port: Port,
  ) {}
  async save(key: string) {
    const field = this.session.state.fields.get(key);
    if (!field || !this.session.owner || this.session.state.restorationRequired)
      return;
    if (
      field.status === "saving" ||
      field.status === "unknown" ||
      field.status === "conflict" ||
      !this.session.isFieldAvailable(field) ||
      !fieldDirty(field)
    )
      return;
    try {
      const operationId = crypto.randomUUID(),
        value = normalizeField(field.draftValue);
      const request =
        field.kind === "interest"
          ? this.port.prepareInterest(
              field.companyId,
              field.baseVersion,
              value as InterestLevel | null,
              operationId,
            )
          : this.port.prepareReason(
              field.companyId,
              field.memoId!,
              field.baseVersion,
              String(field.draftValue ?? ""),
              operationId,
            );
      field.intent = { request, value, lookupUnknown: false };
      field.outcome = undefined;
      await this.send(field);
    } catch {
      field.status = "rejected";
      field.error = "入力内容・理由5000文字の上限を確認してください。";
      this.session.notify();
    }
  }
  private validOutcome(field: ComparisonField, outcome: MutationOutcome) {
    return (
      field.intent &&
      outcome.operationId ===
        JSON.parse(field.intent.request.body).operationId &&
      outcome.action ===
        (field.kind === "interest" ? "company_update" : "memo_update") &&
      outcome.companyId === field.companyId &&
      outcome.memoId === field.memoId &&
      typeof outcome.resultingVersion === "string" &&
      outcome.resultingVersion.length > 0
    );
  }
  private async send(field: ComparisonField) {
    if (!field.intent) return;
    const token = this.session.token();
    field.status = "saving";
    field.error = "";
    this.session.notify();
    try {
      const outcome = await this.port.send(field.intent.request);
      if (!this.session.acceptsOwner(token))
        throw new ClientFailure("operation_unknown", 0, true);
      if (!this.validOutcome(field, outcome))
        throw new ClientFailure("operation_unknown", 0, true);
      await this.committed(field, outcome, token);
    } catch (error) {
      if (!this.session.acceptsOwner(token))
        error = new ClientFailure("operation_unknown", 0, true);
      field.status =
        error instanceof ClientFailure && error.unknown
          ? "unknown"
          : error instanceof ClientFailure && error.code === "version_conflict"
            ? "conflict"
            : "rejected";
      field.error =
        error instanceof ClientFailure
          ? error.message
          : "保存結果を確認できません。";
      this.session.notify();
    }
  }
  private async committed(
    field: ComparisonField,
    outcome: MutationOutcome,
    token: ComparisonToken,
  ) {
    field.status = "committed";
    field.outcome = outcome;
    field.baseValue = field.intent!.value;
    field.baseVersion = outcome.resultingVersion!;
    field.error = "";
    if (this.session.acceptsOwner(token)) this.session.markStale();
    await this.readback(field);
    this.session.notify();
  }
  private async readback(field: ComparisonField) {
    await this.refreshLatestField(field);
  }
  private async latest(field: ComparisonField) {
    const token = this.session.token();
    if (field.kind === "interest") {
      const value = await this.port.readCompany(field.companyId);
      if (!this.session.accepts(token) || value.companyId !== field.companyId || typeof value.version !== "string" || !value.version)
        throw Error("旧ログイン世代の応答です。");
      return { version: value.version, value: value.interestLevel };
    }
    const value = await this.port.readMemo(field.companyId, field.memoId!);
    if (!this.session.accepts(token) || value.companyId !== field.companyId || value.memoId !== field.memoId || typeof value.version !== "string" || !value.version)
      throw Error("旧ログイン世代の応答です。");
    return { version: value.version, value: value.comparisonReason };
  }
  async lookup(key: string) {
    const field = this.session.state.fields.get(key);
    if (!field?.intent || field.status !== "unknown") return;
    const token = this.session.token();
    try {
      const result = await this.port.lookup(
        JSON.parse(field.intent.request.body).operationId,
      );
      if (!this.session.acceptsOwner(token))
        throw Error("旧ログイン世代の応答です。");
      if (result.state === "committed") {
        if (!this.validOutcome(field, result.outcome))
          throw Error("invalid outcome");
        await this.committed(field, result.outcome, token);
      } else field.intent.lookupUnknown = true;
    } catch {
      field.error = "操作結果を確認できません。同じ要求を保持しています。";
      field.intent.lookupUnknown = false;
    }
    this.session.notify();
  }
  async retry(key: string) {
    const field = this.session.state.fields.get(key);
    if (field?.status === "unknown" && field.intent?.lookupUnknown) {
      field.intent.lookupUnknown = false;
      await this.send(field);
    }
  }
  async refreshLatest(key: string) {
    const field = this.session.state.fields.get(key);
    if (!field) return;
    await this.refreshLatestField(field);
    this.session.notify();
  }
  private latestRequests = new WeakMap<ComparisonField, number>();
  private async refreshLatestField(field: ComparisonField) {
    const token = this.session.token();
    const generation = (this.latestRequests.get(field) ?? 0) + 1;
    this.latestRequests.set(field, generation);
    const current = () => this.session.accepts(token) && this.latestRequests.get(field) === generation;
    field.latest = undefined;
    field.readbackState = "loading";
    try {
      const latest = await this.latest(field);
      if (!current()) return;
      field.latest = latest;
      this.session.setReferenceAvailability(field, true, token);
      field.readbackState = "ready";
      field.error = "";
    } catch (error) {
      if (!current()) return;
      if (error instanceof ClientFailure && error.code === "not_found" && error.status === 404)
        this.session.setReferenceAvailability(field, false, token);
      field.latest = undefined;
      field.readbackState = "error";
      field.error = field.status === "committed"
        ? "保存成功。最新の取得に失敗しました。再保存せず取得を再試行してください。"
        : "最新を取得できません。保持入力は変更していません。";
    }
  }
  rebase(key: string) {
    const field = this.session.state.fields.get(key);
    if (!field?.latest || field.status !== "conflict" || !this.session.isFieldAvailable(field))
      throw Error("最新を確認してください。");
    field.baseVersion = field.latest.version;
    field.baseValue = field.latest.value;
    field.intent = undefined;
    field.outcome = undefined;
    field.status = "editing";
    field.error = "";
    this.session.state.inputGeneration++;
    this.session.notify();
  }
}
