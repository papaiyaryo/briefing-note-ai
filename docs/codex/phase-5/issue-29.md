# Issue #29 設計: E2E テスト方針を整理する

対象 GitHub Issue: #29(`docs/generated-issues/05-03-e2e-テスト方針を整理する.md`)
Phase: 5 / 優先度: Medium / 実装順: **4 番目(#27・#28 と並行可)**
依存: Phase 4 MVP フロー(完了済み)

## Issue 概要

MVP のアップロードからダウンロードまでの一連の操作を、将来 E2E テストで確認する方針を決める。
本 Issue では **実装は行わず、方針のドキュメント化のみ** を行う。

## スコープ

- E2E 対象フローを整理する
- Playwright 等の候補を比較する
- 外部 API なしで実行する方針を決める

## スコープ外

- E2E テスト実装そのもの
- 外部 API を使うテスト

## 実装ステップ

1. `docs/e2e-policy.md` を新規作成する。
2. 対象フローを記述する(`docs/user-flow.md` の MVP フローと一致させる):
   1. 画像をアップロードする
   2. ダミー OCR 結果を確認・編集する
   3. Markdown を生成する
   4. Markdown を編集・プレビューする
   5. `.md` をダウンロードする
   6. (任意)OCR 失敗状態のフォールバック確認
3. ツール比較を記載する。候補は Playwright / Cypress を中心に、Next.js + Vitest との
   親和性、CI(GitHub Actions, ubuntu-latest)での実行コスト、ダウンロードファイルの
   検証しやすさを比較観点にする。**結論として Playwright を本命候補とする**(Next.js
   公式ドキュメントでの言及が多く、ダウンロードイベントの検証 API がある)。
4. 外部 API 不使用の方針を明記する: OpenAI / Google Drive 接続前提のフローは Phase 6
   以降でのみ対象にし、MVP の E2E は Phase 4 のダミー OCR・ローカル生成のみで完結させる。
5. 導入タイミングの目安を記載する: 実装は Phase 5 では行わず、Phase 6(実 OCR / 実 LLM 接続)
   の前後で、回帰確認の価値が上がった時点で着手する候補とする(具体的な Issue 化は
   別途判断)。
6. `README.md` の Documentation セクションに `docs/e2e-policy.md` へのリンクを追加する
   (1 行追記のみ)。

## 変更が想定されるファイル

- `docs/e2e-policy.md`(新規)
- `README.md`(リンク追記のみ)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| E2E の対象フローが docs に記録されている | `docs/e2e-policy.md` に MVP フローを記載 |
| 導入タイミングが明確である | 「Phase 6 前後」を導入候補として明記 |
| 秘密情報を使わないテスト方針になっている | 外部 API 不使用・ダミー OCR 前提を明記 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

ドキュメントのみの変更のため `npm test` への影響はない想定だが、CI の一部として実行はする。

## リスク / 不明点

- E2E ツールの最終選定(Playwright vs Cypress)は本 Issue では「方針」レベルの決定とし、
  実際の導入 Issue で再評価してよい余地を残す。
- `docs/user-flow.md` の記載と齟齬がないか、作成時に突き合わせて確認する。
