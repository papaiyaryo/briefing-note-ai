"use client";
import React, { useState } from "react";
import { login } from "../../lib/authClient";
export function LoginForm({
  onSuccess = () => {},
}: {
  onSuccess?: (userId: string) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="mx-auto max-w-md space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          const result = await login(email, password);
          setPassword("");
          onSuccess(result.userId);
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "ログインできません。",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 tabIndex={-1} className="text-2xl font-bold">
        本人ログイン
      </h1>
      <p>保存した企業・メモは本人のログイン後に表示します。</p>
      <label className="block">
        メールアドレス
        <input
          className="block w-full border p-2"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="login-email"
        />
      </label>
      <label className="block">
        パスワード
        <input
          className="block w-full border p-2"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="login-password"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} type="submit" data-testid="login-submit">
        {busy ? "確認中…" : "ログイン"}
      </button>
    </form>
  );
}
