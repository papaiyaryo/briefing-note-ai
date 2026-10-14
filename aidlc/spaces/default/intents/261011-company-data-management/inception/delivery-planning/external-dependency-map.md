# 外部依存と準備の計画

## Scope

Boltは、動く改善を作り検証して公開する開発のまとまり。今回のBolt 002／3 Unitに必要な外部条件を一覧にする。準備の担当と待つ場所を定める文書で、未作成の環境・未マージ・未検証を完了と扱わない。

## Dependencies

| ID | Dependency | Owner | Lead Time / Availability | Blocks | Fallback / Stop |
|---|---|---|---|---|---|
| D1 | 導入PR #100のmainマージと実SHA公開確認 | 人間がmerge、AIが読取確認・証拠整理 | 現在open／未マージ。完了日時は本人の操作次第 | アプリ実装開始 | 計画は続ける。AI merge・古い成功deploymentによる代用なし |
| D2 | 新専用Supabase Free、東京候補、DB版・枠確認 | 人間が管理画面、AIが設定手順・migrationを準備 | 既存1件の補足あり。専用環境はまだない | U1の実DB接続と公開 | 枠・無料条件が成立しなければ別案を相談。既存projectへ書込しない |
| D3 | 本人の確認済みAuth user、公開signup無効、接続と鍵 | 人間が本人／環境値の管理、AIが非秘密設定・検査 | U1詳細設計／コード計画後、実接続前に準備。時間未確定 | 認証・本番保存 | 不足なら失敗を明示。秘密値を会話に要求せず、テストはdummy |
| D4 | Node／npm／Dockerと試験用PostgreSQL | AIが計画・試験環境、人間がPCの不足設定 | Vitest helpは4.1.8確認済み。Docker daemon・DB版は準備時に確認 | 実SQL検証、Unit checkpoint | runner先行確認。環境不備はRedではない、DB試験をskipして合格しない |
| D5 | 既存Vercel連携と同SHA Preview／本番 | 人間が既存project設定、AIがdeployment照合 | #100と今回Boltの実merge後に各SHAを確認 | 公開受入 | 既存連携を使用。別workflow・新しいdeploy credentials不要 |
| D6 | 既存OCR／LLM／Web／復習provider | 本人が既存契約と利用判断、AIが保持資料とdummy確認 | 自動試験は不要。本番の実provider生成チェックは本人の実行許可後 | 実providerを使う公開生成受入 | dummy Previewで設計と導線を確認。実生成未確認を成功扱いにしない |
| D7 | 各公式承認、最終PR merge | 人間 | 各確認で本人回答を待つ。AIが所要時間を推定して同意にしない | 次段階・コード・リリース | 具体的成果物を提示して待つ。承認ガードは維持 |

## Free Tier, Pausing and Recovery

2026-10-14の公式条件: Supabase FreeはDB 500 MB、転送5 GB、無料稼働project 2、低利用7日で休止対象、自動バックアップなし。[料金](https://supabase.com/pricing)、[休止](https://supabase.com/docs/guides/platform/free-project-pausing)

Q1=aに従い本人が休止時に管理画面で復旧する。アプリは依存先停止を「保存0件」や保存成功へ変換せず、入力を保持し、結果不明は再取得・同操作確認で扱う。休止を避けるだけの自動アクセスや有料化を追加しない。容量は本計画の架空fixtureを使い実サイズ計測。月1回と大量投入前にDashboardを確認し、DB350 MB／転送3.5 GBを相談開始の目安にする。登録15社を無料枠の代わりにしない。

バックアップは本人が管理する暗号化した場所へ専用DBの論理dumpを取得する手順を用意し、初期schema公開前と各schema更新前に取得する。復元は使い捨てローカルDBで表・所属・件数・必要な権限を確認し、Authの本人準備とサーバー環境鍵はdumpと別の復旧手順とする。実本文・認証token・秘密値をrepo／Intent／CI artifactへ入れない。新しいアプリ内backup UIやDrive同期は追加しない。

## Account and Secret Setup

本人初期userは管理側で作り、signupとanonymousを無効にする。管理鍵をブラウザへ出さない。[認証設定](https://supabase.com/docs/guides/auth/general-configuration)、[管理側作成](https://supabase.com/docs/reference/javascript/auth-admin-createuser)

環境項目はSupabase URL、サーバー用Auth設定、専用DB接続、許可する本人UUID、アプリセッション暗号鍵、出自署名鍵、既存provider設定。実値は未追跡ローカル環境／Vercel管理画面へ登録する。`.env.example`は空・dummyのみ。Authのemail／password、接続URLの資格情報、token、キーをauditへ残さない。各値の疎通検査は成功／失敗と非秘密の種類だけを返す。

## Sources

Q1／Q2の実回答、Q1補足「使っている。1つある」、bolt-plan、package.json／Vitest help、2026-10-14のGitHub branchとPR #100の実状態、各公式資料。待ち時間・本人の実設定・無料枠の達成は未確認。
