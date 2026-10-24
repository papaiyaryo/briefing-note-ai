"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardSnapshot } from "../../lib/workspace/contracts";
import { RequestGeneration, workspaceDrafts } from "../../lib/workspace/draft";
import { useWorkspace } from "./WorkspaceShell";
import { CompanyBoard } from "./CompanyBoard";
import { ConfirmDialog } from "./ConfirmDialog";
import { useMutation } from "./useMutation";
import { BriefingNoteFlow } from "../BriefingNoteFlow";
export function WorkspaceHome({
  view = "board",
}: {
  view?: "board" | "generation";
}) {
  const { client } = useWorkspace(),
    router = useRouter();
  const [snapshot, setSnapshot] = useState<BoardSnapshot>(),
    [showEnded, setShowEnded] = useState(false),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [name, setName] = useState(""),
    [discard, setDiscard] = useState(false);
  const generation = useRef(new RequestGeneration());
  const load = useCallback(async () => {
    const token = generation.current.next();
    try {
      const result = await client.get<BoardSnapshot>(
        `/api/v1/board?showEnded=${showEnded}`,
        token.signal,
      );
      if (generation.current.accepts(token)) {
        setSnapshot(result);
        setError("");
      }
    } catch (error) {
      if (generation.current.accepts(token))
        setError(
          error instanceof Error ? error.message : "企業を取得できません。",
        );
    }
  }, [client, showEnded]);
  useEffect(() => {
    void load();
    const requests = generation.current;
    return () => requests.invalidate();
  }, [load]);
  const mutation = useMutation("company:new", async (outcome) => {
    workspaceDrafts.discard("company:new");
    setCreating(false);
    router.push(`/companies/${outcome.companyId}`);
  });
  if (view === "generation") return <BriefingNoteFlow />;
  return (
    <>
      <CompanyBoard
        snapshot={snapshot}
        error={error}
        onToggle={() => setShowEnded((value) => !value)}
        onOpen={(id) => router.push(`/companies/${id}`)}
        onCreate={() => {
          setCreating(true);
          const retained = workspaceDrafts.get("company:new")?.value as
            | { name: string }
            | undefined;
          if (retained) setName(retained.name);
        }}
      />
      {error && <button onClick={() => void load()}>再取得</button>}
      {!creating && mutation.panel}
      {creating && (
        <ConfirmDialog
          title="企業を登録"
          description="企業名だけで登録できます。任意項目は登録後に編集できます。"
          confirmLabel="登録"
          initialFocus="first-input"
          busy={mutation.busy}
          onCancel={() => {
            if (name.trim()) setDiscard(true);
            else setCreating(false);
          }}
          onConfirm={() => {
            if (!name.trim()) {
              setError("企業名を入力してください。");
              return;
            }
            void mutation.begin("/api/v1/companies", "POST", {
              operationId: crypto.randomUUID(),
              companyId: crypto.randomUUID(),
              fields: { name },
            });
          }}
        >
          {mutation.panel}
          {error && <p role="alert">{error}</p>}
          <label>
            企業名
            <input
              className="block w-full border p-2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                workspaceDrafts.put(
                  "company:new",
                  { name: e.target.value },
                  "new",
                );
              }}
            />
          </label>
          {discard && (
            <div role="alert">
              <p>未保存の企業名を破棄しますか。</p>
              <button onClick={() => setDiscard(false)}>編集に戻る</button>
              <button
                onClick={() => {
                  workspaceDrafts.discard("company:new");
                  setName("");
                  setDiscard(false);
                  setCreating(false);
                }}
              >
                破棄して閉じる
              </button>
            </div>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
