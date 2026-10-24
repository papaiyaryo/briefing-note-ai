"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BoardSnapshot,
  Company,
  CompanyFields,
  DeleteSnapshot,
  Memo,
  MemoFields,
  MemoSummary,
  MutationOutcome,
  Page,
} from "../../lib/workspace/contracts";
import { RequestGeneration, workspaceDrafts } from "../../lib/workspace/draft";
import { isSafeUrl } from "../../lib/workspace/validation";
import { useWorkspace } from "./WorkspaceShell";
import { CompanyForm } from "./CompanyForm";
import { MemoEditor } from "./MemoEditor";
import { ConfirmDialog } from "./ConfirmDialog";
import { useMutation } from "./useMutation";
import { BriefingNoteFlow } from "../BriefingNoteFlow";
function DeleteControl({
  companyId,
  memoId,
  onDeleted,
}: {
  companyId: string;
  memoId: string | null;
  onDeleted: () => Promise<void>;
}) {
  const { client } = useWorkspace();
  const [snapshot, setSnapshot] = useState<DeleteSnapshot | null>(null),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const requests = useRef(new RequestGeneration());
  useEffect(() => {
    const g = requests.current;
    return () => g.invalidate();
  }, []);
  const mutation = useMutation(
    `delete:${companyId}:${memoId ?? "all"}`,
    async () => {
      setSnapshot(null);
      await onDeleted();
    },
  );
  const confirm = async () => {
    setError("");
    setReady(false);
    const token = requests.current.next();
    try {
      const value = await client.send<DeleteSnapshot>(
        client.prepare("/api/v1/deletion-confirmations", "POST", {
          companyId,
          memoId,
        }),
        token.signal,
      );
      if (requests.current.accepts(token)) {
        setSnapshot(value);
        setReady(true);
      }
    } catch (error) {
      if (requests.current.accepts(token))
        setError(
          error instanceof Error ? error.message : "削除対象を取得できません。",
        );
    }
  };
  return (
    <div className="my-4 border-t pt-4">
      <button onClick={confirm}>削除対象を確認</button>
      {error && <p role="alert">{error}</p>}
      {!snapshot && mutation.panel}
      {snapshot && (
        <ConfirmDialog
          title={`${snapshot.companyName}${memoId ? "のメモ" : ""}を削除`}
          description={`所属する削除対象メモ ${snapshot.displayedMemoCount}件\n対象版：${snapshot.targetVersion}\n有効期限：${snapshot.expiresAt}`}
          confirmLabel={`${snapshot.companyName}${memoId ? "のメモ" : ""}を削除`}
          onCancel={() => {
            setSnapshot(null);
            setReady(false);
          }}
          busy={mutation.busy}
          onConfirm={() => {
            if (!ready) return;
            setReady(false);
            void mutation.begin("/api/v1/deletions", "POST", {
              operationId: crypto.randomUUID(),
              confirmationId: snapshot.confirmationId,
            });
          }}
        >
          <p>確認後に内容が変わった場合は削除できません。</p>
          {mutation.panel}
          {!ready && !mutation.busy && (
            <button onClick={confirm}>最新の対象を取得して再確認</button>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
function MemoWorkspace({
  companyId,
  memo,
  onSaved,
  onClose,
}: {
  companyId: string;
  memo: Memo | null;
  onSaved: (outcome: MutationOutcome) => Promise<void>;
  onClose: () => void;
}) {
  const { client } = useWorkspace();
  const target = `memo:${companyId}:${memo?.memoId ?? "new"}`;
  const [, refreshDraft] = useState(0);
  const mutation = useMutation(target, async (outcome, request) => {
    const fresh = await client.get<Memo>(
      `/api/v1/companies/${companyId}/memos/${outcome.memoId}`,
    );
    const sent = JSON.parse(request.body);
    workspaceDrafts.reconcile(
      target,
      { ...fresh },
      fresh.version,
      sent.changes ?? sent.candidate,
      `memo:${companyId}:${outcome.memoId}`,
    );
    await onSaved(outcome);
  });
  const draft = workspaceDrafts.get(target);
  const retained = draft?.value as MemoFields | undefined;
  return (
    <>
      <MemoEditor
        initial={memo ?? undefined}
        retained={retained}
        needsRebase={!!memo && !!draft && draft.baseVersion !== memo.version}
        busy={mutation.busy}
        onChange={(fields) => {
          workspaceDrafts.put(target, fields, memo?.version ?? "new");
          refreshDraft((n) => n + 1);
        }}
        onCancel={onClose}
        onSave={async (changes) => {
          const current = workspaceDrafts.get(target);
          if (memo && current && current.baseVersion !== memo.version) return;
          if (memo)
            await mutation.begin(
              `/api/v1/companies/${companyId}/memos/${memo.memoId}`,
              "PATCH",
              {
                operationId: crypto.randomUUID(),
                expectedVersion: memo.version,
                changes,
              },
            );
          else
            await mutation.begin(
              `/api/v1/companies/${companyId}/memos`,
              "POST",
              {
                operationId: crypto.randomUUID(),
                memoId: crypto.randomUUID(),
                candidate: {
                  origin: "manual",
                  providerOrigin: null,
                  markdown: "",
                  structuredContent: null,
                  correctedOcr: null,
                  event: null,
                  adoptedWebSources: [],
                  comparisonReason: null,
                  ...changes,
                },
              },
            );
        }}
      />
      {mutation.panel}
    </>
  );
}
export function CompanyDetail({ companyId }: { companyId: string }) {
  const { client, userId } = useWorkspace(),
    router = useRouter();
  const [company, setCompany] = useState<Company | null>(null),
    [generating, setGenerating] = useState(false),
    [page, setPage] = useState<Page<MemoSummary> | null>(null),
    [count, setCount] = useState<number | null>(null),
    [selected, setSelected] = useState<Memo | null | undefined>(undefined),
    [error, setError] = useState(""),
    [discard, setDiscard] = useState<(() => void) | null>(null),
    [revision, setRevision] = useState(0);
  const [, refreshDraft] = useState(0);
  const generation = useRef(new RequestGeneration());
  const selectedRef = useRef<Memo | null | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [company?.companyId]);
  const load = useCallback(async () => {
    const token = generation.current.next();
    setError("");
    try {
      const selectedId = selectedRef.current?.memoId;
      // 同じsessionへ読取を集中させず、必要な正本を順に取得する。
      // 途中失敗では既存表示とdraftを保持し、揃った時だけ表示を更新する。
      const c = await client.get<Company>(
        `/api/v1/companies/${companyId}`,
        token.signal,
      );
      const p = await client.get<Page<MemoSummary>>(
        `/api/v1/companies/${companyId}/memos`,
        token.signal,
      );
      const b = await client.get<BoardSnapshot>(
        "/api/v1/board?showEnded=true",
        token.signal,
      );
      const latestMemo = selectedId
        ? await client.get<Memo>(
            `/api/v1/companies/${companyId}/memos/${selectedId}`,
            token.signal,
          )
        : null;
      if (!generation.current.accepts(token)) return;
      setCompany(c);
      if (latestMemo) {
        selectedRef.current = latestMemo;
        setSelected(latestMemo);
      }
      setPage(p);
      setCount(
        b.cards.find((card) => card.companyId === companyId)?.memoCount ?? null,
      );
      setRevision((n) => n + 1);
    } catch (error) {
      if (generation.current.accepts(token))
        setError(
          error instanceof Error ? error.message : "企業を取得できません。",
        );
      throw error;
    }
  }, [client, companyId]);
  useEffect(() => {
    void load().catch(() => {});
    const requests = generation.current;
    return () => requests.invalidate();
  }, [load]);
  const companyTarget = `company:${companyId}`;
  const mutation = useMutation(companyTarget, async (_outcome, request) => {
    const fresh = await client.get<Company>(`/api/v1/companies/${companyId}`);
    workspaceDrafts.reconcile(
      companyTarget,
      { ...fresh },
      fresh.version,
      JSON.parse(request.body).changes,
    );
    await load();
  });
  const move = (action: () => void) => {
    const target =
      selected !== undefined
        ? `memo:${companyId}:${selected?.memoId ?? "new"}`
        : companyTarget;
    if (workspaceDrafts.get(target))
      setDiscard(() => () => {
        workspaceDrafts.discard(target);
        action();
      });
    else action();
  };
  const select = async (memoId: string) => {
    const token = generation.current.next();
    try {
      const value = await client.get<Memo>(
        `/api/v1/companies/${companyId}/memos/${memoId}`,
        token.signal,
      );
      if (generation.current.accepts(token)) {
        selectedRef.current = value;
        setSelected(value);
      }
    } catch (error) {
      if (generation.current.accepts(token))
        setError(
          error instanceof Error ? error.message : "メモを取得できません。",
        );
    }
  };
  if (generating && company && company.companyId !== companyId)
    return <p role="status">保存先の企業を確認しています…</p>;
  if (!company)
    return (
      <>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <p role="status">企業を取得しています…</p>
        )}
        <button onClick={() => void load().catch(() => {})}>再取得</button>
      </>
    );
  return (
    <section>
      <h1
        ref={heading}
        tabIndex={-1}
        className="break-words text-2xl font-bold"
      >
        {company.name}
      </h1>
      <div className="my-4 rounded border p-3">
        <p>次の選考日</p>
        <p className="text-[25px] font-bold">
          {company.nextSelectionDate ?? "未設定"}
        </p>
        <p>応募締切：{company.applicationDeadline ?? "未設定"}</p>
      </div>
      {company.officialUrl && isSafeUrl(company.officialUrl) && (
        <a href={company.officialUrl} target="_blank" rel="noopener noreferrer">
          公式サイト
        </a>
      )}
      {error && <p role="alert">{error}</p>}
      <button
        data-testid="workspace-refresh-latest"
        onClick={() => void load().catch(() => {})}
      >
        保存済みの最新を再取得
      </button>
      {generating ? (
        <BriefingNoteFlow
          key={`${userId}:${company.companyId}`}
          target={{
            companyId: company.companyId,
            name: company.name,
            version: company.version,
            ownerId: userId,
            client,
          }}
          onClose={() => {
            setGenerating(false);
            heading.current?.focus();
            void load().catch(() => {});
          }}
          onOpenSaved={async (memo) => {
            selectedRef.current = memo;
            setSelected(memo);
            setGenerating(false);
            await load();
          }}
        />
      ) : selected === undefined ? (
        <>
          <CompanyForm
            key={revision}
            company={company}
            retained={
              workspaceDrafts.get(companyTarget)?.value as
                | CompanyFields
                | undefined
            }
            needsRebase={
              !!workspaceDrafts.get(companyTarget) &&
              workspaceDrafts.get(companyTarget)?.baseVersion !==
                company.version
            }
            busy={mutation.busy}
            onChange={(fields) => {
              workspaceDrafts.put(companyTarget, fields, company.version);
              refreshDraft((n) => n + 1);
            }}
            onCancel={() => move(() => router.push("/"))}
            onSubmit={(fields) => {
              const current = workspaceDrafts.get(companyTarget);
              if (current && current.baseVersion !== company.version)
                return Promise.resolve();
              return mutation.begin(`/api/v1/companies/${companyId}`, "PATCH", {
                operationId: crypto.randomUUID(),
                expectedVersion: company.version,
                changes: fields,
              });
            }}
          />
          {workspaceDrafts.get(companyTarget) && (
            <p>
              保持した企業入力があります。最新を確認してから再編集してください。
            </p>
          )}
          {mutation.panel}
          <h2 className="mt-8 text-xl font-bold">
            保存メモ {count === null ? "件数未確認" : `${count}件`}
          </h2>
          <p>
            一覧の取得中に別端末で変わった場合は、再取得で最新を確認してください。
          </p>
          <button
            onClick={() =>
              move(() => {
                selectedRef.current = null;
                setSelected(null);
              })
            }
          >
            手入力メモを作成
          </button>
          <button type="button" onClick={() => move(() => setGenerating(true))}>
            画像・OCRからこの企業のメモを作成
          </button>
          <ul>
            {page?.items.map((memo) => (
              <li key={memo.memoId}>
                <button
                  onClick={() =>
                    move(() => {
                      void select(memo.memoId);
                    })
                  }
                >
                  {memo.origin === "manual"
                    ? "手入力"
                    : memo.providerOrigin === "dummy"
                      ? "検証用dummy生成"
                      : "生成"}{" "}
                  ／{" "}
                  {memo.hasStructuredContent
                    ? "構造化項目あり"
                    : "構造化項目なし"}{" "}
                  ／ {memo.updatedAt}
                </button>
              </li>
            ))}
          </ul>
          {page?.nextCursor && (
            <button
              onClick={async () => {
                const token = generation.current.next();
                try {
                  const next = await client.get<Page<MemoSummary>>(
                    `/api/v1/companies/${companyId}/memos?cursor=${encodeURIComponent(page.nextCursor!)}`,
                    token.signal,
                  );
                  if (generation.current.accepts(token))
                    setPage({
                      items: [...page.items, ...next.items],
                      nextCursor: next.nextCursor,
                    });
                } catch (error) {
                  if (generation.current.accepts(token))
                    setError(
                      error instanceof Error
                        ? error.message
                        : "次のメモを取得できません。",
                    );
                }
              }}
            >
              次のメモを取得
            </button>
          )}
          <DeleteControl
            companyId={companyId}
            memoId={null}
            onDeleted={async () => {
              workspaceDrafts.discard(companyTarget);
              router.push("/");
            }}
          />
        </>
      ) : (
        <>
          <MemoWorkspace
            key={`${selected?.memoId ?? "new"}:${revision}`}
            companyId={companyId}
            memo={selected}
            onClose={() =>
              move(() => {
                selectedRef.current = undefined;
                setSelected(undefined);
              })
            }
            onSaved={async (outcome) => {
              if (outcome.memoId) await select(outcome.memoId);
              await load();
            }}
          />
          {selected && (
            <DeleteControl
              companyId={companyId}
              memoId={selected.memoId}
              onDeleted={async () => {
                workspaceDrafts.discard(`memo:${companyId}:${selected.memoId}`);
                selectedRef.current = undefined;
                setSelected(undefined);
                await load();
              }}
            />
          )}
        </>
      )}
      {discard && (
        <ConfirmDialog
          title="未保存の入力を破棄しますか"
          description="取消で編集を続けられます。"
          confirmLabel="破棄して移動"
          onCancel={() => setDiscard(null)}
          onConfirm={() => {
            const action = discard;
            setDiscard(null);
            action();
          }}
        />
      )}
    </section>
  );
}
