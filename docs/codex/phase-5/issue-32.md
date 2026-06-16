# Issue #32 設計: MVP デモ用スクリーンショットを追加する

対象 GitHub Issue: #32(`docs/generated-issues/05-06-mvp-デモ用スクリーンショットを追加する.md`)
Phase: 5 / 優先度: Low / 実装順: **6 番目(最終)**
依存: MVP UI 完成(Phase 3/4)、#31(README 更新。本 Issue は README からの参照先を追加する)

## Issue 概要

README やポートフォリオで MVP の操作イメージを伝えられるよう、デモ用スクリーンショットを用意し、
README から参照できるようにする。

## スコープ

- アップロード画面のスクリーンショットを用意する。
- Markdown 編集画面のスクリーンショットを用意する。
- README から参照する。

## スコープ外

- デモ動画 / GIF 作成(Phase 10)。
- Post-MVP 機能の紹介。

## 共有設計判断(Phase 5 計画より)

- 実在企業名・実在の選考情報・個人情報を一切含めない。
- `src/lib/sampleData.ts` の架空企業サンプルデータ(企業名・イベント名・OCR テキスト)のみを使って
  画面を操作し、その状態でスクリーンショットを撮る。
- 画像ファイルは `docs/images/`(新規)に配置し、README から相対パスで参照する。

## 実装ステップ

1. `docs/images/` ディレクトリを新規作成する。
2. ローカルで `npm run dev`(または `docker compose up --build`)を起動し、
   `src/lib/sampleData.ts` のサンプルデータを使って以下の画面を操作する。
   - アップロード画面(画像選択前、または架空サンプル画像をアップロードした直後の状態)。
   - Markdown 編集画面(サンプルデータから生成した Markdown を編集・プレビューしている状態)。
3. スクリーンショットを撮影し、個人情報・実在企業情報が写っていないことを確認した上で
   `docs/images/upload-step.png`、`docs/images/markdown-edit-step.png` として保存する。
4. `README.md` に画面イメージの節(例: `## Screenshots`)を追加し、上記 2 枚を Markdown 画像記法で
   参照する。配置は `## MVP` の直後など、機能紹介と対応しやすい位置にする。
5. 画像サイズが大きすぎないか確認する(リポジトリサイズへの影響を抑えるため、必要なら圧縮する)。

## 変更が想定されるファイル

- `docs/images/upload-step.png`(新規、バイナリ)
- `docs/images/markdown-edit-step.png`(新規、バイナリ)
- `README.md`(Screenshots 節の追加)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 個人情報や実在選考情報を含まないスクリーンショットである | 架空サンプルデータのみを使用して撮影 |
| README から画像が表示される | README に Screenshots 節を追加し、相対パスで参照 |
| MVP の主な流れが伝わる | アップロード画面 + Markdown 編集画面の 2 枚で入口と出口を示す |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

ドキュメント・画像追加のみのため、上記コマンドは回帰がないことの確認用(影響なしの想定)。
加えて README をプレビューし、画像が正しく表示されることを目視確認する。

## リスク / 不明点

- スクリーンショットの撮影はブラウザでの手動操作が必要であり、Codex(CLI 実行環境)単体では
  画面操作・画像保存を完結できない可能性がある。その場合は人間が画像を用意し、Codex は
  README への参照追加のみを担当する分担も検討する。
- 画像ファイルのサイズ・枚数が増えるとリポジトリサイズに影響するため、必要最小限(2 枚)に留める。
