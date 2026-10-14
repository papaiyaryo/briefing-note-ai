# 実装・検証・公開計画の確認

## Scope and Confirmed Decisions

承認済み要件・18ストーリー／90受入条件・画面・部品・3 Unit・契約を、実装と公開の計画へまとめる。Boltは、動く改善を作って検証する開発のまとまり。今回は1 Intent＝1リリースBolt、3 Unitを同じNext.jsアプリへ直列実装し、日本語PRを1つ作る。人間の最終マージ後に実merge SHAのVercel公開と利用フローを確認する。TDD、公式チェックポイント、最終Inception計画承認、Code Generation Plan Approvalを維持する。

以下はまだ回答待ち。サービス・アカウント作成・課金・秘密値の登録を実施したものではない。秘密値や実メールアドレス・パスワードをこのファイルへ記入しない。

## Q1 — 保存と認証のサービス

Supabase FreeでPostgreSQLと認証をまとめる案を、計画の候補として進めてよいですか？

2026-10-14の公式料金ではDB 500 MB、転送5 GB、月間アクティブ認証ユーザー50,000、無料の稼働プロジェクトは2つまで。低利用が7日続くと休止対象で、再利用時は管理画面からの復旧が必要になる。無料プランには自動バックアップが含まれない。本人のみの利用、画像非保存、代表100企業／1000メモを入力に、本文・構造化データ・操作記録・索引まで容量を見積もる。無料枠適合と実測性能はまだ証明していない。

A. Supabase Freeで計画する。休止時の復旧とバックアップ手順も含める（推奨）
B. 休止されるサービスは避けたい。別候補を比較してから決める
X. Other (please specify)

[Answer]:a

既にSupabaseの無料プロジェクトを使っている場合は、その有無だけ任意で補足してください。使っている。1つある
## Q2 — 本人のログイン方法

初期アカウントを管理側で用意し、公開サインアップを無効にする。ログイン方法はどれにしますか？

A. メールアドレス＋パスワード。本人の初期アカウントを管理側で作成し、パスワードを忘れた場合は管理側で復旧する（推奨）
B. Googleログイン。必要なGoogle側の設定と、本人限定の初回登録方法を追加で具体化する
X. Other (please specify)

[Answer]:a

A案は新しいメール送信サービスや自動メール復旧画面を前提にしない。Supabase標準SMTPは宛先と送信数に制限があるため、メール送信が必須のマジックリンクを既定にしない。アカウント・サービス設定は人間が操作する手順とAIが準備する設定を計画へ分け、準備時期・不足時の停止点を明記する。

## Q3 — 3 Unitの実装順

U1（本人確認・企業とメモの保存）は両方の前提。U1の後は、生成保存と比較のどちらを先に確認したいですか？ 全体を揃えて1回のリリースにする。

A. U1 → U2（OCR生成メモの保存）→ U3（企業比較）。画像から保存する一連の流れの不確実性を先に確認する（推奨）
B. U1 → U3（企業比較）→ U2（OCR生成メモの保存）。保存した比較項目を使える価値を先に確認する
X. Other (please specify)

[Answer]:a

どちらも承認済みDAGに適合する。形式的な点数付けは行わず、本人が選んだ価値とリスクの優先を順序の根拠にする。

## Q4 — 構造化APIのエラー応答

Contract Designで承認された指摘R-01の方針を確定する。既存/api/structureは未設定時500、StructureErrorは422で返し、共通errors.tsの503等とは異なる。どちらで計画しますか？

A. 現行の構造化APIの応答を維持し、C5の共通写像にはこのルートの例外があると明記する（推奨）
B. 構造化APIも共通写像へ統一する。既存利用側・回帰条件への影響を示して、必要な契約・設計変更を再承認する
X. Other (please specify)

[Answer]:a

実際のエラー条件とHTTP値を計画・回帰確認へ明記する。文書の不一致を解決済みの実装だと扱わず、必要な契約への反映と人間承認を実装前に完了する。

## Q5 — 実装を進める担当の形

Construction（設計を具体化してコード・テストを作る段階）を、どの形で進めますか？ 現在のUnitごとの直列実装とチェックポイントを基準にする。

A. このセッションから各Unitを順に進める。AIの開発担当が実装し、人間が所定の計画・結果を確認する（推奨）
B. Unitごとに人間の担当チームを置き、各チームが独立して担当部分を確認する。担当と確認の頻度を次に決める
X. Other (please specify)

[Answer]:a

## 次に具体化・確認する内容

- 保存・認証の実設定、完全スキーマ・原子的な更新と削除、無料枠と休止・バックアップ、署名鍵の管理、外部OCRの保持条件。
- 入力上限・比較件数、代表fixtureでの容量・応答目標と測定条件。15社警告や代表100企業を登録上限にしない。
- 全90受入条件の確認対応、TDD、80% line coverage、lint／typecheck／test／build、必要時Docker、PC／スマホ・拡大・キーボード・公開フロー。
- 各Unitを確認する正式な検証コマンドは、この質問とは別に1つずつ確認する。
- 次の未使用リリース番号、導入PRのマージと実SHA公開確認、mainを基点にするリリースブランチ。ローカルのbranch一覧ではbolt-001だけを観察したが、GitHub側の最新照合前にbolt-002を確保済みと扱わない。

## Sources

- ../requirements-analysis/requirements.md、../user-stories/stories.md、../refined-mockups/mockups.md。
- ../domain-design/components.md、../units-generation/unit-of-work.md、unit-of-work-dependency.md、unit-of-work-story-map.md。
- ../contract-design/contract-summary.md、同reviews/review-01.mdのR-01、Contract Designへの人間の承認。
- ../practices-discovery/team-practices.md、適用project/team方針、docs/aidlc-adoption.md、package.json。
- 2026-10-14確認: [Supabase料金](https://supabase.com/pricing)、[無料プロジェクトの休止](https://supabase.com/docs/guides/platform/free-project-pausing)、[認証設定](https://supabase.com/docs/guides/auth/general-configuration)、[管理側のユーザー作成](https://supabase.com/docs/reference/javascript/auth-admin-createuser)、[標準SMTPの制限](https://supabase.com/docs/guides/auth/auth-smtp)。提供条件の確認であり、本人のアカウントや容量・実設定の確認ではない。
