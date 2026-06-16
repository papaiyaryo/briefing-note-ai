# Phase 5 実装計画: MVP品質改善・テスト

## Phase 目的

Phase 3(UI)・Phase 4(ローカル完結データフロー)で組み立てた MVP が、
最低限のテストと自己レビューによって「壊れていないことを継続的に確認できる」状態にする。

外部 API(OpenAI / Google Drive)を導入する Phase 6 以降に進む前の品質ゲートとして、
次を完成させることを目的とする。

1. Markdown 生成ロジックの単体テスト
2. 主要 UI コンポーネントの基本テスト
3. E2E テスト方針(実装は Post-MVP)
4. セキュリティ・プライバシーの自己確認
5. README を中心とした MVP セルフレビュー
6. ポートフォリオ用デモ素材(スクリーンショット)

この Phase はテストと確認作業が中心であり、**新しいユーザー向け機能は追加しない**。

## 対象 Issue 一覧

| Issue | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- |
| #27 | Markdown 生成ロジックの単体テストを追加する | High | ロジックの回帰防止 |
| #28 | UI コンポーネントの基本テストを追加する | Medium | UI の回帰防止・テスト基盤拡張 |
| #30 | セキュリティ・プライバシー確認を実施する | High | 安全性の自己確認 |
| #29 | E2E テスト方針を整理する | Medium | 将来の E2E 導入方針(docs のみ) |
| #32 | MVP デモ用スクリーンショットを追加する | Low | README/ポートフォリオ用素材 |
| #31 | MVP セルフレビューと README 更新を行う | High | Phase 5 の締め(品質ゲート) |

## 実装順序と依存関係

```text
#27 (Markdown ロジックの単体テスト)
#28 (UI コンポーネントの基本テスト・テスト基盤拡張)
  └─> #30 (セキュリティ・プライバシー確認: テストコードもログ/秘密情報の観点で確認)
#29 (E2E テスト方針整理: ドキュメントのみ、他 Issue と並行可)
  └─> #32 (デモ用スクリーンショット: 動作する MVP UI が前提)
        └─> #31 (MVP セルフレビューと README 更新: 本 Phase の総括)
```

推奨実装順: **#27 → #28 → #30 → #29 → #32 → #31**

理由:

- #27 と #28 はテスト本体であり、Phase 5 の中核。#27(ロジック)は既存の
  `tests/markdown.test.ts` で大部分が先行実装済みのため、まず差分確認から始められる。
  #28 は新たに UI レンダリングテストの基盤(jsdom + Testing Library)を追加するため、
  先にテスト基盤を整えてから #30 以降に進む。
- #30 はテストコードを含めたリポジトリ全体を確認するため、#27・#28 で増えたテストコードも
  確認対象にできるよう後に置く。
- #29 はドキュメントのみで他 Issue への依存が薄いため、並行して進めてよい。
- #32 は「動作する MVP UI」のスクリーンショットが前提のため、UI 関連の確認(#28)の後に置く。
- #31 は Phase 5 全体の結果(テスト・セキュリティ確認・スクリーンショット)を README に
  まとめる総括的な Issue のため、最後に実施する。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

Codex が実装中に大きな設計判断をしなくて済むよう、以下を Phase 5 の共通決定として固定する。

### 1. テスト方針の全体像

- テストランナーは既存どおり **Vitest**(`npm test` = `vitest run --passWithNoTests`)を使う。
  新しいテストランナー(Jest など)は導入しない。
- テストは「MVP の主要操作が壊れていないこと」を確認する範囲に限定する。
  ビジュアルリグレッション、スナップショットテスト、外部 API を使うテストは Phase 5 では追加しない
  (Issue の Out of Scope と一致)。
- ファイル配置は既存の `tests/` ディレクトリをそのまま使う(`src/__tests__` 等の新規ディレクトリは作らない)。
  ファイル名は対象モジュール名に合わせる(例: `src/components/steps/UploadStep.tsx` → `tests/uploadStep.test.tsx`)。

### 2. UI テスト基盤(#28 で新規導入)

これまでの `tests/*.test.ts` はすべて DOM を使わない純粋関数のテストであり、
Vitest はデフォルトの `node` environment で動いている。UI コンポーネントのレンダリングテストには
DOM 実装と React 用のテストユーティリティが必要なため、#28 で以下を追加する。

- 追加する devDependencies:
  - `jsdom`(Vitest の `environment: "jsdom"` に必要)
  - `@testing-library/react`(React 19 対応バージョン)
  - `@testing-library/dom`(`@testing-library/react` の peer dependency として明示インストール)
  - `@testing-library/user-event`(クリック・入力などのユーザー操作のシミュレーション)
