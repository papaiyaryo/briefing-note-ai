# U1：企業・メモ管理のコード計画

## Summary

- Builds: 企業・メモ管理と後で埋める設定欄を実装。実Supabase準備を待たずローカル・CIで検証し、デプロイは本人へ引き継ぐ。
- Touches: src/lib/workspace・server/auth・server/workspace、src/components/workspace、app/api/v1・企業画面、SQL、試験DB、既存CI。
- Tests: 80件以上のVitest・API・ローカルPostgreSQL17結合試験、既存回帰、全アプリlines>=80%、ローカル画面確認。実接続・公開確認は後日。

## Scope and Authority

1 Intent = 1 release Bolt。U1→U2→U3を直列に進め、release/bolt-002-company-data-managementで日本語PRを1つ作る。Inceptionの実承認・正式検証コマンド登録・初版コード計画の本人承認は記録済み。本改訂は2026-10-15の本人指示による実環境準備の後回しとデプロイ担当変更を反映し、修正版を提示する。チェック欄は実作業完了後だけ変更する。計画の作成・登録は実装、試験、本人設定の完了証拠ではない。

U1はAccessControl、CompanyWorkspaceと共通入口／企業／保存メモUI、C1〜C4／C6を担当する。U2の生成保存UI・出自証明発行、U3の7観点比較UI・比較出力はここで実装しない。U1で生成候補の出自検証と比較参照APIを作り、後続Unitの契約試験に使える。共有契約の追加・破壊的変更、一般会員募集、通知、同期配信、Drive、旧保存移行、画像保存、新DB復習、既知不具合の一括修正は対象外。

## Revision 1 — 実装と実環境準備の分離

2026-10-15の本人指示「Supabaseはapikeyだけ書く欄だけ作ってくれればいいのでは」「vercelは何も考慮しなくてもいいよ。デプロイの作業はこちらでやります」を反映する。上流bolt-plan・配置設計・過去preflightにある実Supabase準備・導入Bolt公開確認待ちは、本改訂ではローカル実装・試験を止める条件にしない。過去の未確認を成功へ書き換える意味ではない。本Intentの当該着手時期と公開担当に関する変更として本改訂を参照する。

機能範囲、本人限定認証、所有者検査、原子性、TDD、実PostgreSQL試験、coverage80%、人間merge、1リリースBoltは維持する。実接続・公開確認が未実施なら引継ぎへ明示し、合格・release完了としない。Vercelの設定・deploy・公開URL照会・deployment監視は本人担当であり、実装担当はこれらの待機・実行・region変更を行わない。revision-01.mdに変更の根拠と担当を記録する。

## Start Conditions and Human Work

| ローカル実装・試験の条件 | 対応 |
|---|---|
| コード計画 | 本改訂の本人確認後、通常checkpointは選択済み自動継続 |
| Git | 最新mainと既存dirty差分を照合しrelease/bolt-002-company-data-managementを安全に準備。mainへ直接pushしない |
| Node／runner | CIはNode22。ローカルNode22互換を確認。Step2で既定passWithNoTests重複を除き、承認済みexact commandでrunner成立を確認 |
| 実DB | 使い捨てPostgreSQL17、試験Auth参照とdummy本人、実migration／adapter。Docker等の不備をRed・skip成功にしない |
| 外部資格情報 | ローカル・CI自動試験に実Supabaseキー・本人Auth・実DB接続は不要。外部Auth／生成はdummy adapter／provider |

| 後日、実環境を使う前の条件 | 担当・扱い |
|---|---|
| 専用Supabase | 作成済み・東京・17.11は本人回答。実DB版・Free枠・pooler・TLS・最小role／schemaの実設定と接続は後で本人が確認 |
| 本人Auth／公開登録 | Auth0人／公開登録状態不明。実利用前に本人がユーザー作成・公開登録と匿名ログイン停止を実施。ローカル・CIは架空本人で試験 |
| 秘密設定 | サーバー用.env.exampleに空欄・用途・取得場所・未設定時の挙動を用意。本人が後で未追跡.env.local等へ入力。秘密を会話に要求しない |
| 実接続・外部性能 | 後日の本人確認へ手順と未確認項目を渡す。ローカル試験を実Supabase適合や外部p95達成の証明にしない |
| Vercel／公開確認 | 本人が担当。導入Boltの公開未確認やHTTP429でローカル実装を止めない |

