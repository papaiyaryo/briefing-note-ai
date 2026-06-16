# Issue #29 設計: E2E テスト方針を整理する

対象 GitHub Issue: #29(`docs/generated-issues/05-03-e2e-テスト方針を整理する.md`)
Phase: 5 / 優先度: Medium / 実装順: **3 番目**
依存: Phase 4 MVP フロー、#27・#28(単体テストの整備状況を踏まえて方針を書く)

## Issue 概要

アップロードからダウンロードまでの MVP フローを、将来 E2E テストで確認する方針を文書として整理する。
本 Issue では **実装は行わず、方針整理のみ**(Issue の Out of Scope に明記)。

## スコープ

- E2E で確認すべき対象フローを整理する。
- Playwright 等の候補を比較する。
- 外部 API なしで実行する方針を決める。

## スコープ外

- E2E テストの実装。
- 外部 API を使うテスト。

## 共有設計判断(Phase 5 計画より)

- ドキュメントは `docs/e2e-strategy.md` として新規作成する(既存 `docs/` 配下のファイル命名規則
  `kebab-case.md` に合わせる)。
- 対象フローは `docs/roadmap.md` の「MVP 完了の定義」(7 ステップ)と一致させる。
- MVP は外部 API(OpenAI / Google Drive)を呼ばないため、E2E も**外部 API・実ネットワークなし**で
  実行できる設計にする(ダミー OCR・サンプルデータのみを使う)。

## 実装ステップ

1. `docs/e2e-strategy.md` を新規作成し、以下を記載する。
   - **対象フロー**: 画像アップロード → OCR 確認 → Markdown 生成 → 編集 → `.md` ダウンロードの
     一連の操作(`docs/roadmap.md` の「MVP 完了の定義」と対応させる)。
   - **候補ツールの比較**: Playwright / Cypress を中心に、Next.js + Vitest との相性、
     ブラウザダウンロード(`.md` ファイル)の検証しやすさ、CI(GitHub Actions)での実行コストを比較する。
     本リポジトリは Vitest をすでに採用しているため、ユニット/コンポーネントテストと
     ツールチェーンを分離する前提で比較する(E2E は別ツール、別コマンドで実行する想定)。
   - **外部 API なし方針**: ダミー OCR(`src/lib/dummyOcr.ts`)とサンプルデータ(`src/lib/sampleData.ts`)
     を使い、実 OpenAI / Google Drive 呼び出しを行わない。Phase 6 以降で実 API 接続が入った場合は、
     E2E ではモック/スタブ経由にするか対象外にするかを再検討する旨を明記する。
   - **導入タイミング**: MVP リリース後、または Phase 6(OpenAI API 連携)着手前を目安とする
     (実装コストに対して、MVP のローカル完結フローでは単体テスト + 手動確認で十分カバーできるため)。
2. `docs/roadmap.md` の Phase 5 の記述と矛盾しないか確認する(矛盾があれば `docs/e2e-strategy.md` 側を調整する)。

## 変更が想定されるファイル

- `docs/e2e-strategy.md`(新規)
- 必要であれば `README.md` の Documentation 一覧に追記(#31 で実施予定のため、本 Issue では追記のみ許容)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| E2E の対象フローが docs に記録されている | `docs/e2e-strategy.md` の対象フロー節 |
| 導入タイミングが明確である | 導入タイミング節(MVP リリース後 / Phase 6 着手前を目安) |
| 秘密情報を使わないテスト方針になっている | 外部 API なし方針節 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

ドキュメントのみの変更のため、上記コマンドは回帰がないことの確認用(影響なしの想定)。

## リスク / 不明点

- ツール選定(Playwright 等)は本 Issue では**比較のみ**に留め、確定はしない
  (確定は実装着手時、E2E 導入が必要になった Issue で行う)。
- `.md` ファイルのダウンロード検証は E2E ツールごとにブラウザダウンロードの扱いが異なるため、
  実装時に再調査が必要になる可能性がある旨をリスクとして明記する。
