# Phase 5 実装計画: MVP品質改善・テスト

## Phase 目的

Phase 4 で完成した「アップロード → ダミー OCR → Markdown 生成 → 編集 → `.md` ダウンロード」の
ローカル完結フローに対して、

1. 主要ロジック・主要 UI が壊れていないことをテストで保証する
2. 将来の E2E テスト導入方針を決めておく
3. 就活情報(画像・OCR テキスト・生成 Markdown)の扱いがセキュリティ・プライバシー上安全かを確認する
4. README を MVP の実体に合わせて更新し、デモ用スクリーンショットで操作イメージを伝えられるようにする

ことで、MVP を「デモやポートフォリオで見せられる品質」に近づける。

この Phase では新しい機能を追加しない。**既存実装の検証・ドキュメント整備が中心**であり、
Phase 6 (OpenAI API 連携) 以降に進む前の品質ゲートとして位置づける。

## 対象 Issue 一覧

| Issue | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- |
| #27 | Markdown 生成ロジックの単体テストを追加する | High | ロジックテスト |
| #28 | UI コンポーネントの基本テストを追加する | Medium | UI テスト基盤整備 |
| #29 | E2E テスト方針を整理する | Medium | テスト方針(docs) |
| #30 | セキュリティ・プライバシー確認を実施する | High | セキュリティ確認 |
| #31 | MVP セルフレビューと README 更新を行う | High | 品質ゲート / ドキュメント |
| #32 | MVP デモ用スクリーンショットを追加する | Low | ポートフォリオ素材 |

## 実装順序と依存関係

```text
#27 (Markdown 生成ロジックのテスト: 既存実装の検証・補強)
  └─> #28 (UI テスト基盤整備: jsdom / testing-library を新規導入)
        └─> #29 (E2E 方針整理: Phase 4/5 のテスト構成を踏まえて書く)
              └─> #30 (セキュリティ・プライバシー確認: コード全体を確認)
                    └─> #31 (README 更新・セルフレビュー: Phase 5 の結果を反映)
                          └─> #32 (デモスクリーンショット: README から参照)
```

推奨実装順: **#27 → #28 → #29 → #30 → #31 → #32**

理由:
- #27 は `src/lib/markdown.ts` の既存ロジックに対するテストで、Phase 5 で最初に着手しやすい
  (新規依存の追加が不要、後述のとおり大部分はすでに実装済み)。
- #28 はテスト実行環境(jsdom / `@testing-library/react`)を新規に導入するため、#27 で
  既存の Vitest 構成を把握した後に着手する。ここで追加する `vitest.config.ts` は以降の Issue にも影響する。
- #29 は実装ではなく方針整理であり、#27・#28 で実際にどこまで単体テストが揃ったかを踏まえて
  「E2E でしか確認できない範囲」を切り出す方が精度が上がる。
- #30 はコードベース全体(ログ出力、`.env` 取り扱い、保存方針)の確認作業であり、
  Phase 5 のテスト追加が完了した状態で実施する方が確認範囲が安定する。
- #31 は Phase 5 の他 Issue の結果(テスト方針・セキュリティ確認結果)を README に反映する
  「まとめ」の位置づけのため、#27〜#30 の後に置く。
- #32 は README(#31)から参照するスクリーンショットを追加するため最後に置く。
  UI 自体は Phase 3/4 で完成しているため、他 Issue と並行着手も可能だが、依存を明確にするため最後に置く。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

Codex が実装中に大きな設計判断をしなくて済むよう、以下を Phase 5 の共通決定として固定する。

### 1. テストランナーとファイル配置

- テストランナーは既存の **Vitest** を継続利用する(`npm test` = `vitest run --passWithNoTests`)。
- ロジック系のテストは既存規約どおり `tests/<topic>.test.ts` にフラットに置く
  (`src/lib/**/*.test.ts` の co-locate 形式ではない。`tests/markdown.test.ts` 等の既存ファイルに揃える)。
- UI コンポーネントのテストも同じ `tests/` 配下に置く(例: `tests/uploadStep.test.tsx`)。

### 2. UI テスト環境の新規導入(#28 で実施)

- 現状リポジトリには `vitest.config.ts` が無く、`jsdom` や `@testing-library/react` も
  devDependencies に入っていない(`vitest` の peerDependency としてのみ `jsdom` が存在)。
- #28 で以下を追加する。
  - devDependencies: `@testing-library/react`、`@testing-library/jest-dom`、`jsdom`(または `happy-dom`)
  - `vitest.config.ts`: `test.environment` を `"jsdom"` に設定
- 既存のロジック系テスト(`tests/markdown.test.ts` 等)は DOM に依存しないため、
  テスト環境を jsdom に統一しても回帰しないことを確認する
  (環境を分けるオーバーヘッドを避け、設定ファイル 1 つに統一する方針)。

### 3. テスト対象外の境界(全 Issue 共通)