設定欄は製品画面の秘密値フォームではなく、サーバー環境変数の記入枠を意味する。pgによるDB接続方式を維持するため実環境にはAPIキーに加えproject URL、DB接続文字列、セッション暗号鍵・別の出自署名鍵・許可Origin等が必要。説明付きの空欄を用意し、通常処理へ全権service_role／secret keyを追加する方式へ変更しない。

設定不足時は保護APIを成功扱いせず、秘密を含まない設定不足エラーを返す。テスト用Authは依存注入で分離。ローカル画面確認用も明示的な開発専用設定＋loopback限定とし、production／非loopbackで拒否する。実環境へdummy本人・認証なしを自動fallbackしない。

## Files and Responsibilities

以下はU1の変更予定。全アプリ変更をStep20のsource-manifest.jsonへ実際のcreated／modified／deleted区分で列挙する。未作成ファイルを作成済みと記録しない。

| 対象 | 予定ファイル | 目的 |
|---|---|---|
| 共有model／validation／表示state | src/lib/workspace/contracts.ts、schema.ts、validation.ts、board.ts、draft.ts | 正式型、許可キー・上限、8状態、日付・件数、未保存状態と要求世代 |
| 認証 | src/lib/server/auth/provider.ts、session.ts、crypto.ts、accessControl.ts | server-only Supabase client、検証済み本人、暗号化session・refresh・logout |
| 保存 | src/lib/server/workspace/database.ts、repository.ts、service.ts、errors.ts、generationReceipt.ts | pg接続、transaction、所有者・版・操作・削除、出自検証、失敗分類 |
| HTTP client | src/lib/workspace/client.ts、src/lib/authClient.ts | 同Origin Cookie、15秒、有限GET再取得、書込unknownと明示再試行 |
| 認証API | app/api/v1/auth/login/route.ts、logout/route.ts、session/route.ts | bolt-planの3認証入口 |
| 保存API | app/api/v1/board/route.ts、companies/route.ts、companies/[companyId]/route.ts、companies/[companyId]/memos/route.ts、companies/[companyId]/memos/[memoId]/route.ts | C4 method／body／query／statusをそのまま実装 |
| 確認／操作／参照API | app/api/v1/deletion-confirmations/route.ts、deletions/route.ts、operations/[operationId]/route.ts、comparison-sources/route.ts | POST確認・削除、確定履歴、1企業1参照のsnapshot |
| 既存共通認証境界 | app/api/ocr/route.ts、structure/route.ts、web-supplement/route.ts、interview-review/route.ts、既存client4ファイル | 本人・Origin・no-storeを接続し既存provider入出力／失敗写像を維持 |
| UI共通／企業／メモ | src/components/workspace/WorkspaceShell.tsx、LoginForm.tsx、CompanyBoard.tsx、CompanyForm.tsx、CompanyDetail.tsx、MemoEditor.tsx、ConfirmDialog.tsx | 登録、8状態と6通常列、日付・社数、詳細、構造追加、保存・破棄・削除・出力 |
| ページ接続 | app/page.tsx、app/companies/[companyId]/page.tsx、app/compare/page.tsx、src/components/BriefingNoteFlow.tsx | 共通入口・本人状態・401無効化。既存生成／旧比較は入口を区別し維持。U3新比較UIは追加しない |
| SQL／DB試験 | db/migrations/001-company-workspace.sql、tests/u1-company-notes/db/bootstrap.sql、fixtures.ts、helpers.ts | 実migration、試験用Auth参照、架空fixture、独立接続・故障挿入・掃除 |
| テスト | tests/u1-company-notes/*.test.ts（下記に完全一覧）＋既存生成route／UIテスト | 本人境界、SQL整合性、UI状態、既存回帰。既存unauthenticated成功試験を単に削除せず認証済みfixtureへ更新 |
| 設定・文書 | package.json、package-lock.json、vitest.config.ts、compose.test.yml、.github/workflows/ci.yml、next.config.ts（既存実ファイル名を確認）、.env.example、docs/company-data-setup.md | 固定依存・coverage・DB service・アプリheaders、後で埋める設定欄、本人の設定／backup／復旧とdeploy引継ぎ手順 |

## Dependencies and Runtime

2026-10-15にnpm registryをread-only照会し、@supabase/supabase-js 2.117.3（Node>=22）、pg 8.23.1（Node>=16）、@types/pg 8.23.1を確認。coverageは承認済み@vitest/coverage-v8 4.1.8を既存Vitest4.1.8へ合わせる。追加はStep2の承認・準備後、exact versionとlockfileへ固定する。新ORM・SSR browser Auth client・ブラウザ自動試験製品は追加しない。lockfile／Node22の実install・typecheck・buildとローカルPostgreSQLで確認。実Supabase／poolerの適合は後日として引き継ぎ、実装を待機しない。

ローカルnpm registry照会はcache先を一時領域へ切り替えることで成功した。通常cacheへの権限失敗とPowerShell HTTPS失敗は準備不備であり、試験Redや依存互換成功の証明ではない。machine-local pathを記録しない。

## Concrete Implementation Decisions

- 保存正本はcompanies／memos／write_operations／deletion_snapshots／app_sessions。全所有者の認証由来UUID、複合FK、所有者RLS、非公開schema・最小roleを実migrationへ置く。通常roleはmigration／管理者／BYPASSRLS権限なし。app_sessions検索はhash指定の限定入口で、session検索前に企業行を読む権限経路を作らない。限定SQL関数が必要なら固定search_pathと必要権限だけ、anon／authenticatedへ公開しない。
- pg Poolは各プロセスmax3、TLSのCAとhostnameを検証。名前付きprepared statement、session-levelロック、LISTENに依存しない。request10秒・transaction8秒以内の残り時間を伝達し、DB17の利用可能な期限設定とcancel／ROLLBACKを実試験。取消未確定・rollback失敗の接続はdestroyして再利用しない。COMMIT応答途絶はunknown。
- session→operation→company→memoのlock順を全書込・logoutへ適用。refreshの共有排他はDB session行を使い、Auth外部呼出し中に企業lockを持たない。絶対7日・idle24hの期限、refreshVersion、失効を保存開始時にも検査する。同時refreshとlogoutの競合を別プロセス・別接続で試験する。
- operationIdと正規化hashを同本人で一意化し、確定履歴を対象存在・確認期限より先に照合。対象変更と成功結果を原子的に記録。削除済みID再利用を拒否し、成功operationsをTTL／対象FK cascadeから独立させる。
- 企業項目versionと内部childrenVersionを分離。全メモ作成・編集（比較理由のみも含む）・削除で親を先に直列化し子集合版を更新。確認は全所属ID／版・件数のsnapshotを10分保持し、確定時に同transactionで照合。確認だけで変更しない。
- AES-256-GCMは32-byte独立鍵、12-byte乱数nonce、16-byte tag、session／user／keyIDのAAD。tag検証前に平文を使わない。アプリsession32-byte乱数→SHA256保存。生成出自HMAC-SHA256は別32-byte鍵・keyID、固定用途／形式版、userId／generationId／providerOriginに結び同長constant-time比較。Node標準cryptoを利用し新暗号実装なし。
- 新鍵で書込、旧鍵は読取用に保持しsession利用時に再暗号化。旧参照ゼロまたはsession終了を確認して旧鍵除去。緊急時は対象session失効、企業データは消去しない。失敗で有効な旧値を壊さない。
- 入力はC4の厳密schemaとbolt-planの上限。JSON1MiB、構造256KiB、各配列100、一般文字5000、本文／訂正OCR50000 code points、会社名200、業界200、URL2048、Web50件／content5000／category200。上限超過を黙って切り詰めない。eventDateは空か実在日、保存日付はDateOnly。
- **機能設計レビューの未解消項目への計画案**：overview.companyName／eventName／speakersは、bolt-planの個別500 code pointsを優先して保存入力で500に固定する。eventDateは既存空または実在日、既存CompanyEventInfoにspeakersを追加しない。他の一般構造文字5000は維持。本計画の本人承認でこの適用を確認し、レビュー済み上流文書は書き換えない。
- DTOには画像・filename・object URL・ownerId・server版等の非許可保持欄なし。手入力本文は空白だけ拒否、本文trim／自動構造化なし。本人が比較用項目を追加した時だけ全項目編集枠を作り、本文と別に明示保存。旧localStorage比較の保存形式・データは変更しない。
- private/no-store、Origin欠如／不一致403、未認証401、非所有対象と不存在は同404。既存structureのnot_configuredは承認bolt-planの現実装500を維持し、古い契約例503へ勝手に変更しない。他の既存provider写像・timeoutと保存APIの写像を分ける。
- UIの要求世代、dirty draftと固定pending requestを本人に結び、401／logout／対象切替で保護cacheと遅延応答を無効化。再ログイン後同じ本人のみdraftを戻し、latestを読んで明示再編集。POST自動再送なし、結果確認GET後同じ要求／IDの明示再試行、GET最大1回500ms後。reloadを越えるdraft保持なし。
- SSR静的表示試験＋純粋state／API client試験、実操作は承認済み手動。主要controlにdata-testid、label、focus制御を付け、色／dragのみの操作を作らない。安全Markdown・http/https URL、rawHTMLなし。headersは既存画像／preview／DLの回帰を確認。新CSP製品を追加しない。
- ローカル試験DB／実環境のschema・role・session・鍵・Originの分離を維持し、ローカル実DBで権限を検証。外部の実設定は本人の後日作業。backup／restoreは手順を用意し、使い捨て架空DBでID・版・owner・成功operationsを確認。新cron・自動backup製品・Vercel設定を追加しない。

## Execution Steps

各testable layerはrunner確認→Red→Green→Refactorの順。各Redはその対象の未実装／振る舞い違反で実行失敗した出力を公式Unit記録へ残す。架空fixture・dummy Auth/providerだけを用い、環境エラーは先に解決する。未承認のまま以下を実行しない。

- [x] Step 1 — 本改訂のローカル着手条件を照合し、最新mainから専用release branchを準備。他者のdirty差分を保持。実Supabase準備・導入Bolt公開確認を待機条件にしない。非testable作業として状態・diffを確認。
- [x] Step 2 — exact依存・試験設定・PostgreSQL17 service／compose・dummy bootstrap・coverageを準備。npm test scriptの既定--passWithNoTestsを除き、承認済みexact readinessでtests/sample.test.tsを実行。DBhealthと使い捨てを確認。環境／引数失敗はRedではなく、純粋設定に人工Redなし。
- [x] Step 3 — Data model/database Red：tests/u1-company-notes/schema.test.ts／database.integration.test.ts。US1.2、US2.1/2.2、US6.1/6.3/6.4/6.5。型、所有者FK/RLS、版、原子性、画像欄拒否、限界・日付・URLの失敗。
- [x] Step 4 — Data model/database Green：contracts／schema／validationとdb/migrations/001-company-workspace.sqlを最小実装しStep3をgreen。会社・メモ別正本と操作記録を保持。
- [x] Step 5 — Data model/database Refactor：validation／SQLを整理しStep3を再実行。テストassertionと承認上限を弱めない。
- [x] Step 6 — Repository/data access Red：repository.integration.test.ts／session.integration.test.ts。US1.1/1.2、US6.3〜6.5、US8.1の提供契約。別owner、原子rollback、同時操作／refresh、期限、接続返却、snapshot。
- [x] Step 7 — Repository/data access Green：database／repositoryと限定session storeを実装。transaction/context／pool3／索引／cancel／destroyを実DBでgreen。
- [x] Step 8 — Repository/data access Refactor：lock順と残deadline・SQL mappingを共通化。独立接続の競合試験をgreenに保つ。
- [x] Step 9 — Business logic Red：auth.test.ts、crypto.test.ts、workspace.test.ts、board.test.ts、generationReceipt.test.ts。US1、US2、US3、US4、US5提供契約、US6、US7.1、US8提供契約。所属・出自・版・再送・削除・counts。
- [x] Step 10 — Business logic Green：AccessControlとCompanyWorkspace service、crypto・出自検証、board導出を実装。Auth.getUser等のserver検証と失効をdummy adapter＋実DBで確認。
- [x] Step 11 — Business logic Refactor：共通guard／error分類／正規化を整理。本文・構造・志望度・理由を混ぜずStep9をgreenに維持。
- [x] Step 12 — API/endpoint Red：routes.test.ts／authRoutes.test.ts／existingRoutes.test.ts。US1.1/1.2、US2/3/4/6、US9.1/9.2共有境界。C4全method/body/query/status、401/403/404/409/410/413、確定再送200、health公開。
- [x] Step 13 — API/endpoint Green：一覧・companies/memos・確認／削除／operations／comparison-sources、auth3ルートを実装。既存4ルートに共通認証を接続し既存provider入力と写像を維持。
- [x] Step 14 — API/endpoint Refactor：共通request検証／no-store／requestIdを整理しStep12と既存route回帰を再実行。秘密・内容のdumpなし。
- [x] Step 15 — Frontend behavior Red：client.test.ts／draft.test.ts／ui.test.ts。US1〜4、US6.1〜6.5、US7.1、US9.1。要求世代・unknown固定要求・dirty移動、空／失敗の別、日付、構造追加、出力。
- [x] Step 16 — Frontend behavior Green：workspace UI／page／client／共通ナビを実装。本人状態で生成・旧比較入口へ接続し、保存メモの情報区分と本文出力を維持。
- [x] Step 17 — Frontend behavior Refactor：画面のstate／dialog／propsを整理しStep15を再実行。keyboard／focus／スマホの手動例も確認。
- [x] Step 18 — Environment/build：既存verify CIのPostgreSQL17・実migration試験・coverage>=80、アプリNode runtime／headers・試験環境分離を確認。Docker変更を確認。外部秘密なしでbuildし、実接続をbuild要件にしない。Vercelの設定変更・deploy・公開URL検証は行わない。
- [x] Step 19 — Documentation/acceptance：.env.exampleの後で埋める空欄、docs/company-data-setup.mdに取得場所・本人Auth・backup／restore・実環境とdeploy引継ぎを記載。U1ローカル手動例、実DB証拠、lint/typecheck/test/build、coverage／既存回帰を確認。容量・性能はローカル参考値と外部未確認を区別。
- [x] Step 20 — Evidence/handoff：code-summary.md、traceability.json、source-manifest.jsonを実際のコード／ローカル・CI試験結果で作成。BR／U1 AC、U2/U3 Deferredと提供契約を区別。実Supabase・外部性能・公開受入の未確認と本人担当を明記しレビュー／公式checkpointへ。実環境を合格・Bolt公開完了としない。

## Story to Code Steps

| Story | 主なSteps | U1の到達点・後続確認 |
|---|---|---|
| US1.1、US1.2 | 3〜17 | Auth／owner／PCスマホ再取得。生成・比較追加入口の回帰はU2/U3共同 |
| US2.1、US2.2 | 3〜17 | 企業作成／項目明示編集、版、日付、ID |
| US3.1、US3.2 | 9〜17 | ボード／詳細、8状態、空と失敗、保存結果 |
| US4.1 | 9〜17 | 0/4/5/14/15/16、ID単位、表示切替不変、登録非制限 |
| US5.1、US5.2 | 3〜14、19 | 保存契約・構造／出典／出自・再取得をfixtureで確認。OCR訂正・生成保存UIはU2 |
| US6.1、US6.2、US6.3 | 3〜17 | 複数メモ、別正本、未保存、競合、unknown |
| US6.4、US6.5 | 3〜17 | 確認と整合削除。比較参照の画面無効化はU3 |
| US7.1 | 9〜17 | 本人による構造追加・別保存、比較理由。比較再表示はU3 |
| US8.1 | 6〜14 | readComparison1企業1メモ、snapshotと独立更新。7観点UI／参照確認出力はU3 |
| US9.1、US9.2 | 12〜19 | 本文出力、共通本人境界、既存出力を維持。生成・復習UIはU2、比較出力はU3 |

## Test Files and Acceptance Evidence

| 分野 | 新規試験file（tests/u1-company-notes/） | 基本量・根拠 |
|---|---|---|
| 入力／model | schema.test.ts | 8件以上＋パラメータ化境界。US2/6/7、BR2/5/6/10 |
| Auth／crypto | auth.test.ts、crypto.test.ts、generationReceipt.test.ts | 各6〜8件以上。US1、偽署名・tag・key rotation、別本人・失効 |
| 業務／board | workspace.test.ts、board.test.ts | 各6〜8件以上。US2/3/4/6、8状態・15/16・再送 |
| 実DB | database.integration.test.ts、repository.integration.test.ts、session.integration.test.ts | 各8件以上。RLS/FK／全rollback／同時refresh・logout・版・削除・deadline／restore |
| API | routes.test.ts、authRoutes.test.ts、existingRoutes.test.ts | 各6〜8件以上＋全C4ルート表のパラメータ化。認証・Origin・失敗分類 |
| Client／UI | client.test.ts、draft.test.ts、ui.test.ts | 各6〜8件以上。旧応答拒否・dirty・unknown・SSR表示／出力 |

80件以上は計画量の下限で、実際のfile別件数とAC対応を実行後に記録。happy path＋少なくとも2つのエラー／端条件を各対象に含める。tests/既存suiteは維持する。最終全アプリlines>=80は本書の明示義務で、下のTesting Contractのscope_floor表現が追加なしでも承認bolt-planとteam/projectの80%を置き換えない。

自動試験だけでdialogのTab／Escape／focus、実ブラウザ操作、2端末、実provider公開受入を合格にしない。手動例・実測の実行条件・SHA・期待／実際・未実施は別証拠にする。

## Release Verification and Human Deployment

Unit正式checkpointは人間登録済みnpm test -- --passWithNoTests=false。PR前はnpm run lint／npm run typecheck／npm test／npm run build、npm test -- --passWithNoTests=false --coverageとローカル手動確認を実行。Unit反復はunit-test-instructions.mdのexact fileに絞る。検証コマンド・品質目標を維持する。

全3Unitを直列で揃え、ローカル・CI試験とAC対応、架空fixture／実DBの容量・復元・性能参考値を記録して日本語PRを1つ用意する。人間mergeを維持。実Supabase接続・本人ログイン・外部性能目標・本番受入は未実施ならそのまま引き継ぐ。

Vercelのdeploy・環境登録・公開確認は本人が担当。実装担当はこれらや旧Bolt公開確認で待機せず、deploy設定・region変更・公開URL監視・第二workflowを追加しない。行っていない確認を合格・release完了と記録しない。本人へ接続／ログイン／企業保存／2端末／競合／削除等の手順を渡し、公開結果は後日、本人から受けた実結果として記録できる。

## Sources

- ../../../inception/requirements-analysis/requirements.md、../../../inception/user-stories/stories.md、../../../inception/refined-mockups/interaction-spec.md — FR／AC／利用操作。
- ../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md、unit-of-work-dependency.md — U1責任と直列順。
- ../../../inception/contract-design/contract-summary.md、../../../inception/delivery-planning/bolt-plan.md — 正式契約と後から具体化・承認した上限／認証／検査。
- ../functional-design/functional-spec.md、entities.md、rules.md、traceability.json — WF・23BR・U1対応と後続Deferred。
- ../nfr-requirements/、../nfr-design/、../infrastructure-design/ — 33詳細NFRと配置／本人回答。
- ../../../verification/bolt-001-prerequisites.md、revision-01.md — 過去確認と今回の着手時期・担当変更。
- package.json、vitest.config.ts、.github/workflows/ci.yml、src/lib/structure/schema.ts、src/lib/types.ts、app/api/ocr/route.ts、tests/ocrRoute.test.ts — brownfield読取。
- [Supabase JS registry](https://registry.npmjs.org/@supabase%2Fsupabase-js/latest)、[pg registry](https://registry.npmjs.org/pg/latest)、[pg types registry](https://registry.npmjs.org/@types%2Fpg/latest) — 2026-10-15のnpm viewによる版・engine照会。最新追随でなくこの計画版を固定。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "tdd",
  "source": "project",
  "ordering": "For each applicable testable layer: Red, then Green, then Refactor.",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: tdd\n- **Methodology evidence**: 2026-10-10の人間の「TDDで実装したいな」、project.mdおよびAGENTS.mdの明示方針。現行テストやcommit順からTDD実践済みと推定したものではない。\n- **Ordering**: 新規・変更する振る舞いと不具合修正は各対象レイヤーのrunner確認後、受入基準に対応する失敗テストを実行するRed、最小実装で通すGreen、テストをgreenに保つRefactorの順に進める。\n- 環境不備や無関係の失敗をRedとせず、コマンドと結果を公式Unit記録に残す。アサーションを弱めない。純粋な文書・設定変更は非適用理由と検証方法を承認計画に示す。\n- Test StrategyはStandard。Classic/orgのline coverage 80%下限を維持する。現在はcoverage provider・設定・レポートがなく達成未確認。計測対象、provider、CI接続は後続計画・承認で解決し、この段階では新依存を追加しない。\n- 現行Vitestはnode環境、純粋関数/API fake client/静的SSR中心。Q1の人間回答Aに従い、既存Vitestと手動の画面確認を受入検証の基本にする。後続の承認計画に具体的な操作、期待結果、証拠の残し方を記載する。新しいブラウザ自動テスト依存を自動採用しない。\n- PR前にnpm run lint、npm run typecheck、npm test、npm run buildと承認済み受入基準を検証する。Docker変更時はDockerも確認する。\n- テスト/CIはdummy providersを使い、実API秘密情報や個人メモを用いない。公式runtimeはアプリ検査から除外し、公式doctorと信頼済みセッションで確認する。"
    },
    {
      "layer": "project",
      "text": "Methodology: tdd\nOrdering: For each applicable testable layer: Red, then Green, then Refactor.\n\n- ユーザーが本プロジェクトの実装方針として TDD を選択した（2026-10-10 の会話「TDDで実装したいな」）。これは運用方針の選択であり、個々のアプリ Bolt の Inception / Code Generation Plan Approval を代替しない。\n- 新規・変更する振る舞いと不具合修正は、受入基準に対応するテストを先に書き、対象の未実装／不具合による失敗を実行して確認する（Red）。実行環境の不備や unrelated failure を Red の証拠にしない。\n- テストを通す最小実装を行う（Green）。その後、既存テストと新規テストを green に保って整理する（Refactor）。成功させるためだけに受入基準やアサーションを弱めない。\n- 既存のテスト runner / Unit 対象コマンドを Red の前に確認する。対象レイヤー、受入基準とテストの対応、実行コマンド、Red / Green / Refactor の結果を公式 Unit 記録に残す。\n- 実行可能な振る舞いを持たないドキュメント・純粋な設定変更に人工的な失敗テストは作らない。適用対象外の理由と検証方法を計画に示す。テスト量・coverage・CI の既存要件は維持する。\n\n- Before the release PR, pass npm run lint, npm run typecheck, npm test, and npm run build; also verify the Bolt's user-facing acceptance criteria.\n- Keep the official runtime outside application lint/typecheck/format checks; validate it with aidlc doctor and trusted-session $aidlc --doctor.\n- Tests/CI use dummy providers and do not call real OpenAI/Google Drive APIs or log private notes or secrets."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "tdd",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - Red: write the failing tests and record the failing command output.",
      "Data model / database behavior - Green: implement only enough behavior to pass.",
      "Data model / database behavior - Refactor: improve the implementation while tests stay green.",
      "Repository / data access - Red: write the failing tests and record the failing command output.",
      "Repository / data access - Green: implement only enough behavior to pass.",
      "Repository / data access - Refactor: improve the implementation while tests stay green.",
      "Business logic - Red: write the failing tests and record the failing command output.",
      "Business logic - Green: implement only enough behavior to pass.",
      "Business logic - Refactor: improve the implementation while tests stay green.",
      "API / endpoint - Red: write the failing tests and record the failing command output.",
      "API / endpoint - Green: implement only enough behavior to pass.",
      "API / endpoint - Refactor: improve the implementation while tests stay green.",
      "Frontend behavior - Red: write the failing tests and record the failing command output.",
      "Frontend behavior - Green: implement only enough behavior to pass.",
      "Frontend behavior - Refactor: improve the implementation while tests stay green.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:a81ff743a3d49d0b372ca217833d3121675db14e36b6566d65f53925c5db9985",
  "contract_sha256": "sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440"
}
```


