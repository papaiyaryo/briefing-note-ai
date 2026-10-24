"use client";
import { useEffect, useRef, useState } from "react";
import type { GeneratedCandidate, Memo } from "../../lib/workspace/contracts";
import type { WorkspaceClient } from "../../lib/workspace/client";
import { GenerationSaveIntent } from "../../lib/generation/save";
import { generationDrafts } from "../../lib/generation/draft";
import { mapGeneratedCandidate } from "../../lib/generation/candidate";
import { RequestGeneration, workspaceDrafts } from "../../lib/workspace/draft";
import { GenerationCandidateFields } from "./GenerationCandidateFields";
export interface GenerationTarget {
  companyId: string;
  name: string;
  version: string;
  ownerId: string;
  client: WorkspaceClient;
}
export interface GenerationSavePanelProps {
  target: GenerationTarget;
  value: GeneratedCandidate;
  onChange: (value: GeneratedCandidate) => void;
  onCommitted?: (sent: GeneratedCandidate) => void;
  onOpenSaved?: (memo: Memo) => Promise<void>;
  onClose?: () => void;
  saveSession?: GenerationSaveSession;
}
/** Temporary state owned by the generation, so hiding its panel is not a new save. */
export class GenerationSaveSession {
  key: string | null = null;
  readonly intent = { current: null as GenerationSaveIntent | null };
  readonly requests = { current: new RequestGeneration() };
  readonly busy = { current: false };
  readonly announced = { current: new Set<string>() };
  state: GenerationSaveIntent["state"] = "ready";
  queried = false;
  error = "";
  readError = false;
  memo: Memo | null = null;
  readonly listeners = new Set<() => void>();
  constructor(readonly restorePending = true) {}
  publish() {
    for (const listener of this.listeners) listener();
  }
  dispose() {
    this.requests.current.invalidate();
    this.listeners.clear();
  }
}
export function GenerationSavePanel({
  target,
  value,
  onChange,
  onCommitted,
  onOpenSaved,
  onClose,
  saveSession,
}: GenerationSavePanelProps) {
  const key = `${target.ownerId}:${target.companyId}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const localSession = useRef(new GenerationSaveSession());
  const session = saveSession ?? localSession.current;
  const {
    requests,
    intent,
    busy,
    announced,
    state,
    queried,
    error,
    readError,
    memo,
  } = session;
  const [boundKey, setBoundKey] = useState(key);
  const [, redraw] = useState(0);
  const update = <
    K extends "state" | "queried" | "error" | "readError" | "memo",
  >(
    field: K,
    next: GenerationSaveSession[K],
  ) => {
    session[field] = next;
    session.publish();
  };
  const setState = (next: GenerationSaveIntent["state"]) =>
    update("state", next);
  const setQueried = (next: boolean) => update("queried", next);
  const setError = (next: string) => update("error", next);
  const setReadError = (next: boolean) => update("readError", next);
  const setMemo = (next: Memo | null) => update("memo", next);
  useEffect(() => {
    const listener = () => redraw((revision) => revision + 1);
    session.listeners.add(listener);
    if (session.key !== key) {
      requests.current.invalidate();
      busy.current = false;
      intent.current = null;
      session.key = key;
      session.state = "ready";
      session.queried = false;
      session.memo = null;
      session.error = "";
      session.readError = false;
      const pending = session.restorePending
        ? generationDrafts.pending(target.ownerId, target.companyId)
        : null;
      if (pending) {
        try {
          intent.current = GenerationSaveIntent.restore(
            target.client,
            target.companyId,
            pending,
          );
          session.state = "unknown";
        } catch {
          session.error =
            "保持した保存要求を確認できません。新しい要求を送らず再認証して確認してください。";
        }
      }
    }
    setBoundKey(key);
    listener();
    return () => {
      session.listeners.delete(listener);
      // The parent owns cancellation for a generation that outlives this panel.
      if (!saveSession) session.dispose();
    };
  }, [
    session,
    saveSession,
    key,
    target.ownerId,
    target.companyId,
    target.client,
    requests,
    busy,
    intent,
  ]);
  const accepts = (token: ReturnType<RequestGeneration["next"]>) =>
    currentKey.current === key && requests.current.accepts(token);
  const read = async (
    current: GenerationSaveIntent,
    token: ReturnType<RequestGeneration["next"]>,
  ) => {
    try {
      const fresh = await target.client.get<Memo>(
        `/api/v1/companies/${target.companyId}/memos/${current.ids.memoId}`,
        token.signal,
      );
      if (!accepts(token)) return;
      if (
        fresh.companyId !== target.companyId ||
        fresh.memoId !== current.ids.memoId
      )
        throw new Error();
      setMemo(fresh);
      setReadError(false);
    } catch {
      if (accepts(token)) {
        setMemo(null);
        setReadError(true);
      }
    }
  };
  const act = async (mode: "new" | "retry" | "lookup") => {
    if (busy.current || currentKey.current !== key) return;
    busy.current = true;
    setError("");
    const token = requests.current.next();
    try {
      if (mode === "new")
        intent.current = new GenerationSaveIntent(
          target.client,
          target.companyId,
          mapGeneratedCandidate(value),
          { operationId: crypto.randomUUID(), memoId: crypto.randomUUID() },
        );
      const current = intent.current;
      if (!current) throw new Error();
      if (mode !== "lookup")
        generationDrafts.markPending(
          target.ownerId,
          target.companyId,
          current.request,
        );
      setState(mode === "lookup" ? "verifying" : "saving");
      setQueried(false);
      if (mode === "lookup") await current.lookup(token.signal);
      else await current.save(token.signal);
      if (!accepts(token)) return;
      setState(current.state);
      if (mode === "lookup")
        setQueried(current.state === "unknown" && !current.error);
      if (current.state === "saved") {
        generationDrafts.resolve(target.ownerId, target.companyId);
        if (!announced.current.has(current.ids.operationId)) {
          announced.current.add(current.ids.operationId);
          onCommitted?.(JSON.parse(current.request.body).candidate);
        }
        await read(current, token);
      } else if (current.state === "rejected") {
        generationDrafts.resolve(target.ownerId, target.companyId);
        setError(
          "保存を完了できません。入力を保持しています。対象の存在・本人・証明・入力を確認し、必要なら再認証してください。",
        );
      }
    } catch {
      if (accepts(token))
        setError(
          "本文・日付・構造・出典・証明を確認してください。入力は保持しています。日付未確認は空欄へ明示編集できます。",
        );
    } finally {
      if (accepts(token)) {
        busy.current = false;
        session.publish();
      }
    }
  };
  let changed = false;
  if (intent.current?.state === "saved")
    try {
      changed =
        JSON.stringify(mapGeneratedCandidate(value)) !==
        JSON.stringify(JSON.parse(intent.current.request.body).candidate);
    } catch {
      changed = true;
    }
  if (boundKey !== key)
    return <p role="status">本人・企業を切り替えています…</p>;
  return (
    <section aria-label="企業への生成候補保存" className="space-y-5">
      <h2 className="text-xl font-bold">保存先：{target.name}</h2>
      <p>
        保存先の企業は固定です。生成結果の企業名で企業を追加・改名しません。
      </p>
      {value.structuredContent.overview.companyName !== target.name && (
        <p role="status">
          保存先と生成結果の企業名が異なります。内容と保存先を確認してください。
        </p>
      )}
      <p>
        {value.providerOrigin === "dummy"
          ? "検証用dummyの生成候補です。実在企業の事実として使わないでください。"
          : "生成候補です。出自証明は内容の正確さを保証しません。"}
      </p>
      <GenerationCandidateFields
        value={value}
        onChange={onChange}
        disabled={state === "saving" || state === "verifying"}
      />
      {error && <p role="alert">{error}</p>}
      {(state === "ready" || state === "rejected") && (
        <button
          type="button"
          onClick={() => act("new")}
          disabled={busy.current}
        >
          この企業へ保存
        </button>
      )}
      {(state === "saving" || state === "verifying") && (
        <p role="status">
          {state === "saving" ? "保存しています…" : "操作結果を確認しています…"}
        </p>
      )}
      {state === "unknown" && (
        <div role="status" className="space-y-3 rounded border p-3">
          <p>
            保存結果が不明です。未実行とは断定できません。操作結果を確認してから、同じ送信内容・IDで明示再試行できます。現在の編集をその要求へ混ぜません。
          </p>
          <button type="button" onClick={() => act("lookup")}>
            操作結果を確認
          </button>
          <button
            type="button"
            disabled={!queried}
            onClick={() => (queried ? act("retry") : undefined)}
          >
            同じ要求を再試行
          </button>
        </div>
      )}
      {state === "saved" && (
        <div role="status" className="space-y-3 rounded border p-3">
          <p>保存は確定しました。</p>
          {readError && (
            <p>
              保存済みメモの再取得に失敗しました。保存成功は維持しています。
            </p>
          )}
          {changed && (
            <p>
              送信後の未保存編集が残っています。同じ保存メモを開く際に保持入力として移し、明示的に再編集できます。
            </p>
          )}
          {readError && (
            <button
              type="button"
              onClick={async () => {
                const token = requests.current.next();
                if (intent.current) await read(intent.current, token);
              }}
            >
              保存メモを再取得
            </button>
          )}
          {memo && onOpenSaved && (
            <button
              type="button"
              onClick={async () => {
                if (changed) {
                  workspaceDrafts.switchOwner(target.ownerId);
                  workspaceDrafts.put(
                    `memo:${target.companyId}:${memo.memoId}`,
                    {
                      markdown: value.markdown,
                      structuredContent: value.structuredContent,
                      correctedOcr: value.correctedOcr,
                      event: value.event,
                      adoptedWebSources: value.adoptedWebSources,
                      comparisonReason: value.comparisonReason,
                    },
                    intent.current?.outcome?.resultingVersion ?? memo.version,
                  );
                }
                await onOpenSaved(memo);
              }}
            >
              保存メモを開く
            </button>
          )}
        </div>
      )}
      {onClose && (
        <button type="button" disabled={busy.current} onClick={onClose}>
          この生成を終了
        </button>
      )}
    </section>
  );
}
