# Issue #31 設計: MVP セルフレビューと README 更新を行う

対象 GitHub Issue: #31(`docs/generated-issues/05-05-mvp-セルフレビューと-readme-更新を行う.md`)
Phase: 5 / 優先度: High / 実装順: **5 番目**

## Issue 概要

MVP としての使い方、制約、未実装範囲を README に整理する。Phase 5 の他 Issue(#27〜#30)の
結果を踏まえ、PR 前の品質ゲートとしてセルフレビューを実施し、その結果を docs に残す。

## スコープ

- README.md を更新する(機能・起動・テスト手順、Out of Scope と今後の予定を明記)
- MVP セルフレビューを実施し、結果を `docs/self-review-phase5.md` に記録する

## スコープ外

- ポートフォリオ向け詳細化(技術構成図、デモ動画 / GIF、Copilot レビュー運用整理など。Phase 10)
- Post-MVP 機能の実装

## 共有設計判断(Phase 計画より)

README の更新は本 Issue に集約する(#29 / #30 はドキュメントのみ作成し README は編集しない)。
README は次の構成にする(既存見出しは維持しつつ加筆・更新)。

1. タイトル / 概要(既存維持)
2. **Status**(更新): 「Docker 開発環境構築フェーズ」という記述は Phase 4 完了後の実態と
   ズレているため、「ダミー OCR を使い、画像アップロードから Markdown 編集・ダウンロードまでの
   MVP フローを一通り確認できる状態」であることと、「実 OCR / 実 LLM / Google Drive 連携は
   未実装」であることを明記する。
3. **使い方(新規)**: `docs/roadmap.md` の「MVP 完了の定義」(7 ステップ)に沿って、
   画像アップロード → 画像プレビュー確認 → OCR 結果確認 → Markdown 生成 → 編集 → プレビュー →
   `.md` ダウンロード、の操作手順を書く。
4. **MVP / Out of Scope の分離**: 既存の `## MVP` 見出しは維持し、`## Future Ideas` を
   `## Out of Scope(Post-MVP)` 相当の見出しに改め、`docs/roadmap.md` の「MVP に含めないもの」と
   表現を揃える。「MVP に含むもの」と「MVP に含まないもの」が一文で区別できるようにする。
5. **Documentation**: 既存リンクに加えて、存在する場合のみ次のリンクを追加する。
   - `docs/e2e-test-policy.md`(#29 が完了していれば)
   - `docs/security-review.md`(#30 が完了していれば)
   - `docs/self-review-phase5.md`(本 Issue で新規作成)
6. Development / Code Quality / CI(既存維持、変更不要なら触らない)
7. **Testing**(更新): ロジックテスト(`tests/*.test.ts`)と、#28 が完了していれば UI
   コンポーネントテスト(`tests/components/*.test.tsx`)の両方があることを明記する。実行コマンド
   (`npm test`)は変更しない。

依存する #27〜#30 が着手時点で未完了の場合、README には **実際の状況をそのまま書く**
(未完了の項目を「完了済み」と書かない)。未完了分は `docs/self-review-phase5.md` の
Follow-up に記録する。

## 実装ステップ

1. #27・#28・#29・#30 の状況を確認する(各ドキュメント / テストファイルの存在とテスト結果)。
2. README.md を上記構成に沿って更新する。
3. 次の観点でセルフレビューを行う。
   - README だけで MVP の使い方が分かるか(初見の想定で読み直す)
   - MVP 範囲と Out of Scope の境界が明確に分離されているか
   - 直前に Phase 5 で作成したドキュメントへのリンクが正しいか(存在しないファイルをリンク
     していないか)
4. 検証コマンド(下記)をすべて実行し、結果を記録する。
5. 手動で MVP フローを一通り確認する(画像アップロード → OCR 確認(成功 / 失敗) → Markdown
   生成 → 編集 → プレビュー → ダウンロード)。
6. `docs/self-review-phase5.md` を新規作成し、以下を記録する。
   - レビュー日、対象コミット / ブランチ
   - 実行したチェックとその結果(lint / typecheck / test / build)
   - 手動 MVP フロー確認結果
   - Phase 5 各 Issue(#27〜#32)の Acceptance Criteria 達成状況一覧
   - 既知の課題・Follow-up(未完了の依存 Issue があれば明記)
7. README.md と `docs/self-review-phase5.md` をコミットする。

## 変更が想定されるファイル

- `README.md`
- `docs/self-review-phase5.md`(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| README だけで MVP の使い方が分かる | 「使い方」節の追加 |
| MVP 外機能が明確に分離されている | `## MVP` / `## Out of Scope(Post-MVP)` の対比 |
| セルフレビュー結果が docs または Issue に残っている | `docs/self-review-phase5.md` |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

結果は `docs/self-review-phase5.md` に転記する。

## リスク / 不明点

- **依存 Issue の進捗**: Issue 本文の Dependencies(`Depends on Phase 4 and tests`)は #27 /
  #28 を指すと解釈している。着手時点でこれらが未完了の場合、README の「テスト」記述は
  過大に書かず、現状に即した内容にする。
- **リンク先の不存在**: #29 / #30 が未完了で `docs/e2e-test-policy.md` /
  `docs/security-review.md` が存在しない場合、README からリンクを追加しない(壊れたリンクを
  作らない)。
- **README の見出し変更**: `## Future Ideas` を改名する場合、他ドキュメントや外部からの参照が
  ないかを確認する(現時点では README 内部以外からの参照は見つかっていない)。
