# Issue #32 設計: MVP デモ用スクリーンショットを追加する

対象 GitHub Issue: #32(`docs/generated-issues/05-06-mvp-デモ用スクリーンショットを追加する.md`)
Phase: 5 / 優先度: Low / Phase 内 ID: **05-06**
依存: MVP UI 完成(Phase 3)。実務上は **05-05(README 更新)の後** に実施することを推奨(`docs/codex/phase-5/implementation-plan.md` 参照)。

## Issue 概要

README やポートフォリオで MVP の操作イメージを伝えられるよう、アップロード画面と Markdown 編集画面の
スクリーンショットを用意し、README から参照できるようにする。架空サンプルデータ
(`src/lib/sampleData.ts` の「青葉フューチャーリンク株式会社」)を使い、個人情報・実在選考情報を含めない。

## スコープ

- アップロード画面(`src/components/steps/UploadStep.tsx`)のスクリーンショットを 1 枚用意する。
- Markdown 編集画面(`src/components/steps/MarkdownEditStep.tsx`)のスクリーンショットを 1 枚用意する。
- README にスクリーンショットを表示するセクションを追加する。

## スコープ外

- デモ動画・GIF 作成。
- OCR 結果確認画面(`OcrReviewStep`)など、Issue に明示されていない画面のスクリーンショット(追加は任意・必須ではない)。
- Post-MVP 機能(Google Drive 保存・Web 補足など)の紹介。
- スクリーンショット自動生成のための E2E / ブラウザテスト基盤の本格導入(05-03 のスコープ)。

## 共有設計判断(Phase 計画より)

- 格納先は `docs/images/`(新規ディレクトリ)。Next.js の `public/` はランタイム配信用のため使わない。
- 使用データは `src/lib/sampleData.ts` の `DEMO_BRIEFING_NOTE` / `DEMO_OCR_TEXT` / `DEMO_MARKDOWN_SAMPLE`
  (架空企業「青葉フューチャーリンク株式会社」、`docs/sample-data.md` 参照)に統一する。
- README 更新は 05-05 の章構成確定後に行うことを推奨(コンフリクト回避)。05-05 が未着手の場合は、
  既存の README 構成上(`## MVP` の後、`## Future Ideas` または `## Documentation` の前)に独立した
  `## Screenshots` セクションを追加する形で進めてよい。

## 実装ステップ

1. `docs/images/` ディレクトリを新規作成する。
2. 撮影手順を `docs/images/README.md` に記録する(再現性のため)。
   - 起動: `npm run dev` → `http://localhost:3000` を開く。
   - ブラウザのビューポート幅は概ね 1280px 程度を推奨(`docs/ui-spec.md` の `max-w-3xl` / `max-w-5xl` が収まる幅)。
   - 入力データは `src/lib/sampleData.ts` の架空企業データを使う(実在企業名・個人情報を入力しない)。
   - 画面 1(アップロード): 企業名・イベント名・説明会日を架空データで入力し、ダミー画像を選択した状態で撮影する。
     ブラウザのアドレスバーやブックマークバーなど、ローカル環境情報が写り込まない範囲(アプリ本体のみ)をキャプチャする。
   - 画面 3(Markdown 編集): `DEMO_MARKDOWN_SAMPLE` 相当の内容が入った状態で、編集・プレビュー両方が見える
     `md:` 以上の幅で撮影する。
   - 撮影後、ファイル名・OS のユーザー名・パスなどが画像の EXIF やファイル名に残っていないか確認する。
3. 撮影した画像を次のファイル名で `docs/images/` に保存する。
   - `docs/images/upload-step.png`(アップロード画面)
   - `docs/images/markdown-edit-step.png`(Markdown 編集画面)
   - PNG 形式、横幅 1200px 程度を目安に、ファイルサイズは数百 KB 以内に収める(リポジトリ肥大化を避けるため必要なら圧縮する)。
