# Bolt 001: AI-DLC 導入の承認済み計画

## 承認の出典と範囲

2026-10-10（Asia/Tokyo）のユーザー会話で、ユーザーが「PLEASE IMPLEMENT THIS PLAN: Bolt 単位の AI-DLC 導入計画」として導入を指示した。本書はその承認済み導入計画の要約であり、公式エンジンの Inception / code plan 承認 receipt ではない。未開始の native Intent の状態や audit は作成・偽装しない。

今回は運用導入の bootstrap。アプリ機能の追加・変更は行わない。次のアプリ改善は、導入後の最初の native Inception で決定し、人間が承認する。

## 目標・受入基準

- 公式 Windows ネイティブ AI-DLC 2.11.0 を導入し、プロジェクトを固定する。Codex CLI を 0.145.0 以上へ更新する。
- Codex harness / skills / hooks / workspace を生成する。既存モデルと認証を維持する。
- Classic / strict Guard Policy を標準にする。1 サイクル = 1 Intent = 1 リリース用 Bolt。内部 Unit は依存順に直列で実装する。
- 人間の Inception 計画承認前にアプリ実装しない。承認済み要件・設計変更は再承認し、公式 stage / code plan の承認も行う。
- Issue は任意の入力、Claude は任意の補助。自動 Claude PR レビューと固定役割を廃止する。
- Bolt ごとに日本語 PR を作成し、人間が main にマージする。既存 Vercel 自動デプロイ後、対象 SHA の成功・公開サイト・health を確認する。
- 計画・承認・検証・進捗は公式 workspace に残す。公開確認結果を次の Inception に引き継ぐ。

## 導入 Units と依存順

1. 公式 runtime / CLI 更新、2.11.0 pin、Codex config 生成。
2. project memory と AGENTS / pipeline / PR / README / roadmap / CI 方針の Bolt 移行。runtime をアプリの lint / 型検査 / 整形から除外。
3. doctor、strict の拒否動作、アプリ checks、自己レビュー、導入 PR と GitHub CI。
4. 人間による hook 信頼、新しい trusted session での approval / reapproval / resume 確認。人間のマージ後、対象 SHA の Vercel と公開サイト / health を確認。

1 → 2 → 3 をこの導入作業で実施する。4 は実際のユーザー操作とマージを要するため、未確認のまま成功扱いにしない。

## 名前空間の互換調整

当初の `bolt-001-aidlc-adoption` は公式 doctor が内部 worktree の未所有 branch と判定した。公式 runtime を改造せず、リリース branch を `release/bolt-001-aidlc-adoption` とする。以後 `release/bolt-{連番}-{説明}` を使う。Bolt 単位の PR / リリース方針は変えない。

## 対象外

新たなアプリ機能、外部 API の実リクエスト、Vercel プロジェクトの再作成、デプロイ workflow / secrets の追加、過去 Issue / 設計の削除、main への直接 push、AI による merge / hook 信頼 / 人間承認の代行。

## 検証と公開確認

実施結果と残る確認手順: [導入検証記録](../../../../../docs/aidlc-adoption.md)。実際のアプリ Bolt の要件・設計・承認・検証は、その Intent の公式 record に保存する。
