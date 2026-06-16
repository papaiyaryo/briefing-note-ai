# Issue #32 設計: MVP デモ用スクリーンショットを追加する

対象 GitHub Issue: #32(`docs/generated-issues/05-06-mvp-デモ用スクリーンショットを追加する.md`)
Phase: 5 / 優先度: Low / 実装順: **5 番目**
依存: MVP UI 完成(Phase 3・Phase 4 完了済み)

## Issue 概要

README やポートフォリオで MVP の操作イメージを伝えられるよう、架空サンプルデータを使った
スクリーンショットを追加する。

## スコープ

- アップロード画面のスクリーンショットを用意する
- Markdown 編集画面のスクリーンショットを用意する
- README から参照する

## スコープ外

- デモ動画 / GIF 作成(Phase 10 で別途検討)
- Post-MVP 機能の紹介

## 実装ステップ

1. `docs/images/` ディレクトリを新規作成する(`public/` は Next.js の静的配信パスのため、
   ドキュメント用画像と混同しないよう避ける)。
2. ローカルで `npm run dev` を起動し、`src/lib/sampleData.ts` の架空企業サンプル
   (`DEMO_OCR_TEXT` 等)を使って実際に MVP フローを操作する。
3. 次の 2 枚を撮影する。
   - `docs/images/upload-step.png`: アップロード画面(画像選択前 or 架空画像選択後)
   - `docs/images/markdown-edit-step.png`: Markdown 編集画面(サンプルデータ生成後)
4. 撮影内容に実在の企業名・個人情報・実在の選考情報が含まれないことを確認する
   (`docs/sample-data.md` の架空企業設定を使う)。
5. `README.md` に「Screenshots」または「Demo」セクションを追加し、2 枚の画像を
   Markdown の画像記法(`![...](docs/images/...)`)で参照する。

## 変更が想定されるファイル

- `docs/images/upload-step.png`(新規)
- `docs/images/markdown-edit-step.png`(新規)
- `README.md`(画像参照セクションの追加)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 個人情報や実在選考情報を含まないスクリーンショットである | 架空サンプルデータ(`sampleData.ts`)のみを使用して撮影 |
| README から画像が表示される | README に画像参照セクションを追加 |
| MVP の主な流れが伝わる | アップロード画面 + Markdown 編集画面の 2 枚で入口と出口を示す |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

画像追加のみのため `npm test` への影響はない。README に張った画像パスが正しいことを
目視で確認する。

## リスク / 不明点

- 画像ファイルのサイズが大きくなりすぎないよう、撮影後に適度な解像度・圧縮を行うことが
  望ましい(具体的な上限は本設計では定めず、実装時に常識的な範囲で判断する)。
- スクリーンショット取得は GUI 操作を伴うため、CI 上の自動化は行わず手動運用とする。
