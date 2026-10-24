import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompanyBoard } from "../../src/components/workspace/CompanyBoard";
import { CompanyForm } from "../../src/components/workspace/CompanyForm";
import { MemoEditor } from "../../src/components/workspace/MemoEditor";
import { LoginForm } from "../../src/components/workspace/LoginForm";
import { WorkspaceShell } from "../../src/components/workspace/WorkspaceShell";
import { ConfirmDialog } from "../../src/components/workspace/ConfirmDialog";
import { buildBoardSnapshot } from "../../src/lib/workspace/board";
import { emptyStructure, manualCandidate, id } from "./fixtures";
import type { CompanyCard, Memo } from "../../src/lib/workspace/contracts";
const render = renderToStaticMarkup;
const card = (
  status: CompanyCard["selectionStatus"] = "not_applied",
): CompanyCard => ({
  companyId: id(),
  name: "架空の企業",
  industry: null,
  interestLevel: null,
  selectionStatus: status,
  nextSelectionDate: "2026-11-01",
  applicationDeadline: "2026-10-31",
  version: id(),
  updatedAt: new Date().toISOString(),
  memoCount: 3,
});
const memo = (structured = false): Memo => ({
  ...manualCandidate(),
  ...(structured ? { structuredContent: emptyStructure() } : {}),
  memoId: id(),
  companyId: id(),
  version: id(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
describe("accessible workspace static states", () => {
  it("shows six normal groups and distinct next selection date", () => {
    const html = render(
      <CompanyBoard
        snapshot={buildBoardSnapshot([card()], false, "snapshot")}
      />,
    );
    expect(html).toContain("次の選考日");
    expect(html).toContain("2026-11-01");
    expect(html).toContain("応募締切");
    expect(html).toContain("2026-10-31");
    expect(html).not.toContain('data-status="withdrawn"');
    expect(html).toContain('aria-controls="company-columns"');
  });
  it("separates no saved companies from no visible companies", () => {
    const empty = render(
      <CompanyBoard snapshot={buildBoardSnapshot([], false, "s")} />,
    );
    const hidden = render(
      <CompanyBoard
        snapshot={buildBoardSnapshot([card("withdrawn")], false, "s")}
      />,
    );
    expect(empty).toContain("企業はまだ保存されていません");
    expect(hidden).toContain("表示対象の企業がありません");
  });
  it("failure is never shown as zero saved", () => {
    const html = render(<CompanyBoard error="取得できません" />);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("企業はまだ保存されていません");
  });
  it("ended toggle includes eight accessible groups", () => {
    const html = render(
      <CompanyBoard
        snapshot={buildBoardSnapshot([card("withdrawn")], true, "s")}
      />,
    );
    expect(html).toContain('data-status="withdrawn"');
    expect(html).toContain('data-status="rejected"');
  });
  it("fifteen active companies produce text warning without disabling registration", () => {
    const html = render(
      <CompanyBoard
        snapshot={buildBoardSnapshot(
          Array.from({ length: 15 }, () => card("applied")),
          false,
          "s",
        )}
      />,
    );
    expect(html).toContain("15社以上");
    expect(html).toContain("企業を登録");
  });
  it("company fields have labels and all eight statuses", () => {
    const html = render(<CompanyForm />);
    expect(html).toContain("企業名");
    expect(html).toContain("企業の志望度");
    expect(html).toContain("個人メモ");
    expect(html).toContain('value="rejected"');
    expect(html).toContain('type="date"');
  });
  it("manual memo offers explicit structured fields without inventing facts", () => {
    const html = render(<MemoEditor initial={memo()} />);
    expect(html).toContain("比較用項目を追加");
    expect(html).toContain("構造化項目なし");
    expect(html).toContain("本文を保存");
    expect(html).toContain('role="tablist"');
  });
  it("structured memo preserves every independent information category", () => {
    const html = render(<MemoEditor initial={memo(true)} />);
    for (const label of [
      "説明会の事実",
      "個人の感想",
      "人事・社員の強調点",
      "追加質問",
      "ES・面接材料",
      "Web補足",
      "比較理由",
    ])
      expect(html).toContain(label);
    expect(html).toContain("比較用項目を保存");
  });
  it("preview escapes HTML and preserves editable Markdown", () => {
    const value = {
      ...memo(),
      markdown: '<script>alert("x")</script>\n本人のメモ',
    };
    const html = render(<MemoEditor initial={value} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Markdownを出力");
  });
  it("login never offers public signup or a secret-key product form", () => {
    const html = render(<LoginForm />);
    expect(html).toContain('type="password"');
    expect(html).toContain("本人ログイン");
    expect(html).not.toContain("service_role");
    expect(html).not.toContain("新規登録");
  });
  it("shell hides protected children during authentication check", () => {
    const html = render(
      <WorkspaceShell>
        <p>private-marker</p>
      </WorkspaceShell>,
    );
    expect(html).not.toContain("private-marker");
    expect(html).toContain("認証を確認");
  });
  it("deletion dialog exposes exact target and count with cancellation", () => {
    const html = render(
      <ConfirmDialog
        title="架空企業を削除"
        description="所属メモ3件を削除します"
        confirmLabel="架空企業を削除"
      />,
    );
    expect(html).toContain("所属メモ3件");
    expect(html).toContain("取消");
    expect(html).toContain("dialog");
  });
});
