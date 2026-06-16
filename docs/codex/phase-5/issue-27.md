# Issue #27 設計: Markdown 生成ロジックの単体テストを追加する

対象 GitHub Issue: #27(`docs/generated-issues/05-01-markdown-生成ロジックの単体テストを追加する.md`)
Phase: 5 / 優先度: High / 実装順: **1 番目**
依存: #01-05(Vitest 基盤)、#04-02(Markdown 生成ロジックの UI からの分離。GitHub Issue #23)

## Issue 概要

`src/lib/markdown.ts` の Markdown 生成ロジックに対して、出力が安定していること・
不明情報を断定しないことを単体テストで保証する。将来 LLM 実装に置き換える際の
「仕様テスト」として機能させる。

## 現状確認(重要)

Phase 4 Issue #23(GitHub Issue #23, コミット `f4930fb`)対応時に、
`tests/markdown.test.ts` が**すでに作成済み**であり、本 Issue の Acceptance Criteria の
大部分を実質的に満たしている。

既存テストでカバーされている範囲:

| Issue のスコープ項目 | 既存テストでの対応箇所 |
| --- | --- |
| 通常ケース | `fills in company, event, image, and OCR excerpt` |
| 企業名未入力ケース | `uses 要確認 defaults when no input is given`、`treats whitespace-only input as missing` |
| 要確認 / 不明の扱い | 上記 2 件 + `BriefingNote` 経由のテスト全般 |
| `docs/output-format.md` との整合 | `contains the sections defined in docs/output-format.md`、`includes the MVP web supplement placeholder from docs/output-format.md` |
| コードフェンスの安全性(回帰) | `uses a longer fence when the OCR text contains backtick fences` |
| `BriefingNote` 集約型からの生成 | `builds from the BriefingNote aggregate subset` |
| `parseMarkdownBlocks`(プレビュー用パーサー) | `describe("parseMarkdownBlocks", ...)` 配下 6 件 |

したがって本 Issue は **新規にテストを大量に書き起こす作業ではなく、
ギャップの洗い出しと補強、Acceptance Criteria の明示的な確認** が中心になる。

## スコープ

- 既存 `tests/markdown.test.ts` を Issue のスコープ(通常ケース / 企業名未入力 / 要確認・不明の扱い)
  と突き合わせ、不足しているケースを補う。
- `docs/output-format.md` とのズレが今後検出しやすい状態になっているかを確認する
  (見出しテキストの完全一致を見るテストがあるか、セクション順序まで見ているか)。
- Acceptance Criteria を本設計ファイルと PR 本文で明示的にマッピングする。

## スコープ外