4. `README.md` に画像を表示するセクションを追加する(`## MVP` の直後を推奨)。

   ```md
   ## Screenshots

   架空サンプルデータ([Sample Data](docs/sample-data.md))を使った MVP の操作イメージです。

   ### アップロード画面
   ![アップロード画面: メモ画像と企業・説明会情報を入力する](docs/images/upload-step.png)

   ### Markdown 編集画面
   ![Markdown 編集画面: 生成された Markdown を編集・プレビューする](docs/images/markdown-edit-step.png)
   ```

5. 個人情報・実在選考情報・実在企業名が写っていないことをセルフチェックする
   (`docs/sample-data.md` の安全性メモと同様の確認観点)。

## 撮影が自動化できない点について(重要な制約)

Codex の実装環境には GUI ブラウザがなく、実際のスクリーンショット画像(ピクセルデータ)を自動生成できない。
そのため、本 Issue の実装は次のいずれかの形になる想定:

- **(推奨)人手による撮影**: 実装者(人間)が `npm run dev` でローカル起動し、上記手順でスクリーンショットを
  撮影して `docs/images/` に追加する。Codex は手順書(`docs/images/README.md`)と README のセクション・
  参照リンクをコードとして用意し、画像ファイル自体は人間が後から追加するコミットとして扱う。
- **(オプション)Playwright によるスクリーンショット自動化**: 05-03 で Playwright を E2E 候補として採用する
  場合、一回限りのスクリプト(例: `scripts/capture-screenshots.ts`)を追加し、サンプルデータ投入後の画面を
  自動保存する方法もある。ただし 05-03 は方針整理のみがスコープであり、Phase 5 で Playwright 導入を前倒しするかは
  人間の判断が必要(Phase 計画のリスク参照)。

いずれの場合も、最終的に `docs/images/*.png` がリポジトリに存在し、README から参照できることが
Acceptance Criteria を満たす条件になる。

## 変更が想定されるファイル

- `docs/images/upload-step.png`(新規、バイナリ)
- `docs/images/markdown-edit-step.png`(新規、バイナリ)
- `docs/images/README.md`(新規、撮影手順・使用データの記録)
- `README.md`(スクリーンショットセクションを追記)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 個人情報や実在選考情報を含まないスクリーンショットである | `src/lib/sampleData.ts` の架空企業データのみを使用し、撮影前後にセルフチェックする |
| README から画像が表示される | README に `## Screenshots` セクションと相対パスの画像リンクを追加する |
| MVP の主な流れが伝わる | アップロード(入力)→ Markdown 編集(出力)の 2 画面を選び、サンプルデータが入った状態で撮影する |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

画像追加・README 編集のみのため失敗は想定されないが、Phase 共通の検証方針として実行する。
加えて、README をローカルまたは GitHub 上でプレビューし、画像が正しく表示されることを目視確認する。

## リスク / 不明点

- **画像生成の自動化不可**: 実ピクセルを持つスクリーンショットは人間(または別途ブラウザ自動化)が用意する
  必要があり、通常のファイル編集だけでは完成しない。コード部分(README 文言・ディレクトリ・手順書)と
  バイナリ画像追加を分けて進めることを推奨。
- **README の章立て競合**: 05-05(README 更新)と編集箇所が重なるため、推奨実装順(05-05 の後)を守らないと
  コンフリクトしやすい。
- **撮影用のメモ画像が存在しない**: `src/lib/sampleData.ts` はテキストのみで、撮影用の「手書きメモ風画像」は
  リポジトリに存在しない。スクリーンショット内のアップロード画像プレビューには、架空の手書きメモを模した
  ダミー画像を別途用意して使う(実在の手書きメモ画像は使わない)。
- **ファイルサイズ**: PNG はバイナリで git diff レビューできないため、枚数(2 枚)とサイズを最小限に保つ。
- **Issue 番号の前提**: 本ドキュメントの依存関係(05-05 の後に実施)は、`docs/codex/phase-5/implementation-plan.md`
  に記載の通り Issue 番号が未確認の前提に基づく推奨順であり、実際のスケジュールは人間の判断による。
