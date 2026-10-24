"use client";
import React, { useEffect, useRef, useState } from "react";
import type {
  MutationOutcome,
  OperationLookup,
} from "../../lib/workspace/contracts";
import { ClientFailure, type FixedRequest } from "../../lib/workspace/client";
import { RequestGeneration, workspaceDrafts } from "../../lib/workspace/draft";
import { useWorkspace } from "./WorkspaceShell";
export function useMutation(
  target: string,
  onCommitted: (
    outcome: MutationOutcome,
    request: FixedRequest,
  ) => Promise<void>,
) {
  const { client } = useWorkspace();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [mayRetry, setMayRetry] = useState(false),
    [uncertain, setUncertain] = useState(!!workspaceDrafts.pending(target));
  const generation = useRef(new RequestGeneration());
  useEffect(() => {
    const requests = generation.current;
    return () => requests.invalidate();
  }, []);
  const committed = async (outcome: MutationOutcome, request: FixedRequest) => {
    workspaceDrafts.resolve(target);
    setUncertain(false);
    setMayRetry(false);
    setMessage("保存は確定しました。最新を取得しています。");
    try {
      await onCommitted(outcome, request);
      setMessage("確定した内容を取得しました。");
    } catch (error) {
      setMessage(
        `保存は確定しました。${error instanceof Error ? error.message : "最新を取得できません。再取得してください。"}`,
      );
    }
  };
  const send = async (request: FixedRequest) => {
    if (busy) return;
    const token = generation.current.next();
    workspaceDrafts.markPending(target, request);
    setBusy(true);
    setMayRetry(false);
    try {
      const outcome = await client.send<MutationOutcome>(request, token.signal);
      if (generation.current.accepts(token)) await committed(outcome, request);
    } catch (error) {
      if (!generation.current.accepts(token)) return;
      const unknown = error instanceof ClientFailure && error.unknown;
      if (unknown) setUncertain(true);
      else if (error instanceof ClientFailure) workspaceDrafts.resolve(target);
      setMessage(
        error instanceof Error ? error.message : "操作結果を確認できません。",
      );
    } finally {
      if (generation.current.accepts(token)) setBusy(false);
    }
  };
  const begin = async (
    path: string,
    method: "POST" | "PATCH",
    body: unknown,
  ) => {
    if (workspaceDrafts.pending(target)) {
      setUncertain(true);
      setMessage("先に結果不明の操作を確認してください。");
      return;
    }
    await send(client.prepare(path, method, body));
  };
  const lookup = async () => {
    const fixed = workspaceDrafts.pending(target);
    if (!fixed || busy) return;
    setBusy(true);
    const token = generation.current.next();
    try {
      const operationId = JSON.parse(fixed.body).operationId;
      const result = await client.get<OperationLookup>(
        `/api/v1/operations/${operationId}`,
        token.signal,
      );
      if (!generation.current.accepts(token)) return;
      if (result.state === "committed") await committed(result.outcome, fixed);
      else {
        setMayRetry(true);
        setMessage("結果はまだ不明です。同じ要求を明示的に再試行できます。");
      }
    } catch (error) {
      if (generation.current.accepts(token))
        setMessage(
          error instanceof Error ? error.message : "結果を確認できません。",
        );
    } finally {
      if (generation.current.accepts(token)) setBusy(false);
    }
  };
  return {
    busy,
    begin,
    panel: (
      <div aria-live="polite">
        {message && <p role={uncertain ? "alert" : "status"}>{message}</p>}
        {uncertain && (
          <>
            <button type="button" disabled={busy} onClick={lookup}>
              操作結果を確認
            </button>
            <button
              type="button"
              disabled={busy || !mayRetry}
              onClick={() => {
                const fixed = workspaceDrafts.pending(target);
                if (fixed) void send(fixed);
              }}
            >
              同じ要求を再試行
            </button>
          </>
        )}
      </div>
    ),
  };
}
