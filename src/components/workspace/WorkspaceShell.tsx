"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { getSession, logout } from "../../lib/authClient";
import {
  WorkspaceClient,
  advanceAuthGeneration,
} from "../../lib/workspace/client";
import { RequestGeneration, workspaceDrafts } from "../../lib/workspace/draft";
import { LoginForm } from "./LoginForm";
import { ConfirmDialog } from "./ConfirmDialog";
import { useOptionalComparisonSession } from "../compare/ComparisonSessionProvider";
const Context = createContext<{
  userId: string;
  client: WorkspaceClient;
} | null>(null);
export const useWorkspace = () => {
  const context = useContext(Context);
  if (!context) throw new Error("本人のログインが必要です。");
  return context;
};
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const comparison = useOptionalComparisonSession();
  const [userId, setUserId] = useState<string | null>(null),
    [checking, setChecking] = useState(true),
    [error, setError] = useState(""),
    [navigation, setNavigation] = useState<(() => void) | null>(null);
  const allowNavigation = useRef(false);
  const requests = useRef(new RequestGeneration());
  const client = useRef(new WorkspaceClient());
  useEffect(() => {
    const generation = requests.current,
      token = generation.next();
    const invalidate = () => {
      generation.invalidate();
      workspaceDrafts.switchOwner(null);
      comparison?.setOwner(null);
      setUserId(null);
      setChecking(false);
    };
    window.addEventListener("workspace:unauthenticated", invalidate);
    getSession()
      .then((value) => {
        if (generation.accepts(token)) {
          advanceAuthGeneration();
          workspaceDrafts.switchOwner(value.userId);
          comparison?.setOwner(value.userId);
          setUserId(value.userId);
        }
      })
      .catch((error) => {
        if (generation.accepts(token)) {
          comparison?.setOwner(null);
          setError(
            error?.status === 401
              ? ""
              : error instanceof Error
                ? error.message
                : "認証を確認できません。",
          );
        }
      })
      .finally(() => {
        if (generation.accepts(token)) setChecking(false);
      });
    return () => {
      generation.invalidate();
      window.removeEventListener("workspace:unauthenticated", invalidate);
    };
  }, [comparison]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (workspaceDrafts.hasDirty() || comparison?.hasUnsaved()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      if (
        allowNavigation.current ||
        !(workspaceDrafts.hasDirty() || comparison?.hasUnsaved()) ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.href === window.location.href ||
        url.hash
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setNavigation(() => () => {
        allowNavigation.current = true;
        anchor.click();
        queueMicrotask(() => {
          allowNavigation.current = false;
        });
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [comparison]);
  const doLogout = async () => {
    advanceAuthGeneration();
    requests.current.invalidate();
    workspaceDrafts.switchOwner(null);
    comparison?.setOwner(null);
    setUserId(null);
    try {
      await logout();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "ログアウト結果を確認できません。再ログイン前に再試行してください。",
      );
    }
  };
  if (checking) return <p role="status">認証を確認しています…</p>;
  if (!userId)
    return (
      <>
        {error && <p role="alert">{error}</p>}
        <LoginForm
          onSuccess={(id) => {
            advanceAuthGeneration();
            workspaceDrafts.switchOwner(id);
            comparison?.setOwner(id);
            setUserId(id);
            setError("");
          }}
        />
      </>
    );
  return (
    <Context.Provider value={{ userId, client: client.current }}>
      <a
        data-testid="workspace-main-link"
        href="#workspace-main"
        className="sr-only focus:not-sr-only"
      >
        本文へ移動
      </a>
      <nav
        aria-label="共通ナビゲーション"
        className="mb-8 flex flex-wrap gap-4"
      >
        <Link data-testid="workspace-board-link" href="/">
          企業ボード
        </Link>
        <Link data-testid="workspace-generation-link" href="/?view=generation">
          既存の画像・メモ生成
        </Link>
        <Link data-testid="workspace-comparison-link" href="/compare">
          保存した企業を比較
        </Link>
        <button
          data-testid="workspace-logout"
          onClick={() => {
            if (workspaceDrafts.hasDirty() || comparison?.hasUnsaved())
              setNavigation(() => () => {
                void doLogout();
              });
            else void doLogout();
          }}
        >
          ログアウト
        </button>
      </nav>
      {error && <p role="alert">{error}</p>}
      <div id="workspace-main">{children}</div>
      {navigation && (
        <ConfirmDialog
          title="未保存の入力を破棄して移動しますか"
          description="この本人の未送信入力を破棄します。比較の送信済み意図・結果不明は保持します。取消で編集を続けられます。"
          confirmLabel="破棄して移動"
          onCancel={() => setNavigation(null)}
          onConfirm={() => {
            const action = navigation;
            workspaceDrafts.discardAll();
            comparison?.discard();
            setNavigation(null);
            action();
          }}
        />
      )}
    </Context.Provider>
  );
}
