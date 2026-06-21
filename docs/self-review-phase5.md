# Phase 5 MVP Self Review

Issue #31 の範囲として、MVP の使い方、制約、未実装範囲が README だけで分かる状態になっているかをセルフレビューした記録です。

## 対象範囲

- README に MVP の現状、使い方、起動手順、テスト手順、Out of Scope、今後の予定が整理されていること
- MVP の機能と Post-MVP の機能が混在していないこと
- 既存ドキュメントと README の説明が大きく矛盾していないこと
- コード変更ではなく、PR 前の品質ゲートとしてドキュメントを確認すること

## MVP 機能の確認

| 観点 | 確認結果 |
| --- | --- |
| 画像アップロード | README に対応形式、1 枚アップロード、プレビュー、基本バリデーションを記載した。 |
| OCR 結果表示 | 実 OCR ではなくダミー OCR であること、OCR 結果を手で修正できることを記載した。 |
| Markdown 生成 | OCR 結果と企業・説明会情報から Markdown 雛形を生成することを記載した。 |
| Markdown 編集 | 生成 Markdown を編集でき、プレビューで確認できることを記載した。 |
| `.md` ダウンロード | 編集済み Markdown をローカルにダウンロードできることを記載した。 |
| エラー・空状態 | OCR 失敗状態の確認、OCR 結果が空の場合、Markdown が空の場合の制約を README に記載した。 |

## 情報分離の確認

README と Markdown 出力説明では、次の情報を混在させない前提を明記した。

- 説明会で得た事実
- HR・社員が強調していた点
- 自分の印象・感じたこと
- 気になった点
- 次に聞きたい質問
- ES・面接で使えそうな材料
- Web 補足情報
- 元メモからの抜粋

Web 補足情報は MVP では未使用とし、Post-MVP で追加する場合も紙メモ由来の情報と分け、出典 URL と取得日を残す方針にした。

## Out of Scope の確認

README の `Out of Scope for MVP` で、次の機能を MVP 外として分離した。

- 実 OCR / OpenAI Vision API 連携
- 実 LLM による本文生成
- Google Drive 保存
- Web 補足情報の取得・統合
- 企業比較
- 面接前復習モード
- ユーザーアカウント、ログイン、認証
- マルチデバイス同期
- カレンダー連携
- フル機能の応募管理
- デプロイや本番運用設定

これらの機能は README の `Future Ideas` にも分けて記載し、MVP の実装済み機能と混同しないようにした。

## セキュリティ・プライバシー確認

- README に、MVP ではアップロード画像、OCR テキスト、生成 Markdown を外部サービスへ送信しないことを記載した。
- README から `docs/security-privacy.md` へリンクし、詳細な確認結果を参照できるようにした。
- 実 API キーや OAuth シークレットを `.env` に置き、リポジトリには `.env.example` のみをコミットする方針を README に残した。

## 起動・テスト手順の確認

README に以下の手順を整理した。

- Docker での起動: `docker compose up --build`
- Node.js 環境での起動: `npm ci` / `npm run dev`
- ヘルスチェック URL: `http://localhost:3000/api/health`
- 品質チェック: `npm run lint` / `npm run typecheck` / `npm test` / `npm run build`
- 整形チェック: `npm run format:check`

E2E テストは未実装であることを明記し、方針は `docs/e2e-policy.md` に分離した。

## Acceptance Criteria 対応

| Acceptance Criteria | 対応 |
| --- | --- |
| README だけで MVP の使い方が分かる | `Status`、`MVP Features`、`MVP Usage`、`MVP Output Structure`、`Testing and Quality Checks` を追加・整理した。 |
| MVP 外機能が明確に分離されている | `Out of Scope for MVP` と `Future Ideas` を分け、実 OCR、実 LLM、Google Drive、Web 補足、ユーザーアカウント等を MVP 外として明記した。 |
| セルフレビュー結果が docs または Issue に残っている | 本ファイル `docs/self-review-phase5.md` としてセルフレビュー結果を記録した。 |

## 残るリスク・フォローアップ

- README のスクリーンショットは SVG のデモ画像であり、実ブラウザ撮影のスクリーンショットではない。Issue #32 でデモ画像の扱いを継続確認する。
- 実 OCR / 実 LLM 連携を追加する Phase 6 以降では、README の Status、MVP 制約、セキュリティ説明を再確認する必要がある。
- E2E テストは未実装のため、導入時は `docs/e2e-policy.md` に従って外部 API と秘密情報に依存しない形で追加する。
