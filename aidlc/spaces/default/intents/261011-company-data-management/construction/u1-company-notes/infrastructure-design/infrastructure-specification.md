# U1：配置・接続・準備手順

## Deployment

| Facet | Choice | Rationale |
|---|---|---|
| Compute | 既存Next.jsを既存Vercel GitHub integrationへ配置。保存・認証APIはNode.js runtime、CIとローカルはNode 22を基準 | C1〜C6を単一アプリに保ち、暗号・pgをserver-onlyにする。Vercel実runtimeはコード計画と配置時に照合 |
| Networking | HTTPS同一Originのブラウザ→API、API→Supabase Auth HTTPS／PostgreSQL検証済みTLS | Cookieと私的応答を共有CDN cacheへ置かない。新VPC・公開DB API・別APIサービス不要 |
| Region | 本人回答でSupabase東京 ap-northeast-1。既存VercelのFunctionsを東京へ合わせる案をコード計画へ含め、実deployment summaryで確認 | DBを移動せずネットワーク距離を減らす。Vercelの現設定・実際の変更可否は未確認 |
| Storage | 専用Supabase Free PostgreSQL 17.11（本人回答）。非公開アプリschema、最小serverロール、所有者RLS | 本文・構造・出典・版・操作記録を一つの正本で原子的に保存。画像保存サービスを追加しない |
| Environments | 開発／CIは使い捨てPostgreSQL 17とdummy Auth。Previewは専用プロジェクト内の隔離された試験schema／試験ロール、架空fixtureとdummy生成。Productionは本番schema／本番ロール | 追加有料プロジェクトを作らずPreviewが本番表を更新できない権限へ分離。Auth本人は管理側で用意し、実メモは試験に用いない |
| IaC | 承認後にSQL migration、compose.test.yml、既存CI／Next設定、空・dummyのみの.env.exampleと本人用設定手順をコード管理 | Supabase管理画面・Vercel秘密設定は本人が操作。接続・鍵・パスワード実値をコードやIntentへ入れない。新CDK／Terraform不要 |
| Resource sizing | 各Nodeプロセスpool最大3、取得待ち込み要求10秒、DB全体8秒以下。代表100企業／1000メモ／10,000操作で全DB200 MiB予算を実測 | 最大3は各プロセス上限であり全deployment合計ではない。pooler使用量・無料枠を実測して判断し、登録件数上限へすり替えない |

## Infrastructure Services

| Service | Role | Configuration | Notes |
|---|---|---|---|
| 既存Vercel | compute／cdn／dns | 既存domain・Git連携を維持。保護API private/no-store、Node runtime、保存APIのアプリdeadlineを適用 | プラットフォーム強制終了をROLLBACKの代用にしない。既存生成処理へ保存APIの10秒を無条件適用しない |
| 専用Supabase PostgreSQL | database | companies、memos、write_operations、deletion_snapshots、app_sessions。owner＋status／company＋更新時刻＋IDの索引、複合所有者FK、版と成功操作の同一transaction | schema／表／indexの実SQLはコード計画承認後。write_operationsは対象削除cascadeやTTLの対象外 |
| Shared transaction pooler | connection | Dashboard Connectから実hostとロール別usernameを取得。transaction mode、名前付きprepared statement／session advisory lock／LISTENを使用しない | ownercontext・lockは同じtransaction内で完結。TLSのCA・hostname検証必須。リージョンからhostを推測しない |
| Supabase Auth | identity | email/password本人のみ、公開登録・匿名ログイン無効。管理側で確認済み本人ユーザー作成 | 現在Auth0人との本人回答。管理画面ログインとは別。公開登録設定は未確認 |
| Vercel server environment | secrets | ロール別DB接続、Auth URL／必要な公開用key、暗号key ring、別署名key ring、許可Originを環境別に配置 | 通常APIにpostgres管理者／service_roleを渡さない。秘密値にNEXT_PUBLICを付けない |
| 本人管理の手動backup | recovery | 変更日の終了時とdeployment／schema変更前に一貫した論理backup、暗号化保管、schema版・owner・成功operation含む | 24h運用目標。自動RPO／SLAを保証しない。実メモbackupをrepo／auditへ置かない |
| GitHub既存verify | verification | Node22、PostgreSQL17 service、dummy providers、全アプリline coverage>=80、lint/typecheck/test/build | 実Supabase秘密情報・実LLM API・個人メモは不要。既存deploy以外の公開workflowを追加しない |

## Shared Infrastructure

| Shared Resource | Owner Unit | Consumer Units | Access Boundary |
|---|---|---|---|
| 本人context・AppSession・同一Origin | U1 / AccessControl | U2、U3 | 正式認証契約から検証済み本人を受け渡す。consumerが独自Cookie/JWT解釈で本人を作らない |
| CompanyWorkspace保存正本・操作履歴 | U1 | U2生成保存、U3比較参照 | 正式保存・読取契約を呼ぶ。consumerからSQL／本番表の直接操作をさせない |
| 既存Next.js／Vercel／verify CI | U1が共通準備、全Boltで検証 | U2、U3 | 同じrelease branch／1 PR。U2／U3に新DB・新deploymentを増設しない |

## Configuration Boundaries

