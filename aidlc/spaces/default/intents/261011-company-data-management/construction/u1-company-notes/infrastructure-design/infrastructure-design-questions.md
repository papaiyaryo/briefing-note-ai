# U1：選定済み環境への配置の確認

## Confirmed Context

既存Next.js／Vercel GitHub integration、専用Supabase FreeのPostgreSQL＋Auth、本人のみのメール＋パスワード、非公開保存領域と最小server権限、transaction pooler、同major版のローカル試験DB／CI serviceを計画へ写す。

新AWSサービス、別ホスティング、第二deployment workflow、一般サインアップ、追加課金、外部バックアップ製品は選定しない。性能・容量・認証期限・手動バックアップの選択は済んでいるので聞き直さない。

## Q1 — 新しい専用Supabaseプロジェクトの準備状況

Delivery Planningでは「Supabase無料プロジェクトを既に1つ使っている」と回答済み。今回のアプリ用には、その既存プロジェクトを変更せず新しい専用プロジェクトを用意する計画だった。接続設定、ローカル／CIのPostgreSQL major版、リージョンと無料枠の確認を具体化するため、現在の状況を教えてください。

A. 新しい専用プロジェクトはまだ用意していない。作成・本人アカウント準備・公開登録の無効化など、本人が行う設定手順を含めて配置設計を進めてほしい。
B. 新しい専用プロジェクトは用意済み。リージョンとPostgreSQL major版、本人アカウント作成／公開サインアップ無効化の準備状況を、分かる範囲で補足する。
X. Other (please specify)

[Answer]: B — 専用プロジェクト作成済み。本人から東京（ap-northeast-1）、PostgreSQL 17.11、Supabase Authユーザー0人、公開サインアップの設定状態は未確認との回答。管理画面のアカウントとアプリ用Authユーザーは別であり、アプリ用本人ユーザーは未作成として準備手順へ含める。接続成功・DB権限設定・秘密値登録・公開登録無効化は推定しない。

パスワード、APIキー、DB接続文字列、実メールアドレスを回答やこのファイルへ書かない。Bでも秘密値の登録済み・DB権限設定済み・接続成功は推定しない。Aなら未作成のまま成功扱いにせず、設計の既定案と実設定後に確認する項目を区別する。

## Remaining Preconditions

導入PR #100は実マージSHA df63c09be502bf5c9e50b58a69e2bacea5c39bc5とVercel成功を確認済み。本環境から本番ページ／healthを取得できず、既存基本操作も未確認なので、公開確認の着手条件は残る。新しい観測は../../../verification/bolt-001-prerequisites.mdを参照し、古い未マージ時点の記録を勝手に書き換えない。

実装前には、専用環境と本人・鍵・接続・権限、実DB版／リージョン・無料枠、導入Boltの公開確認、更新mainからのリリース用branch、Code Generation Plan Approvalを確認する。アプリコード／SQL migration／依存の追加はまだ行わない。

## Sources

- ../../../inception/delivery-planning/delivery-planning-questions.md Q1=a、補足「使っている。1つある」、Q2=a。
- ../../../inception/delivery-planning/bolt-plan.md — 専用環境・接続・同major試験DB・単一リリースの着手条件。
- ../nfr-design/performance-design.md、security-design.md、scalability-design.md、reliability-design.md、observability-design.md、logical-components.md — 配置へ写す品質対策。
- ../../../inception/domain-design/components.md、../functional-design/functional-spec.md、../../../inception/contract-design/contract-summary.md — 所有者・正式契約・保存と本人確認。