- LLM / OpenAI API / Vision API / Web 取得など、外部 API を呼ぶコードのテストは行わない(Phase 6/8 以降)。
- E2E テストの**実装**は行わない。#29 はあくまで方針整理(docs)に留める。
- スナップショットテストやビジュアルリグレッションは導入しない(MVP の範囲外)。

### 4. 不確実情報の表記規約の検証

- `要確認` / `不明` / `未使用` の使い分け(`docs/output-format.md`)は #27 のテストで重点的に担保する。
- 他 Issue(#28〜#32)はこの規約を前提として扱うのみで、新たな検証は追加しない。

### 5. セキュリティ確認(#30)の進め方

- #30 は基本的に**確認作業**であり、大規模なコード変更は想定しない。
- 確認の結果、`AGENTS.md` / `docs/architecture.md` のルール(API キー非露出、ログ出力制限、
  永続化しない方針)からの逸脱が見つかった場合は、その Issue の PR 内で**最小限の修正**を行う。
- 大きな修正が必要と判明した場合はスコープアウトし、別 Issue 化を提案する(Phase 5 の肥大化を避ける)。

### 6. README 更新(#31)の範囲

- 更新対象は「使い方・起動手順・テスト手順・MVP の範囲と Out of Scope」に限定する。
- ポートフォリオ向けの装飾(技術構成図、開発フロー記録など)は **Phase 10** の範囲とし、
  Phase 5 では行わない。
- 既存の README 構成(Status / MVP / Future Ideas / Documentation / Development / CI / Testing)を
  大きく作り直さず、必要な節を更新・追記する。

### 7. デモスクリーンショット(#32)の素材

- 実在企業名・実在の選考情報・個人情報を一切含めない。
- `src/lib/sampleData.ts` の架空企業サンプルデータのみを使用する。

## 既存実装との関係(Phase 4 からの引き継ぎ)

- `src/lib/markdown.ts` と `tests/markdown.test.ts` は Phase 4 Issue #23(`f4930fb`)で
  すでに整備済みで、#27 の Acceptance Criteria の大部分(通常ケース、企業名未入力、
  `要確認`/`不明` の扱い、`docs/output-format.md` との整合)をすでに満たしている。
  #27 ではこれを**前提として確認・ギャップの洗い出し**を行う(詳細は `issue-27.md` 参照)。
- UI コンポーネント(`UploadStep` / `OcrReviewStep` / `MarkdownEditStep` / `BriefingNoteFlow` など)には
  テストが存在しない。#28 で新規に追加する。
- `tests/sample.test.ts` / `tests/sampleData.test.ts` / `tests/download.test.ts` /
  `tests/dummyOcr.test.ts` / `tests/flow.test.ts` / `tests/upload.test.ts` は
  Phase 4 ですでに整備済みのため、Phase 5 では変更不要(必要なら #28 でカバレッジの参考にする)。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて Issue 別に以下を確認する。

- #27: `npm test` で `tests/markdown.test.ts` が通り、`docs/output-format.md` の節構成とコードが一致している。
- #28: `vitest.config.ts` 追加後も既存テストを含め `npm test` が安定して通る(jsdom 化による回帰がない)。
- #29: 追加した方針 docs が `docs/` 配下に存在し、対象フローが `docs/roadmap.md` の MVP フローと矛盾しない。
- #30: `.env` や API キーがコミットされていない、`console.log` 等に画像内容・OCR 全文・生成 Markdown を
  不要に出力していないことをコードレビューで確認する。
- #31: README の手順だけで `docker compose up --build` から MVP フローを最後まで試せることを確認する。
- #32: README からスクリーンショットが表示され、架空サンプル以外の情報を含まないことを確認する。

## スコープ外(Phase 5 では実装しない)

- LLM / OpenAI API / Vision API の実接続とそのテスト(Phase 6)
- Web 補足情報の取得・統合(Phase 8)
- Google Drive 保存(Phase 7)
- E2E テストの実装そのもの(#29 は方針整理のみ)
- ビジュアルリグレッションテスト、本番監査体制、認証・権限管理
- ポートフォリオ向け詳細化(技術構成図、デモ動画など。Phase 10)

## リスク / 留意点

- **UI テスト導入の依存追加(#28)**: `@testing-library/react` / `jsdom` の追加が
  既存の CI(`npm ci` → lint → typecheck → test → build)に影響しないか確認する。
- **テスト環境の統一**: ロジック系テストと UI テストを同じ `vitest.config.ts`(jsdom 環境)で
  実行して問題が出た場合は、ファイル単位で `// @vitest-environment node` を明示する対応に切り替える。
- **README とドキュメントの整合**: #31 の更新が `docs/roadmap.md` や `docs/output-format.md` と
  矛盾しないように、更新後に他 docs を読み直して整合確認する。
- **セキュリティ確認のスコープ拡大**: #30 で見つかった問題が大きい場合、Phase 5 の他 Issue や
  別 Issue への切り出しを検討し、Phase 5 自体を肥大化させない。
