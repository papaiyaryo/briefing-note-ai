"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "../workspace/WorkspaceShell";
import { ConfirmDialog } from "../workspace/ConfirmDialog";
import type {
  BoardSnapshot,
  ComparisonSelection,
  MemoSummary,
} from "../../lib/workspace/contracts";
import { ComparisonClient } from "../../lib/companyComparison/client";
import { ComparisonSession } from "../../lib/companyComparison/session";
import { ComparisonEdits } from "../../lib/companyComparison/edits";
import { ClientFailure } from "../../lib/workspace/client";
import { exportComparison } from "../../lib/companyComparison/export";
import { downloadMarkdownFile } from "../../lib/download";
import { useComparisonRevision } from "./ComparisonSessionProvider";
import { ComparisonTable } from "./ComparisonTable";
import { ComparisonFieldEditor, hasCommittedOutcome, fieldReadError } from "./ComparisonFieldEditor";
interface MemoPage {
  items: MemoSummary[];
  nextCursor: string | null;
  loading: boolean;
  error: string;
}
export function ServerCompanyComparison({
  session,
  client: provided,
}: {
  session: ComparisonSession;
  client?: ComparisonClient;
}) {
  const workspace = useWorkspace(),
    client = useMemo(
      () => provided ?? new ComparisonClient(workspace.client),
      [provided, workspace.client],
    );
  useComparisonRevision(session);
  const edits = useMemo(
    () => new ComparisonEdits(session, client),
    [session, client],
  );
  const [board, setBoard] = useState<BoardSnapshot | null>(null),
    [boardState, setBoardState] = useState("loading"),
    [pages, setPages] = useState<Record<string, MemoPage>>({}),
    [error, setError] = useState(""),
    [pending, setPending] = useState<ComparisonSelection[] | null>(null);
  const compareAbort = useRef<AbortController | null>(null),
    boardAbort = useRef<AbortController | null>(null),
    pageRequests = useRef(new Map<string, number>());
  const loadBoard = useCallback(async (signal?: AbortSignal) => {
    const token = session.token();
    setBoardState("loading");
    try {
      const value = await client.readBoard(signal);
      if (session.acceptsOwner(token)) {
        setBoard(value);
        setBoardState("ready");
      }
    } catch {
      if (session.acceptsOwner(token) && !signal?.aborted)
        setBoardState("error");
    }
  }, [client, session]);
  const refresh = useCallback(async () => {
    compareAbort.current?.abort();
    if (!session.state.selected.length) return;
    const abort = new AbortController();
    compareAbort.current = abort;
    const token = session.beginRequest(),
      selected = structuredClone(session.state.selected);
    session.state.message = "";
    try {
      session.install(
        await client.readComparison(selected, abort.signal),
        token,
      );
    } catch (error) {
      if (session.accepts(token) && !abort.signal.aborted) {
        if (error instanceof ClientFailure && error.code === "not_found" && error.status === 404) {
          session.invalidateReferences(token);
          session.state.message = "選択した参照に対象なし／利用不可があります。選択と保持入力は残しています。各欄の最新確認または参照の再選択を行ってください。古い参照・出力不可。";
        } else {
          session.state.status = "error";
          session.state.message = "比較参照の取得に失敗しました。古い参照からは出力できません。";
        }
        session.notify();
      }
    }
  }, [client, session]);
  useEffect(() => {
    session.setOwner(workspace.userId);
    setBoard(null);
    setPages({});
    pageRequests.current.clear();
    const abort = new AbortController();
    boardAbort.current = abort;
    void loadBoard(abort.signal);
    if (session.state.selected.length) void refresh();
    return () => {
      abort.abort();
      compareAbort.current?.abort();
    };
  }, [workspace.userId, client, session, loadBoard, refresh]);
  const loadMemos = async (companyId: string, next = false) => {
    const token = session.token(),
      generation = (pageRequests.current.get(companyId) ?? 0) + 1;
    pageRequests.current.set(companyId, generation);
    const previous = pages[companyId];
    setPages((old) => ({
      ...old,
      [companyId]: {
        items: previous?.items ?? [],
        nextCursor: previous?.nextCursor ?? null,
        loading: true,
        error: "",
      },
    }));
    try {
      const page = await client.readMemos(
        companyId,
        next ? (previous?.nextCursor ?? undefined) : undefined,
        boardAbort.current?.signal,
      );
      if (
        !session.acceptsOwner(token) ||
        pageRequests.current.get(companyId) !== generation
      )
        return;
      setPages((old) => {
        const items = next
          ? [...(old[companyId]?.items ?? []), ...page.items]
          : page.items;
        return {
          ...old,
          [companyId]: {
            items: [
              ...new Map(items.map((item) => [item.memoId, item])).values(),
            ],
            nextCursor: page.nextCursor,
            loading: false,
            error: "",
          },
        };
      });
    } catch {
      if (
        session.acceptsOwner(token) &&
        pageRequests.current.get(companyId) === generation
      )
        setPages((old) => ({
          ...old,
          [companyId]: {
            ...old[companyId],
            loading: false,
            error:
              "メモ候補の取得に失敗しました。取得済みの件数を全件とみなさず再取得してください。",
          },
        }));
    }
  };
  const applySelection = async (
    selected: ComparisonSelection[],
    confirmed = false,
  ) => {
    try {
      if (!session.select(selected, confirmed ? () => true : undefined)) {
        setPending(selected);
        return;
      }
      setError("");
      await refresh();
    } catch {
      setError(
        "比較は異なる企業を1〜20社、各社1メモで選択してください。選択は変更していません。",
      );
    }
  };
  const choose = (companyId: string, memoId: string) => {
    const selected = session.state.selected,
      exists = selected.some((s) => s.companyId === companyId);
    return applySelection(
      exists
        ? selected.map((s) =>
            s.companyId === companyId ? { companyId, memoId } : s,
          )
        : [...selected, { companyId, memoId }],
    );
  };
  const state = session.state;
  return (
    <section className="min-w-0 space-y-5">
      <h2 className="text-xl font-bold">保存企業と参照メモを選択</h2>
      {boardState === "loading" && (
        <p role="status">保存企業を読み込んでいます…</p>
      )}
      {boardState === "error" && (
        <div role="alert">
          <p>保存企業の取得に失敗しました。0件とは判断していません。</p>
          <button
            data-testid="comparison-reload-board"
            className="rounded border p-2"
            onClick={() => loadBoard()}
          >
            企業候補を再取得
          </button>
        </div>
      )}
      {boardState === "ready" && board?.savedCompanyCount === 0 && (
        <p>保存企業がありません。企業ボードから登録してください。</p>
      )}
      {board && (
        <>
          <p>
            全保存企業 {board.savedCompanyCount}社（終了した企業も含む）。選択{" "}
            {state.selected.length}/20社。
            {state.selected.length === 1 &&
              "1社でも比較できます。企業を追加できます。"}
          </p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {board.cards.map((card) => (
              <section
                key={card.companyId}
                className="min-w-0 space-y-2 rounded border p-3"
              >
                <h3 className="break-words font-bold">{card.name}</h3>
                <p className="break-all text-xs">企業ID {card.companyId}</p>
                <p>
                  所属メモ全 {card.memoCount}件
                  {["withdrawn", "rejected"].includes(card.selectionStatus) &&
                    "・終了企業"}
                </p>
                <button
                  data-testid="comparison-load-memos"
                  className="rounded border p-2"
                  disabled={pages[card.companyId]?.loading}
                  onClick={() => loadMemos(card.companyId)}
                >
                  参照メモ候補を取得
                </button>
                {pages[card.companyId] && (
                  <div className="space-y-2">
                    {pages[card.companyId].loading && (
                      <p role="status">メモ候補を読み込んでいます…</p>
                    )}
                    {pages[card.companyId].error && (
                      <p role="alert">{pages[card.companyId].error}</p>
                    )}
                    {!pages[card.companyId].loading &&
                      !pages[card.companyId].error &&
                      pages[card.companyId].items.length === 0 && (
                        <p>この企業の保存メモは0件です。</p>
                      )}
                    {pages[card.companyId].items.map((m) => (
                      <label
                        key={m.memoId}
                        className="block break-all rounded border p-2"
                      >
                        <input
                          data-testid="comparison-select-memo"
                          type="radio"
                          name={`comparison-${card.companyId}`}
                          disabled={!m.hasStructuredContent}
                          checked={state.selected.some(
                            (s) =>
                              s.companyId === card.companyId &&
                              s.memoId === m.memoId,
                          )}
                          onChange={() => choose(card.companyId, m.memoId)}
                        />{" "}
                        {card.name} / メモ {m.memoId} / 更新 {m.updatedAt}
                        {!m.hasStructuredContent &&
                          "・構造化項目なし（本文から自動生成しません）"}
                      </label>
                    ))}
                    {pages[card.companyId].nextCursor && (
                      <button
                        data-testid="comparison-more-memos"
                        className="rounded border p-2"
                        disabled={pages[card.companyId].loading}
                        onClick={() => loadMemos(card.companyId, true)}
                      >
                        次のメモ候補を取得
                      </button>
                    )}
                    <p className="text-sm">
                      取得済み {pages[card.companyId].items.length}件 / 所属全{" "}
                      {card.memoCount}件
                    </p>
                  </div>
                )}
                {state.selected.some((s) => s.companyId === card.companyId) && (
                  <button
                    data-testid="comparison-remove-company"
                    className="rounded border p-2"
                    onClick={() =>
                      applySelection(
                        state.selected.filter(
                          (s) => s.companyId !== card.companyId,
                        ),
                      )
                    }
                  >
                    この企業を比較から外す
                  </button>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {state.restorationRequired && (
        <section className="rounded border border-amber-400 p-3">
          <p>
            同じ本人の一時入力・送信意図を保持しています。最新参照を取得して確認し、明示復旧してください。
          </p>
          <button
            data-testid="comparison-restore-refresh"
            className="rounded border p-2"
            onClick={refresh}
          >
            最新参照を取得
          </button>
          <button
            data-testid="comparison-restore"
            className="rounded border p-2"
            disabled={!state.snapshot || state.status !== "ready"}
            onClick={() => session.recover()}
          >
            最新を確認し保持入力を復旧
          </button>
        </section>
      )}
      {state.status === "no-selection" && (
        <p role="status">
          比較対象が選択されていません。各企業から構造化メモを1つ選択してください。
        </p>
      )}
      {state.status === "loading" && (
        <p role="status">選択全体の比較参照を読み込んでいます…</p>
      )}
      {state.selected.length > 0 && (
        <button
          data-testid="comparison-refresh"
          className="rounded border p-2"
          disabled={state.status === "loading"}
          onClick={refresh}
        >
          比較参照を再取得
        </button>
      )}
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
      {state.snapshot && !state.restorationRequired && (
        <>
          <p role="status">
            {state.status === "ready"
              ? "選択した保存版の比較"
              : "古い参照・出力不可"}
          </p>
          <ComparisonTable snapshot={state.snapshot} />
          <h2 className="text-xl font-bold">
            企業志望度・選択メモの比較理由（独立保存）
          </h2>
          {state.snapshot.sources.map((source) => (
            <section key={source.company.companyId} className="space-y-3">
              <h3 className="font-bold">{source.company.name}</h3>
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                {(["interest", "reason"] as const).map((kind) => (
                  <ComparisonFieldEditor
                    key={kind}
                    session={session}
                    edits={edits}
                    fieldKey={session.ensureField(source, kind)}
                    onSaved={refresh}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
      {[...state.fields.values()].some(field => field.intent) && (
        <section className="space-y-3 rounded border p-3">
          <h2 className="text-xl font-bold">保持中の保存操作（選択・参照の有無とは独立）</h2>
          <p>同じ本人の操作です。参照が削除された場合も、同IDの結果照会から続けられます。自動再送しません。</p>
          {[...state.fields.entries()].filter(([,field]) => field.intent).map(([key,field]) => (
            <section key={key} className="break-words rounded border p-2">
              <p className="break-all">{field.kind === "interest" ? "企業志望度" : "メモ比較理由"} / 企業 {field.companyId} {field.memoId && ` / メモ ${field.memoId}`}</p>
              <p role="status">{field.status === "unknown" ? "結果不明・同じ要求を保持" : field.status === "saving" ? "送信中・移動は取消しではありません" : hasCommittedOutcome(field) ? "保存成功・確定結果を保持" : "拒否・競合または確定結果未確認・入力を保持"}</p>
              {!session.isFieldAvailable(field) && <p role="status">対象なし／利用不可。新規保存・基準更新は停止し、送信済み操作の結果照会は利用できます。</p>}
              {field.status === "unknown" && <>
                <button data-testid="comparison-retained-lookup" className="rounded border p-2" onClick={async () => { await edits.lookup(key); }}>操作結果を同IDで確認</button>
                <button data-testid="comparison-retained-retry" className="rounded border p-2" disabled={!field.intent?.lookupUnknown || state.restorationRequired} onClick={async () => { await edits.retry(key); }}>同じ要求・同じIDで再試行</button>
              </>}
              {hasCommittedOutcome(field) && field.outcome && <p className="break-all">前回確定操作 {field.outcome.operationId} / 版 {field.outcome.resultingVersion}</p>}
              {field.readbackState === "error" && <p>{hasCommittedOutcome(field) ? "保存成功。最新の取得に失敗しました。再保存せず最新確認を行ってください。" : "最新の取得に失敗しました。保持入力と保存状態は変更していません。"}</p>}
              {field.error && <p role="alert">{fieldReadError(field)}</p>}
            </section>
          ))}
        </section>
      )}
      <section className="space-y-2">
        <h2 className="text-xl font-bold">比較Markdown</h2>
        <p>
          出力ごとに全企業・メモの保存版を確認します。未保存や結果不明の間は出力できません。
        </p>
        <button
          data-testid="comparison-export"
          className="rounded border p-3 disabled:opacity-50"
          disabled={
            state.status !== "ready" ||
            session.hasUnsaved() ||
            state.restorationRequired ||
            state.exportStatus === "checking"
          }
          onClick={() =>
            exportComparison(session, client, downloadMarkdownFile)
          }
        >
          保存版を確認して比較.mdを出力
        </button>
        {session.hasUnsaved() && (
          <p>
            未保存入力は各欄で保存するか明示破棄、未確定要求は同ID照会で解決してください。
          </p>
        )}
        {session.hasDirty() && (
          <button
            data-testid="comparison-discard-fields"
            className="rounded border p-2"
            onClick={() => {
              if (
                window.confirm(
                  "未送信の追加入力を破棄しますか。送信済みの意図は保持します。",
                )
              )
                session.discard();
            }}
          >
            未送信の追加入力を明示破棄
          </button>
        )}
      </section>
      {pending && (
        <ConfirmDialog
          title="未保存の追加入力を破棄して参照を変更しますか"
          description="送信済み意図・結果不明は同じ本人のメモリに保持し、サーバー処理を取消しません。取消なら選択と入力を保持します。"
          confirmLabel="追加入力を破棄して変更"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const selected = pending;
            setPending(null);
            void applySelection(selected, true);
          }}
        />
      )}
    </section>
  );
}