- `vitest.config.ts` を新規作成し、`test.environment` を `"jsdom"` に設定する。
  既存のロジックテスト(`tests/*.test.ts`)は DOM API に依存しないため、environment を
  `jsdom` に統一しても既存テストへの影響はない(per-file pragma によるテストごとの
  environment 切り替えは行わず、設定を 1 つに保ち複雑さを避ける)。
- `tests/setup.ts` を新規作成し、`@testing-library/react` の `cleanup` を `afterEach` で
  呼び出すグローバルセットアップとする。`vitest.config.ts` の `test.setupFiles` から読み込む。
- テストファイルの拡張子は `.test.tsx`(JSX を含むため)。`tsconfig.json` の `include` は
  `**/*.tsx` を既に含んでいるため変更不要。
- `package.json` の `test` スクリプト(`vitest run --passWithNoTests`)は変更不要。

### 3. UI テストの書き方の方針

- 対象コンポーネントは props 駆動の「dumb component」であるため、`render` した上で
  `screen.getByRole` / `getByLabelText` を使い、テキスト・ラベル・disabled 状態を確認する。
  実装の詳細(class 名)ではなく、ユーザーが見る・触る要素(見出し、ボタン、入力欄、role="alert")
  を基準にテストを書く。
- ボタン操作の確認は、`fireEvent.click` または `userEvent.click` でコールバック props
  (`onNext` 等)が呼ばれることを確認する。実際の `BriefingNoteFlow` の状態遷移や
  `setTimeout` による疑似遅延には依存しない(疑似タイマーを使った統合テストは本 Phase の
  スコープ外。各 Step コンポーネント単体のテストに限定する)。
- ブラウザ専有 API(`URL.createObjectURL` / `Blob` / `<a download>` クリック)に依存する
  挙動(`UploadStep` の実ファイル選択、`MarkdownEditStep` のダウンロード実行)は、
  jsdom 上で不完全にしかサポートされないため、「クリックでコールバックが呼ばれるか」
  「disabled 状態が正しいか」までを確認し、実際のファイル I/O やダウンロード結果の検証は行わない。

### 4. ログ・秘密情報の扱い(#30 で確認、AGENTS.md / docs/ci-policy.md 準拠)

- `console.log` 等で画像内容、OCR 全文、生成 Markdown、個人情報を出力していないことを確認する
  (現状の `src/` には該当する `console.*` 呼び出しは存在しない)。
- `.env` がコミットされておらず、`.env.example` がダミー値のみであることを確認する。
- 確認はコードレビュー(grep + 目視)で行い、自動スキャンツールの新規導入は Phase 5 では行わない。

### 5. ドキュメントの更新範囲(#29, #31, #32)

- #29 は実装を増やさず、`docs/` 配下に E2E 方針ドキュメントを追加するのみ。
- #31 は `README.md` の `Status` セクション(現状 Phase 0 時点の記載で古い)を MVP 完成時点の
  内容に更新し、テスト・起動手順・スコープ外機能を整理する。
- #32 はスクリーンショット画像ファイルを追加する。配置先は新規 `docs/images/`
  ディレクトリとし、`public/` は配信用ではなく Next.js の静的配信パスと混同しないよう避ける。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて、Issue ごとに以下を確認する。

- #27 / #28: 追加したテストが `npm test` で安定して通る(false positive / flaky がない)。
- #30: `grep` 等でログ出力・秘密情報の混入がないことを確認した記録を Issue または PR に残す。
- #31: README だけで MVP の使い方が分かることを、手順を実際になぞって確認する。

## スコープ外(Phase 5 では実装しない)

- ビジュアルリグレッションテスト、スナップショットテスト
- 外部 API(OpenAI / Google Drive / Web 取得)を使うテスト
- E2E テストの実装そのもの(#29 は方針整理のみ)
- 本番監査体制、認証・権限管理
- Post-MVP 機能(企業比較、面接前復習モード等)の実装

## リスク / 留意点

- **テスト基盤追加の影響範囲**: `vitest.config.ts` で environment を `jsdom` に変更すると、
  既存の `tests/*.test.ts`(ロジックテスト)が新しい environment 下でも同じ結果になることを
  #28 の PR で確認する(既存テストは DOM に依存していないため通る想定)。
- **#27 の作業量の見積もり**: `tests/markdown.test.ts` に既にかなりのテストがあるため、
  #27 は「不足ケースの洗い出しと追加」が中心になり、ゼロから実装するわけではない。
  着手前に既存テストと Acceptance Criteria の差分を確認すること。
- **React 19 対応**: `@testing-library/react` のバージョンは React 19 (`react@^19.0.0`) と
  互換性のあるものを選定する(導入時に `peerDependencies` を確認する)。
- **スコープ逸脱**: README 更新(#31)はテスト・確認結果の反映に留め、Phase 5 の Out of Scope
  である Post-MVP 機能の紹介や大規模なポートフォリオ向け文章化(Phase 10)まで広げない。