| 項目 | 設計する値・境界 | 検証方法 |
|---|---|---|
| DB権限 | migration専用権限と通常server権限を分離。serverは非公開schemaの必要DMLだけ、所有者RLSのBYPASSなし。session検索・refresh・失効用権限を限定 | 同major実DBでownercontext未設定／別owner／anon／authenticatedによる表参照・変更拒否を確認 |
| DB期限 | 要求残時間を接続待ち・Auth・transactionへ伝達。SQL上限は各操作の残時間、全transactionは8秒以内。取消不能・ROLLBACK未完了は接続破棄 | 実DBの遅延・lock待ち・commit応答途絶を試験。statement_timeoutだけで全体deadlineとしない |
| Session | 乱数sessionのhash、絶対7日／非操作24h、token暗号化、共有refresh直列化、session→operation→company→memo順 | 複数プロセス同時refresh・logoutと書込の競合、期限境界を試験。Cookieは本番Secure／HttpOnly／SameSite=Lax／Path=/／Domainなし |
| Keys | token用AES-256-GCMと生成出自HMAC-SHA256を別鍵・別key IDで供給。旧鍵保持→token再暗号化／期限終了後除去 | 改変拒否、旧鍵→新鍵移行、緊急session失効をdummy値で確認。鍵実値を記録しない |
| HTTP | 保護応答no-store。変更Originを環境の厳密allowlistへ照合。raw HTMLを実行せず、nosniff／frame制限は既存表示と検証 | 自動API試験と手動の画像／Markdown／DL導線。未検証の強いCSPを追加して既存動作を壊さない |
| 後始末 | 期限切れ確認・終了session不要tokenを有限batchの本人保守手順で整理 | 成功operationと企業／メモは対象外。新cron製品を追加しない |
| Preview隔離 | 本番／試験schema、DBロール、session領域、鍵、許可Originを分離。試験ロールに本番USAGE／DMLを付与しない | 試験ロールで本番表の読取・変更を拒否。試験cleanupは明示した試験schemaだけ。cleanupの成功を本番rollbackと混同しない |

## Human Setup Checklist

人の認証が必要な操作は後で本人が行う。未確認を稼働済みにしない。

| 順序 | 本人が行う操作 | 完了条件・秘密を含まない記録 |
|---|---|---|
| 1 | 今回の専用projectとFree利用枠、東京、DB版を管理画面で確認 | 現在東京／17.11は本人回答。実接続時に版を照合し、既存別projectは変更しない |
| 2 | AuthのUsersで本人用email/passwordユーザーを管理側で作成・確認 | Authに本人ユーザーが存在し、後のアプリログインを確認。管理画面アカウントを代用しない |
| 3 | Auth Sign In / ProvidersでAllow new users to sign upを無効、匿名ログインも無効、email/passwordを確認 | 設定値と実際の公開登録拒否を確認。本人ユーザーのログインが可能であることも確認 |
| 4 | 承認済みSQLと準備手順で本番／試験schema・最小ロールを用意し接続を登録 | 権限試験・TLS検証・pooler互換成功を記録。migration用の広い資格情報を通常APIへ残さない |
| 5 | 暗号／署名の独立鍵と環境別Originをローカル未追跡設定・Vercel各環境へ登録 | 設定済み／未設定だけ記録。値・token・メール・接続文字列を会話へ貼らない |
| 6 | コード計画承認・導入Bolt公開確認・その他着手条件を照合 | 実装開始条件が未達なら計画・手順まで。本人操作を代行した記録を作らない |

backup／migrationにはDirect接続、IPv4のみなら対応するsession poolerの互換を確認して用いる。transaction poolerをpg_dumpの接続先に流用しない。復元は同majorの使い捨てDBに架空データで先に実施し、通常session/tokenは復元せず再ログインする。実owner UUID・成功operation・ID・版を保ち、勝手な新Authユーザーへの所有者移し替えをしない。

## Sources

- infrastructure-design-questions.md Q1=B — 作成済み、東京、17.11、Auth0人、公開登録未確認。
- ../nfr-design/logical-components.md、performance-design.md、security-design.md、scalability-design.md、reliability-design.md、observability-design.md — 詳細NFRの配置境界。
- ../../../inception/domain-design/components.md、../../../inception/contract-design/contract-summary.md、../functional-design/functional-spec.md — 共通部品・正式契約。
- ../../../inception/delivery-planning/bolt-plan.md — 専用Free・接続・単一release・承認上限・着手条件。
- [Supabase 接続方式](https://supabase.com/docs/guides/database/connecting-to-postgres) — poolerとTLS検証、backup接続（2026-10-15確認）。
- [Supabase Auth設定](https://supabase.com/docs/guides/auth/general-configuration) — 公開登録設定（2026-10-15確認）。
- [Vercel region設定](https://vercel.com/docs/functions/configuring-functions/region) — 実配置regionの照合（2026-10-15確認）。

## Assumptions & Open Questions

新しい製品選択はない。実権限・pooler接続・CA・Vercel地域/runtime・Free枠・本人Authと登録無効化は未確認の準備条件として残る。17.11は本人回答でありSQL実測ではない。追加費用や接続方式変更が必要なら計画変更として確認する。

