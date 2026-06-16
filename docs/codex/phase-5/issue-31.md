# Issue #31 設計: MVP セルフレビューと README 更新を行う

対象 GitHub Issue: #31(`docs/generated-issues/05-05-mvp-セルフレビューと-readme-更新を行う.md`)
Phase: 5 / 優先度: High / 実装順: **5 番目**
依存: Phase 4(MVP フロー)、#27〜#30(Phase 5 のテスト・方針・セキュリティ確認結果)

## Issue 概要

MVP としての使い方・制約・未実装範囲を README に整理する。Phase 5 の他 Issue の結果を反映し、
PR 前の品質ゲートとして MVP セルフレビューを行う。

## スコープ

- MVP セルフレビューを行う。
- README に機能・起動・テスト手順を追記する。
- Out of Scope と今後の予定を明記する。

## スコープ外

- ポートフォリオ向け詳細化(技術構成図、開発フロー記録など。Phase 10)。
- Post-MVP 機能実装。

## 共有設計判断(Phase 5 計画より)

- README の既存構成(Status / MVP / Future Ideas / Documentation / Development / CI / Testing)を
  大きく作り直さず、必要な節を更新・追記する。
- README 単独で「アップロード → OCR 確認 → Markdown 生成 → 編集 → ダウンロード」の MVP フローを
  最後まで試せる状態にする。
- `docs/e2e-strategy.md`(#29 で追加)があれば Documentation 一覧にリンクを追加する。

## 実装ステップ

1. **MVP セルフレビュー**: `docs/roadmap.md` の「MVP 完了の定義」7 項目を、実際にローカルで
   (`docker compose up --build` または `npm run dev`)操作して確認する。
   - 画像アップロード → 画像プレビュー → OCR 確認 → Markdown 生成 → 編集 → プレビュー追従 →
     `.md` ダウンロードまでを一通り実施する。
   - 企業名なし、OCR 失敗(「失敗状態を確認」ボタン)時のフォールバック挙動も確認する。
   - 確認結果は本 Issue の PR 本文にチェックリスト形式で記録する。
2. **README 更新**:
   - `## Status` を現状(Phase 4 完了、MVP のローカル完結フローが動作する状態)に更新する
     (現在は「Docker 開発環境構築フェーズ」のままで Phase 0 時点の記述が残っている)。
   - `## MVP` の一覧に変更は不要(既存記載は実態と一致している)。
   - 起動から MVP フローを試すまでの手順を `## Development` 配下に追記する
     (`docker compose up --build` → `http://localhost:3000` を開く → アップロードから
     ダウンロードまで操作する、という導線を明記する)。
   - `## Testing` に、ロジックテスト(`tests/*.test.ts`)と #28 で追加した UI コンポーネントテストの
     両方が `npm test` で実行されることを明記する。
   - `## Documentation` に、本 Phase 5 で追加した docs(`docs/e2e-strategy.md` 等、存在する場合)への
     リンクを追加する。
   - 「外部送信なし」「画像・OCR・生成 Markdown を永続保存しない」という MVP 前提を一文で明記する
     (#30 のセキュリティ確認結果を反映)。
3. README 更新後、リンクの参照先(`docs/*.md`)が実際に存在するか確認する。

## 変更が想定されるファイル

- `README.md`(Status / Development / Testing / Documentation 節の更新)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| README だけで MVP の使い方が分かる | Development 節への起動 + 操作手順追記 |
| MVP 外機能が明確に分離されている | 既存 `## Future Ideas` を維持しつつ、本文中で MVP 範囲外であることを明記 |
| セルフレビュー結果が docs または Issue に残っている | 本 Issue の PR 本文にチェックリストとして記録 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて `docker compose up --build` での起動確認、または `npm run dev` でのローカル確認。

## リスク / 不明点

- README の `## Status` が現状 Phase 0 時点の記述のまま残っており、実態(Phase 4 完了)との
  ズレが大きい。本 Issue で更新する範囲が大きくなりすぎないよう、事実の更新に限定し、
  ポートフォリオ向けの装飾(Phase 10)には踏み込まない。
- #29(E2E 方針)・#30(セキュリティ確認)の結果に依存する記述があるため、
  実装順序(#27→#28→#29→#30→#31)を守らないと本 Issue の記述内容が前提を欠く可能性がある。
