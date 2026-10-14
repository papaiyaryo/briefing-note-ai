# 別ローカルセッションへの引継ぎ

Cloud 環境は本人の希望により使用しない。

- 対象 Intent: `261011-company-data-management`
- 記録: `aidlc/spaces/default/intents/261011-company-data-management/`
- ブランチ: `release/bolt-002-company-data-management`
- Inception の最終 Delivery Planning は公式 runtime で本人の承認を記録済み。
- `functional-design` の開始前で公式に park 済み。アプリケーション実装は未着手。
- Classic / strict、単独担当、U1 → U2 → U3 の直列実行。1 Bolt / 1 リリース PR。

承認済み [bolt-plan.md](../aidlc/spaces/default/intents/261011-company-data-management/inception/delivery-planning/bolt-plan.md) と [stories.md](../aidlc/spaces/default/intents/261011-company-data-management/inception/user-stories/stories.md) を確認する。

## 新しいセッションで送る内容

このブランチの作業ツリーを開き、以下を送る。

```text
$aidlc --resume
既存 Intent 261011-company-data-management を再開してください。
docs/session-handoff.md と承認済み bolt-plan.md を確認し、公式 runtime の指示に従って Functional Design から進めてください。
U1 → U2 → U3 は直列実行。未実施の人間ゲートは私に確認してください。
```

ユーザー別カーソルがない clone では公式 runtime の既存 Intent 選択を使う。状態・監査・承認を手で生成しない。Inception 承認は、未実施の Functional Design や Code Generation Plan Approval の自動承認ではない。

## 再開時の確認事項

- Adoption PR [#100](https://github.com/papaiyaryo/briefing-note-ai/pull/100) はマージ済み。実際の SHA は `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。このブランチはその main から作成した。
- 当該 SHA の GitHub status に Vercel success を確認。[deployment](https://vercel.com/papaiyaryos-projects/briefing-note-ai/61SkkVSUnqCJVymFWmYgxjgVCJTv)。本番ページ、`/api/health`、承認済みユーザーフローは未確認。成功 status だけでリリース検証完了としない。
- 既に利用中の Supabase Free プロジェクト 1 個には変更を加えず、承認済みの専用プロジェクトと Auth 設定を確認する。
- 承認済み検証コマンドは `npm test -- --passWithNoTests=false`。計画通りに TDD の Red / Green / Refactor、公式 Unit 記録、lint / typecheck / test / build、実 PostgreSQL 検証を実施する。
- PR は日本語で 1 件。main へ直接 push しない。最終マージは本人が行う。マージ後の実際の SHA に対する Vercel とユーザーフローの検証が必要。

このファイルは引継ぎの補足であり、承認済み計画や公式の状態・監査記録を変更しない。
