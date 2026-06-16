# Issue #29 設計: E2E テスト方針を整理する

対象 GitHub Issue: #29(`docs/generated-issues/05-03-e2e-テスト方針を整理する.md`)
Phase: 5 / 優先度: Medium / 実装順: **4 番目**

## Issue 概要

MVP のアップロードからダウンロードまでを将来 E2E で確認するための方針を決める。
実装は行わず、方針をドキュメントとして残すことが目的。

## スコープ

- E2E の対象フローを整理する
- Playwright 等の候補を比較する
- 外部 API なしで実行する方針を決める

## スコープ外

- E2E テストの実装
- 外部 API を使うテスト
- CI への E2E ジョブ追加
- README の更新(#31 に集約するため、本 Issue では行わない)

## 共有設計判断(Phase 計画より)

- 出力先は新規ファイル `docs/e2e-test-policy.md`(既存の `docs/architecture.md` 等への追記
  ではなく、他ドキュメントと同様に 1 トピック 1 ファイルの構成を維持する)。
- README からのリンク追加は本 Issue では行わない(#31 が README の構成を確定させた後に
  リンクを追加する)。

## 実装ステップ

1. `docs/e2e-test-policy.md` を新規作成し、以下を記載する。
   - **対象フロー**: 画像アップロード → ダミー OCR 確認(成功 / 失敗) → Markdown 生成 →
     編集・プレビュー → `.md` ダウンロード、の一連の操作をステップごとに整理する。
   - **ツール比較**: Playwright と Cypress を簡易比較する(Next.js との親和性、ブラウザ
     カバレッジ、CI 実行コストなどの観点)。比較結果として Playwright を将来候補として推奨する
     理由を書く(結論を強制するものではなく、提案レベルであることを明記する)。
   - **外部 API 不使用方針**: ダミー OCR(`src/lib/dummyOcr.ts`)とサンプルデータ
     (`docs/sample-data.md` / `src/lib/sampleData.ts`)を使い、OpenAI / Google Drive 等の
     実 API には接続しない方針を明記する。
   - **導入タイミング**: MVP(Phase 5)時点では方針整理のみとし、実装は Phase 6 以降
     (実 OCR / LLM 接続後、または UI が安定した時点)で検討する旨を記載する。
   - **秘密情報の扱い**: `docs/ci-policy.md` と同様、E2E テストでも秘密情報・実 API キーを
     使わない方針を明記する。
2. `docs/roadmap.md` の Phase 5 / Phase 6 の記述と矛盾しないか確認する。

## 変更が想定されるファイル

- `docs/e2e-test-policy.md`(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| E2E の対象フローが docs に記録されている | 「対象フロー」節 |
| 導入タイミングが明確である | 「導入タイミング」節 |
| 秘密情報を使わないテスト方針になっている | 「外部 API 不使用方針」「秘密情報の扱い」節 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

(ドキュメントのみの変更のため、Issue 着手前と同じ結果で通ることを確認する。)

## リスク / 不明点

- **実装と誤解されるリスク**: ツール比較やフロー整理が「実装済み」と読めないよう、
  ドキュメントの冒頭で「方針整理のみであり、E2E テスト自体は未実装」であることを明記する。
