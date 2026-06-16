# Issue #27 設計: Markdown 生成ロジックの単体テストを追加する

対象 GitHub Issue: #27(`docs/generated-issues/05-01-markdown-生成ロジックの単体テストを追加する.md`)
Phase: 5 / 優先度: High / 実装順: **1 番目**

## Issue 概要

Markdown 出力が安定し、不明情報を断定しないことをテストで保証する。
Phase 4(#23)実装時に `tests/markdown.test.ts` が既に作られており、Acceptance Criteria の
大部分を満たしている可能性が高い。本 Issue は **既存カバレッジの点検** を中心に行い、不足する
ケースのみ追加する。

## スコープ

- `tests/markdown.test.ts` の既存ケースを Issue #27 の Acceptance Criteria と照らして点検する
- 企業名未入力ケースのカバレッジを確認する(既存: `uses 要確認 defaults...`,
  `treats whitespace-only input as missing`)
- 要確認 / 不明 / 未使用の使い分けのカバレッジを確認する(既存: `要確認` のデフォルト、
  `メモ元画像: 不明`、`MVP では未使用` の各アサーション)
- 通常ケース(企業名・イベント名等が入力されている場合)のカバレッジを確認する(既存:
  `fills in company, event, image, and OCR excerpt`)
- 点検の結果、不足が見つかった場合のみ `tests/markdown.test.ts` にケースを追記する

## スコープ外

- LLM 出力のテスト(Phase 6 以降)
- E2E テスト(#29)
- `parseMarkdownBlocks` など既存で十分にテストされている付随ユーティリティへの新規テスト追加
- 既存テストケースの削除・大幅な書き換え(点検対象であり、リファクタ対象ではない)

## 共有設計判断(Phase 計画より)

- 既存ファイル(`tests/markdown.test.ts`)に追記する形を基本とし、新規テストファイルを作らない。
- Acceptance Criteria が既に満たされている場合は、無理にテストを追加しない。その場合は PR
  description に「既存テストで AC を満たしていることを確認した」旨と、対応関係の表を残す。

## 実装ステップ

1. `npm test -- tests/markdown.test.ts` を実行し、既存テストが通ることを確認する。
2. 次の対応表を作り、Issue #27 の Acceptance Criteria と既存テストの `it` ブロックを突き合わせる。

   | AC | 対応する既存テスト | 判定 |
   | --- | --- | --- |
   | 通常ケースがテストされている | `fills in company, event, image, and OCR excerpt` | 満たす想定 |
   | 企業名未入力ケースがテストされている | `uses 要確認 defaults...`, `treats whitespace-only input as missing` | 満たす想定 |
   | 要確認 / 不明の扱いがテストされている | 上記 2 件 + `includes the MVP web supplement placeholder...`(`未使用`) | 満たす想定 |
   | `npm test` で通る | CI / ローカル実行 | 実行して確認 |
   | `docs/output-format.md` とのズレが検出しやすい | `contains the sections defined in docs/output-format.md` | 満たす想定 |

   実装時に判定が変わった場合(既存テストが実際には該当ケースを十分に検証していない等)は、
   その AC に対応する `it` ケースを `tests/markdown.test.ts` に追記する。
3. 追記が必要な場合、`buildMarkdownTemplate` / `buildMarkdownTemplateFromBriefingNote` に対する
   ケースとして実装する(既存の `describe("buildMarkdownTemplate", ...)` 内に追加する)。
4. `docs/output-format.md` の「不確実な情報の扱い」節(`要確認` / `不明` / `未使用` の使い分け)
   と、生成される Markdown の実際の文言を目視で再確認する。

## 変更が想定されるファイル

- `tests/markdown.test.ts`(追記のみ。不足が無い場合は変更しない可能性もある)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| Markdown 生成関数の主要ケースがテストされている | 上記対応表で点検、不足時のみ追記 |
| `npm test` で通る | 検証コマンドで確認 |
| `docs/output-format.md` とのズレが検出しやすい | `contains the sections defined in docs/output-format.md` テストの点検・維持 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## リスク / 不明点

- **重複テストの追加**: 既存カバレッジが十分な場合に無理に新規ケースを増やすと、保守コストが
  増えるだけで価値が薄い。点検結果を PR に明記し、不足が無ければ追加しない判断を残す。
- **既存ケースとの衝突**: 追記時は既存の `it` ブロックを変更・削除しないようにし、他の Phase 5
  Issue(特に #28 のテスト追加)と平行作業してもコンフリクトしないようにする。
