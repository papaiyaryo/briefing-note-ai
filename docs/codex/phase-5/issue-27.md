# Issue #27 設計: Markdown 生成ロジックの単体テストを追加する

対象 GitHub Issue: #27(`docs/generated-issues/05-01-markdown-生成ロジックの単体テストを追加する.md`)
Phase: 5 / 優先度: High / 実装順: **1 番目**
依存: #10(Vitest 基盤)、#23(`buildMarkdownTemplate` ロジック分離)

## Issue 概要

Markdown 出力が安定し、不明な情報を断定しないことをテストで保証する。
対象は `src/lib/markdown.ts` の `buildMarkdownTemplate` / `buildMarkdownTemplateFromBriefingNote` /
`parseMarkdownBlocks`。

## スコープ

- 通常ケースのテストを追加する
- 企業名未入力ケースをテストする
- 要確認 / 不明の扱いをテストする

## スコープ外

- LLM 出力テスト(Phase 6 以降)
- E2E テスト(#29)

## 現状確認(着手前に必ず行う)

`tests/markdown.test.ts` には既に以下が実装済みである。ゼロから書く Issue ではなく、
**Acceptance Criteria との差分を確認してから不足分のみ追加する**。

- 入力なし → `要確認` / `不明` / `(OCR 結果なし)` になることの確認
- 企業名・イベント名・日時・画像ファイル名・OCR 抜粋を埋めるケース
- 空白のみの入力が未入力として扱われるケース
- OCR テキストにバックティックのフェンスが含まれる場合のフェンス長調整
- `docs/output-format.md` の全セクション見出しが出力に含まれることの確認
- `BriefingNote` 集約型から構築するケース(既存 `markdown` フィールドが無視されること含む)
- `parseMarkdownBlocks` の見出し/リスト/コードブロック/段落/未閉じコードブロックの解析

## 不足が想定されるケース(追加候補)

既存テストでカバーされていない、Acceptance Criteria 上グレーゾーンになりやすい点を追加する。

1. **画像ファイル名が未入力 →「不明」になるケース**
   既存テストは「メモ元画像: 不明」を入力なしのケースで間接的に確認しているが、
   「企業名や OCR はあるが画像ファイル名だけ未入力」という組み合わせを明示的にテストし、
   `不明` と `要確認` が混在しないことを確認する。
2. **`buildMarkdownTemplateFromBriefingNote` で企業名が空のケース**
   既存テストは企業名ありのケースのみ。`companyEventInfo.companyName` が空文字の
   `BriefingNote` を渡したときに `# 要確認` になることを確認する(直接 `buildMarkdownTemplate`
   ではなく Note 経由の委譲が正しく機能しているかの確認)。
3. **`要確認` / `不明` / `未使用` の使い分けが `docs/output-format.md` と一致しているかの確認**
   - 企業概要系の未入力項目は `要確認`(`orPending` 経由)
   - 画像ファイル名は `不明`(`要確認` ではない)
   - Web 補足情報セクションは `未使用`(`MVP では未使用` の文言)
   3 つの表記が取り違えられていないかを 1 つのテストとしてまとめて明示する。
4. **`ocrExcerpt` が空文字と未定義の両方で `(OCR 結果なし)` になることの確認**
   現状 `undefined` のケースのみ確認されている可能性があるため、空文字 `""` の場合も
   同じフォールバックになることを確認する。

## 実装ステップ

1. 上記「不足が想定されるケース」を `tests/markdown.test.ts` の既存 `describe("buildMarkdownTemplate")`
   ブロックに追記する(新規ファイルは作らない)。
2. 各テストは既存のスタイル(`expect(markdown).toContain(...)`)に合わせる。
3. `npm test` を実行し、既存テストを壊していないことを確認する。
4. Acceptance Criteria と実装したテストケースの対応を PR 本文に表で記載する。

## 変更が想定されるファイル

- `tests/markdown.test.ts`(既存ファイルへの追記のみ。新規ファイルなし)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| Markdown 生成関数の主要ケースがテストされている | 既存テスト + 上記 1〜4 の追加ケース |
| npm test で通る | 既存スタイルを踏襲し、外部依存なしの純粋関数テストのみ追加 |
| docs/output-format.md とのズレが検出しやすい | ケース 3 で `要確認` / `不明` / `未使用` の使い分けを明示的に固定 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## リスク / 不明点

- 既存テストがすでに Acceptance Criteria の大部分を満たしているため、本 Issue の差分は
  小さくなる見込み。差分が実質ゼロと判断した場合は、新規テスト追加ではなく
  「既存テストが AC を満たしていることの確認」を PR 内に記録する形でクローズしてよいか、
  実装前に人間に確認する。
- `parseMarkdownBlocks` は本 Issue のスコープ(Markdown 生成ロジック)ではなく
  プレビュー用パーサーだが、既存テストに含まれているため変更しない(削除も追加もしない)。
