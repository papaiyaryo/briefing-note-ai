# Phase 5 実装計画: MVP 品質改善・テスト

## Phase 目的

Phase 3(MVP フロントエンド UI)・Phase 4(MVP データフロー: ダミー OCR・Markdown 生成・`.md` ダウンロード)で
完成した MVP の基本フローに対し、

1. 既存ロジック・UI のテストを補強し
2. セキュリティ・プライバシーを確認し
3. README を実装済みの MVP 利用手順に合わせて更新し
4. デモ用スクリーンショットを追加する

ことで、デモやポートフォリオとして見せられる品質に近づける。

この Phase は新規機能の実装を目的とせず、**既存実装の検証・文書化・最終仕上げ**に専念する。
LLM / OpenAI 実連携(Phase 6)や Post-MVP 機能は対象外。

## 対象 Issue 一覧

| Issue | Phase 内 ID | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- | --- |
| 要確認(推測 #27) | 05-01 | Markdown 生成ロジックの単体テストを追加する | High | テスト(ロジック) |
| 要確認(推測 #28) | 05-02 | UI コンポーネントの基本テストを追加する | Medium | テスト(UI) |
| 要確認(推測 #29) | 05-03 | E2E テスト方針を整理する | Medium | テスト方針(docs) |
| 要確認(推測 #30) | 05-04 | セキュリティ・プライバシー確認を実施する | High | セキュリティ(docs) |
| 要確認(推測 #31) | 05-05 | MVP セルフレビューと README 更新を行う | High | セルフレビュー / README |
| **#32**(本リクエスト) | 05-06 | MVP デモ用スクリーンショットを追加する | Low | デモ / ポートフォリオ |

> **Issue 番号について**: この設計を作成した時点では GitHub API へのアクセス権限がなく(`gh` / `WebFetch` が許可されていない実行環境)、#32 以外の番号を確認できなかった。
> Phase 4 では `docs/generated-issues/04-01`〜`04-05` が `#22`〜`#26` に連番で対応していたため、同じ命名規則(`docs/generated-issues/05-01`〜`05-06`)であれば `#27`〜`#32` になる可能性が高いが、**着手前に GitHub Issue 一覧で実番号を確認すること**。番号が異なる場合は、本ドキュメントの表とファイル名(`issue-{number}.md`)を実番号に合わせて修正する。

## 設計時点でのリポジトリ調査結果(現状サマリ)

- `tests/markdown.test.ts` に `buildMarkdownTemplate` / `parseMarkdownBlocks` の単体テストが既に存在し、企業名未入力・空白のみ入力・バッククォートフェンスの扱い・`docs/output-format.md` のセクション網羅・`BriefingNote` 経由の呼び出しまでカバーしている。**05-01 は大部分が実装済み**で、残作業はカバレッジの再確認程度に留まる可能性が高い。
- `tests/upload.test.ts` / `tests/download.test.ts` / `tests/dummyOcr.test.ts` / `tests/flow.test.ts` / `tests/sample.test.ts` / `tests/sampleData.test.ts` も既に存在し、`src/lib/` 配下の純粋関数は一定のテストが揃っている。
- 一方で `package.json` に `@testing-library/react` 等の UI テスト用ライブラリがなく、`*.test.tsx` も存在しない。**05-02(UI コンポーネントの基本テスト)は未着手**。
- Playwright 等の E2E ツールは未導入、E2E 方針を記す docs もまだない。**05-03(E2E 方針)は未着手**。
- `src/` 配下に `console.log` 等のログ出力は見つからず、画像・OCR 全文・Markdown を不要にログする実装は現時点で確認できない。05-04 の確認観点としては良好な状態。
- `README.md` の `## Status` は「OCR、画像アップロード、Markdown 生成はまだ実装していません」と記載されているが、実際は Phase 3 / Phase 4 で実装済み(ダミー OCR・Markdown 生成・編集・`.md` ダウンロード)。**README が実装に追従していない**ため、05-05 で実質的な更新が必要。
- `docs/images/` や `public/` は存在しない。**05-06(本 Issue)はディレクトリ新規作成から始める**。

## 実装順序と依存関係

```text
05-01 (Markdown ロジックテストの確認・補強)
05-02 (UI コンポーネントテストの追加)
        ↓ (現状の挙動をテストで固定)
05-03 (E2E 方針整理・docs のみ)
05-04 (セキュリティ・プライバシー確認)
        ↓ (保存方針・ログ方針を確定)
05-05 (README 更新・セルフレビュー)
        ↓ (README の章構成を確定)
05-06 (デモスクリーンショット追加・README 参照) ← 本 Issue(#32)
```

推奨実装順: **05-01 → 05-02 → 05-03 → 05-04 → 05-05 → 05-06**

理由:

- 05-01 / 05-02 でロジック・UI の現状挙動をテストとして固定してから、ドキュメント系の作業に進む。
- 05-03 / 05-04 は実装済みフローの方針整理・確認(docs 中心)であり相互依存は薄いが、セキュリティ確認(05-04)を README 更新(05-05)より先に終え、保存・ログ方針を README に正しく反映できるようにする。
- 05-05 で README の章構成(MVP 利用手順、Out of Scope 等)を確定させてから、05-06 で「スクリーンショット」セクションを追記する。05-06 自体の Issue 上の依存は Phase 3 の UI 完成のみだが、同じ `README.md` を編集するため、05-05 の後に回すことでコンフリクトを避ける。
- 05-06 を最後に行うことで、最終的な UI・README 文言を反映したスクリーンショットになる。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

1. **テスト範囲は MVP のロジック・UI に限定する**。LLM / OpenAI 実連携、E2E 実装、ビジュアルリグレッションは Phase 5 のスコープ外(各 Issue の Out of Scope を参照)。
2. **UI テスト導入時の追加依存(05-02 向け)**: `@testing-library/react` ・ `@testing-library/jest-dom` ・ Vitest の `environment: "jsdom"` 設定が必要になる見込み。現状リポジトリ直下に `vitest.config.ts` が見当たらないため、05-02 で新設が必要か確認する。
3. **E2E(05-03)は方針整理のみ**。Playwright を候補に挙げるのは妥当だが、実装(ブラウザ依存・CI 時間増)は Phase 5 では行わない。
4. **セキュリティ確認(05-04)はドキュメント+目視確認**。新規スキャンツール導入はしない。`grep` 等でログ出力や秘密情報の有無を確認し、結果を docs に記録する。
5. **README 更新(05-05)は実装済み機能に追従させる**。特に `## Status` セクションが Phase 1 時点の文言のまま残っている点を解消する。
6. **スクリーンショット格納先(05-06)は `docs/images/`**。Next.js の `public/` はランタイム配信用であり、README 専用の説明資料は `docs/` 配下に置く既存方針(`docs/sample-data.md` 等)と揃える。
7. **デモデータは `src/lib/sampleData.ts` の架空企業データに統一する**。05-06 のスクリーンショットも、04-05(Issue #26)で整備済みの「青葉フューチャーリンク株式会社」サンプルを使い、Phase 全体で一貫した架空企業を使う。

## Phase 全体の検証方針

各 Issue の PR で次を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

ドキュメント中心の Issue(05-03, 05-04, 05-05 の一部, 05-06)でも、リポジトリ全体に影響がないことの確認として上記を実行する。

## スコープ外(Phase 5 では実装しない)

- LLM / OpenAI / Vision API の実接続(Phase 6)
- E2E テストの実装(Phase 5 は方針整理のみ。実装は Phase 6 以降または別 Issue)
- ビジュアルリグレッションテスト
- デモ動画 / GIF 作成(05-06 の Out of Scope)
- Post-MVP 機能(Google Drive 保存、Web 補足、企業比較、面接準備モード等)の追加・紹介

## リスク / 留意点

- **Issue 番号未確認**: #32 以外の Phase 5 Issue 番号(#27〜#31 と推測)は、本設計時点で GitHub への読み取りアクセス(`gh` CLI / `WebFetch`)が許可されておらず確認できていない。各 Issue に着手する前に実番号を確認すること。
- **README の同時編集**: 05-05 と 05-06 は同じ `README.md` を編集するため、05-05 の PR をマージしてから 05-06 に着手するか、05-06 側でコンフリクトを解消する想定で進める。
- **05-02 の環境追加**: jsdom 環境や Testing Library の追加で `vitest.config.ts` 新設が必要になる可能性があり、既存のテスト実行コマンド(`npm test` = `vitest run --passWithNoTests`)に影響しないか確認する。

## 各 Issue の詳細設計

- #32(05-06)の詳細設計は `docs/codex/phase-5/issue-32.md` を参照。
- 05-01〜05-05 の詳細設計(Issue レベル設計ファイル)は、各 Issue で `@claude` が呼ばれた時点で実番号を確認のうえ `docs/codex/phase-5/issue-{number}.md` として追加する。
