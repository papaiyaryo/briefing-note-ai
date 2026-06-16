# Issue #32 設計: MVP デモ用スクリーンショットを追加する

対象 GitHub Issue: #32(`docs/generated-issues/05-06-mvp-デモ用スクリーンショットを追加する.md`)
Phase: 5 / 優先度: Low / 実装順: **6 番目(最後)**

## Issue 概要

README やポートフォリオで MVP の操作イメージを伝えられるよう、アップロード画面と Markdown
編集画面のスクリーンショットを用意し、README から参照する。

## スコープ

- アップロード画面(企業名等入力フォームを含む)のスクリーンショットを用意する
- Markdown 編集画面(編集 + プレビュー)のスクリーンショットを用意する
- README から画像を参照する

## スコープ外

- デモ動画 / GIF 作成(Phase 10)
- Post-MVP 機能の紹介

## 共有設計判断(Phase 計画より)

- 画像は `docs/images/` 配下に新規配置する(`docs/images/upload-step.png`,
  `docs/images/markdown-edit-step.png` を想定)。
- 撮影時の入力データは `docs/sample-data.md` の架空企業(青葉フューチャーリンク株式会社)を
  使う。実在企業名・個人名・実在の選考情報は使わない。
- 画像参照の追記先は、#31 で作られる README の「使い方」節とする(#31 未完了の場合は、
  README に最小限の「スクリーンショット」見出しを追加してそこに置き、#31 実施時に「使い方」節へ
  統合してもらう旨を PR に記載する)。

## 実装ステップ

1. `npm run dev`(または `docker compose up --build`)でローカル起動する。
2. アップロード画面で、企業名・イベント名・説明会日に `docs/sample-data.md` のサンプル値を
   入力した状態でスクリーンショットを撮る。
3. ダミー OCR を実行し、OCR 確認 → Markdown 生成まで進め、Markdown 編集画面
   (編集 + プレビュー)のスクリーンショットを撮る。
4. ブラウザの URL バーやタブなど、画面外の要素に個人情報や無関係な情報が写っていないか確認する。
5. 画像を `docs/images/upload-step.png`、`docs/images/markdown-edit-step.png` として保存する。
   ファイルサイズが大きくなりすぎないよう、必要に応じて圧縮する。
6. README.md の該当節に Markdown 画像記法で画像を埋め込む。

## 変更が想定されるファイル

- `docs/images/upload-step.png`(新規)
- `docs/images/markdown-edit-step.png`(新規)
- `README.md`(画像参照の追記のみ)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 個人情報や実在選考情報を含まないスクリーンショットである | 架空サンプルデータの使用、撮影前確認 |
| README から画像が表示される | README への画像参照追加 |
| MVP の主な流れが伝わる | アップロード画面 + Markdown 編集画面の 2 枚で主要フローを表現 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

(画像追加と README へのリンク追記のみのため、Issue 着手前と同じ結果で通ることを確認する。)

## リスク / 不明点

- **画像サイズ**: スクリーンショットがリポジトリサイズを大きくしすぎないよう、適度な解像度・
  圧縮を行う。
- **#31 との順序**: README の「使い方」節がまだ存在しない場合(#31 未着手)は、本 Issue で
  README 構成を先取りして作らず、最小限の見出し追加に留める。
