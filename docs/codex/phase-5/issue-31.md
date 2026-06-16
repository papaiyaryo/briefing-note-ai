# Issue #31 設計: MVP セルフレビューと README 更新を行う

対象 GitHub Issue: #31(`docs/generated-issues/05-05-mvp-セルフレビューと-readme-更新を行う.md`)
Phase: 5 / 優先度: High / 実装順: **6 番目(Phase 5 の最後)**
依存: Phase 4 と Phase 5 の他 Issue(#27, #28, #29, #30, #32)

## Issue 概要

MVP としての使い方、制約、未実装範囲を README に整理し、Phase 5(品質ゲート)を締める。
他のすべての Phase 5 Issue が完了した後に実施することで、テスト・セキュリティ確認・
スクリーンショットの結果を反映できる。

## スコープ

- MVP セルフレビューを行う
- README に機能・起動・テスト手順を追記する
- Out of Scope と今後の予定を明記する

## スコープ外

- ポートフォリオ向け詳細化(Phase 10)
- Post-MVP 機能実装

## 現状の README の課題

`README.md` の `Status` セクションは「現在は Docker 開発環境構築フェーズです。OCR、OpenAI API、
Google Drive API、画像アップロード、Markdown 生成はまだ実装していません。」という
Phase 0 時点の記載のままで、Phase 3・4 で実装済みの内容(画像アップロード、ダミー OCR、
Markdown 生成・編集・ダウンロード)を反映していない。

## 実装ステップ

1. **MVP セルフレビューを実施する**
   実際に `npm run dev`(または `docker compose up --build`)でアプリを起動し、
   一連の操作を手動でなぞる。

   ```text
   1. 画像をアップロード → OCR 確認に進む
   2. ダミー OCR テキストが表示される(失敗状態の確認も含む)
   3. Markdown を生成 → 編集 → プレビューが追従する
   4. .md をダウンロードし、ファイル名と中身を確認する
   ```

   気づいた不具合や UX 上の懸念は、Phase 5 の Scope 内であれば本 Issue で直接修正し、
   Scope 外(新機能相当)であれば別 Issue として記録する(本 Issue 内では実装しない)。

2. **`Status` セクションを更新する**
   Phase 0 時点の記載を、MVP(画像アップロード〜`.md`ダウンロード)が動作する状態である旨に
   書き換える。OpenAI API / Google Drive API は引き続き未接続であることも明記する。

3. **起動手順・テスト手順を整理する**
   既存の `Development` / `Testing` セクションは Docker 起動と `npm test` の説明が
   あるため大枅構成は維持し、次を追記する。
   - `npm run dev` でのローカル起動方法(Docker を使わない場合の手順)
   - `npm test` が `tests/` 配下のロジックテストと UI コンポーネントテスト
     (#27, #28 で追加)の両方を実行することの説明
   - サンプルデータ(`docs/sample-data.md` / `src/lib/sampleData.ts`)を使ったデモ手順への言及

4. **Out of Scope と今後の予定を明記する**
   `Future Ideas` セクションを「Out of Scope(MVP)」として明確化し、AGENTS.md の
   `Out of Scope for MVP` と整合させる(Google Drive 保存、Web 補足、企業比較、
   面接準備モード、ユーザーアカウント、複数端末同期、カレンダー連携、本格的な
   応募管理)。

5. **#32 のスクリーンショットへの参照を確認する**
   #32 が先に完了している場合、README のスクリーンショットセクションと
   本 Issue で更新する内容(Status, MVP セクション)の整合を確認する。

6. **セルフレビュー結果を記録する**
   気づいた点・対応した点・対応しなかった点(理由付き)を PR 本文に記載する
   (Acceptance Criteria が「セルフレビュー結果が docs または Issue に残っている」ことを
   求めているため)。

## 変更が想定されるファイル

- `README.md`(Status, Development, Testing, Future Ideas/Out of Scope セクションの更新)
- (セルフレビューで Scope 内の軽微な不具合が見つかった場合)該当する `src/` ファイル

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| README だけで MVP の使い方が分かる | Status / Development / Testing セクションを実装済み内容に合わせて更新 |
| MVP 外機能が明確に分離されている | Future Ideas を Out of Scope として AGENTS.md と整合 |
| セルフレビュー結果が docs または Issue に残っている | PR 本文にセルフレビューのなぞり結果を記載 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

加えて、手動で MVP フロー(ステップ 1 のセルフレビュー手順)を実行する。

## リスク / 不明点

- セルフレビューで Scope 外の不具合(例: Post-MVP 機能の話)を見つけた場合、
  本 Issue では修正せず別 Issue 化する。スコープの境界判断に迷う場合は人間に確認する。
- 他の Phase 5 Issue(#27〜#30, #32)が未完了の状態で本 Issue に着手すると、
  反映すべきテスト結果・確認結果が揃わないため、実装順序(最後)を守ることが重要。