- LLM 出力テスト(Phase 6 以降。本 Issue の Out of Scope と一致)。
- E2E テスト(#29 で方針整理、実装は別 Phase)。
- `parseMarkdownBlocks` の仕様変更(現状維持。テストの追加のみ許容)。
- UI コンポーネント(`MarkdownEditStep` 等)のテスト(#28 のスコープ)。

## 共有設計判断(Phase 5 計画より)

- テストファイルは既存どおり `tests/markdown.test.ts` に追記する(新規ファイルを増やさない)。
- `docs/output-format.md` を正とし、コードとドキュメントに差異があれば
  **ドキュメント側を正としてコードを合わせる**(Phase 4 Issue #23 の方針を継続)。
- LLM 相当の「内容生成」を保証するテストは書かない(本 Issue は構造・フォールバックの保証に限定)。

## 実装ステップ

1. **ギャップ分析**: 既存 `tests/markdown.test.ts` を読み、Issue のスコープ 3 項目
   (通常ケース / 企業名未入力 / 要確認・不明の扱い)それぞれに対応するテストケース有無を確認する
   (上表参照)。明らかな不足は見当たらないため、次のステップで「検出しやすさ」を強化する。
2. **検出しやすさの強化**: 現在のセクション存在確認テスト

   ```ts
   it("contains the sections defined in docs/output-format.md", () => {
     const markdown = buildMarkdownTemplate();
     for (const section of [ /* 13 セクション */ ]) {
       expect(markdown).toContain(`\n${section}\n`);
     }
   });
   ```

   は各見出しの**存在**は確認できるが、**出現順序**までは検証していない。
   `docs/output-format.md` の基本テンプレートは見出し順序も仕様の一部のため、
   見出し順序を検証するテストを追加する(`parseMarkdownBlocks` で見出しのみ抽出し、
   `docs/output-format.md` 記載の順序と配列比較する)。
3. **登壇者(要確認 固定)の確認**: `buildMarkdownTemplate` は `登壇者` を入力に関わらず
   常に `要確認` 固定で出力する(`src/lib/markdown.ts:52`)。これは `MarkdownTemplateInput` に
   `speaker` 相当の入力項目が無いことに起因する仕様であり、本 Issue ではロジックを変更せず、
   「登壇者は常に `要確認` になる」ことを仕様としてテストで固定する
   (将来 `speaker` 入力が追加された際に意図せず壊れたことを検出できるようにする)。
4. **企業名以外の未入力ケースの明示化**: 既存テストは企業名の未入力(空 / 空白)を重点的に確認しているが、
   `eventName` / `eventDate` がそれぞれ単独で未入力の場合に `要確認` になることを確認するケースを追加する
   (現在は企業名・イベント名・日時を同時に省略するテストが中心)。
5. **OCR 抜粋の境界値**: `ocrText` が未指定の場合に `(OCR 結果なし)` になることは
   `uses 要確認 defaults when no input is given` でカバーされているが、
   `ocrText` が空白のみの場合の挙動(trim 後に空 → `(OCR 結果なし)` になるか)を明示的に確認するケースを追加する。
6. テスト追加後、`npm test` ですべて通ることを確認する。

## 変更が想定されるファイル

- `tests/markdown.test.ts`(既存ファイルへのテストケース追加。新規作成ではない)
- (ロジック側 `src/lib/markdown.ts` は、テストで仕様の齟齬が見つからない限り変更しない)

## テスト方針

- 通常ケース: 企業名・イベント名・日時・画像名・OCR を全て指定 → 各項目が対応する行に反映される(既存)。
- 企業名未入力ケース: 企業名が未指定 / 空白のみ → 見出しと概要欄が `要確認` になる(既存)。
- イベント名のみ未入力、日時のみ未入力 → それぞれ単独で `要確認` になる(追加)。
- 要確認 / 不明の使い分け: 画像ファイル名が未指定 → `不明`、OCR 抜粋が未指定/空白のみ → `(OCR 結果なし)`(既存 + 追加)。
- `docs/output-format.md` との整合: 13 セクションの**存在**(既存)に加えて**出現順序**(追加)を確認する。
- 登壇者は入力に依らず常に `要確認`(追加、仕様の明文化)。
- コードフェンスの安全性、`BriefingNote` からの生成、`parseMarkdownBlocks` の各ケースは既存のまま維持する。

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| Markdown 生成関数の主要ケースがテストされている | `tests/markdown.test.ts`(既存 8 ケース + 本 Issue で追加するケース) |
| `npm test` で通る | 追加後に `npm test` を実行して確認 |
| `docs/output-format.md` とのズレが検出しやすい | セクション存在確認(既存)+ 出現順序確認(追加)で、見出し追加・削除・順序変更のいずれも検出できる状態にする |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- 既存実装が Acceptance Criteria をほぼ満たしているため、**過剰な書き直しを避け**、
  ギャップ補強と「検出しやすさ」の強化に集中する(スコープクリープに注意)。
- 「登壇者が常に `要確認` 固定」という現状仕様をテストで固定すると、将来 `speaker` 入力を
  追加する Issue でこのテストの更新が必要になる。これは意図した抑止力であり、
  Issue 本文 Notes の「将来 LLM 実装に置き換える際の仕様テストになる」という意図と一致する。
- 出現順序テストの実装方法は `parseMarkdownBlocks` を再利用するか、正規表現で見出し行を
  抜き出すかの 2 択。`parseMarkdownBlocks` は見出しレベルも返すため、既存パーサーの再利用を優先する。
