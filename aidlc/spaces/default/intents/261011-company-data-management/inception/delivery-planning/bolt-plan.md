# Bolt 002 — 企業メモ・選考状況管理の実装計画

## Scope and Approval Basis

Boltは、動く改善を作り検証して公開する開発のまとまり。今回の1 Intentを1リリースBoltとし、UI・API・認証・保存・生成接続・比較・検証を揃える。delivery-planning-questions.mdの実回答Q1〜Q5=a、補足「使っている。1つある」を入力とした最終計画案。文書作成・質問回答は、最終Inception計画やCode Generation Plan Approvalの承認を代行しない。

実装範囲は承認済み49要件、18ストーリー、90受入条件。状態8種類／通常6種類、次の選考日の強調、応募済・書類選考・面接だけの企業ID単位の集計、15社以上の警告、複数メモと1企業1参照比較、本文と構造化項目の別正本、紙とWebの分離を維持する。Drive、カレンダー、通知、共有、公開会員募集、旧データ移行、保存DBからの復習連携、既知不具合の一括修正は追加しない。

## Release and Implementation Sequence

2026-10-14にGitHubのリリースbranchを全ページ、同名のgit remote refs、BoltのPR履歴を照合した。使用済み番号は001、次の番号を**002**とする。予定branch: `release/bolt-002-company-data-management`。branchは未作成。実際の作成直前に再照合し、他の予約があれば次の未使用番号へ変更して計画を確認する。

| 順 | Unit | 主な結果 | 独立した確認・デモ | 次へ進む条件 |
|---|---|---|---|---|
| 1 | U1 / u1-company-notes | 本人確認、企業・手入力メモ、状態・日付・社数、編集・版・再送・削除、本文出力 | 本人ログイン→名前だけ登録→手入力保存→別クライアント再取得。架空の構造化メモも直接保存して検証 | 適用する設計・コード計画承認、TDD、実DB整合性、画面と所定のチェックポイント |
| 2 | U2 / u2-generated-notes | 訂正OCR・生成候補の企業保存、出自・出典・画像非保存、既存復習・出力の維持 | 架空画像＋dummyで訂正→生成→確認→企業保存→再取得→復習出力 | U1の保存契約を使用し、生成名不一致・失敗・結果不明・出典の受入を確認 |
| 3 | U3 / u3-company-comparison | 保存企業と選択メモの7観点、企業志望度・メモ理由の編集、参照確認と比較Markdown | 各社1メモ選択→比較→修正再取得→出力。別端末変更・削除参照・旧比較も確認 | 全体の90条件・回帰・共通検査を揃える |

順序は人間のQ3=aによるリスク優先。U1は前提、U2は画像から保存する境界の不確実性を先に確認し、U3で同じ正本の比較を完成させる。DAGはU2→U1、U3→U1だけ。経済的な順序を決めたことはDAG変更や並列実行の許可ではない。

実行はunit-major／serial、チェックポイント付き。このセッションのAI開発担当が順に実行する。Classicは専用の最小構成リリースを設けない。U1／U2だけの途中完了を別PR・別本番リリースにしない。

## Preconditions Before Application Implementation

- 最終Inception計画の実際の人間承認、各適用段階・検証コマンド・Code Generation Plan Approvalが必要。
- 導入[PR #100](https://github.com/papaiyaryo/briefing-note-ai/pull/100)は2026-10-14の取得時点でopen、draft=false、merged=false、merged_at=null。headは8e528e2f983479805e27f601dbd4683dade323e0。APIが返すmerge_commit_shaは未マージPRの値なので実merge SHAとして扱わない。人間がCIを確認してマージし、その実SHAのVercel成功・公開ページ・health・既存基本操作を確認するまで、次のアプリBoltを実装しない。
- 更新されたmainを基点にrelease branchを用意し、未コミットのIntent記録と人間の変更を保全する。現在の導入branchへアプリ変更を混ぜない。docs/status-2026-10.mdや既存index.htmlなどの変更外のファイルを勝手に取り消さない。
- 人間が新しい専用Supabase Freeプロジェクトを用意し、管理側で本人アカウントを作成する。既存1プロジェクトのデータや設定は変更しない。無料枠・利用可能枠・選定リージョン・DB版を実設定で確認する。秘密値は管理画面／ローカルの未追跡環境設定へ登録し、会話・Intent記録・commitへ書かない。
- 認証・DB・鍵・ローカルSQL試験の設定はInfrastructure Designとコード計画で最終照合する。設定不備をTDDのRedとして記録しない。設定が用意できなくても今回の計画は作れるが、実装開始条件を成功扱いにしない。

## Storage and Authentication Decisions

Q1／Q2=aに従いSupabase FreeのPostgreSQL＋Authを採用し、一般サインアップ・匿名ログインを無効にする。本人の確認済み初期アカウントを管理側で作り、メール＋パスワードでログインする。SMTP／マジックリンク／自動メール復旧を追加せず、忘れたパスワードは管理側で復旧する。PC・スマホは同じ本人を使う。

Next.js API Routesからだけ保存DBへ接続する。DBの更新・削除は一つのPostgreSQLトランザクションで版照合・所有者・変更・操作結果を確定する。新しい専用の非公開アプリスキーマと、必要な権限だけのサーバーDBロールを用意する。通常処理にpostgres管理者やservice_roleによる全権アクセスを使わず、anon／authenticatedの公開Data APIからアプリ表を変更できない権限とする。SQLはパラメータ化し、認証由来の本人をトランザクション内の所有者コンテキストへ設定して、RLSでも本人の行へ制限する。セッション検索用の権限は別に絞り、本人を設定する前に企業行を読まない。

サーバー用のAuthクライアントとDBドライバを採用する。候補依存は`@supabase/supabase-js`、`pg`、型定義`@types/pg`。使用版はU1のコード計画で現在のNode／Nextとの互換を照合し、lockfileで固定してから追加する。SSRのブラウザAuthクライアントやORMは追加しない。VercelではSupabaseのtransaction pooler、少数接続（プロセス最大3、接続待ちを含む有限時間）、TLS証明書検証を使用する。名前付きprepared statementをtransaction poolerへ持ち越さない。構成が成立しない場合は計画変更を承認してから進める。[接続方式](https://supabase.com/docs/guides/database/connecting-to-postgres)

### Session Boundary

ブラウザへは推測不能なアプリセッション値のHttpOnly Cookieだけを返す。本番Secure、SameSite=Lax、Path=/、Domain指定なし。Authのaccess／refresh tokenはサーバーのセッション保存領域で暗号化し、localStorage・JavaScript・レスポンスJSONへ出さない。暗号鍵と生成出自署名鍵を別のサーバー環境値として管理する。

セッションはサーバーで絶対7日・非操作24時間を上限とし、refreshを直列化して別要求の更新を壊さない。全保護要求で有効なアプリセッション、Authが検証した本人、本人の対象所有権を確認する。Cookieや未検証のJWTを読むだけで本人と決めない。ログアウトは現在のアプリセッションをDBで失効させ、CookieとUIの保護キャッシュ・遅延要求を除去する。古いJWTが期限まで有効なことを、アプリログアウト後のアクセス許可へ使わない。外部Authの失効も試みるが、アプリ側の失効をその成功だけに依存させない。失効書込が確定できなければ成功を断定せず、再確認・再試行を示す。他端末のセッションを勝手に終了させない。[セッションの性質](https://supabase.com/docs/guides/auth/sessions)

ログイン／ログアウト／セッション確認はU1が所有する`/api/v1/auth/login` POST、`/api/v1/auth/logout` POST、`/api/v1/auth/session` GET。ログインbodyはemail／passwordだけ、成功応答は認証済みの表示状態だけ。パスワードを保存・ログしない。変更POST／PATCHは同一Originを検査し、認証応答もno-store。ログイン失敗のmessageでアカウント存在を漏らさない。ログイン入口とhealth以外の保存・比較・既存生成／復習は保護する。

## Persistent Schema and Integrity

ここで保存先・型・制約を固定し、実際のSQL migrationと索引・権限DDLをU1のFunctional／Infrastructure Designで具体化・承認する。契約DTOと保存表の所有者を変えない。

| 保存表 | 主キー・型・主要項目 | 一貫性・保持 |
|---|---|---|
| companies | company_id UUID PK、owner_id UUID、name text、industry／interest_level／personal_note／official_url nullable、selection_status 8値、next_selection_date／application_deadline date nullable、version UUID、children_version bigint、created_at／updated_at timestamptz | owner＋company IDに一意制約。name空白のみ拒否。state初期not_applied。版はサーバー発行、子集合版は各メモ変更で増加 |
| memos | memo_id UUID PK、owner_id UUID、company_id UUID、origin／provider_origin、markdown text、structured_content jsonb nullable、corrected_ocr text nullable、event jsonb nullable、adopted_web_sources jsonb、comparison_reason text nullable、version UUID、日時 | owner＋companyの複合外部キー。企業削除時cascade、同じトランザクション。origin／所属／provider出自は作成後不変。JSONと本文を別正本として検証 |
| write_operations | owner_id＋operation_id UUID複合PK、要求SHA-256、action、対象UUID、確定結果の版と日時 | 対象へのFKで削除しない。成功変更と原子的に保存。本文・OCRの複写なし。本人の保存領域がある間保持。削除済みIDの別新規作成も拒否して識別子を再利用しない |
| deletion_snapshots | confirmation_id UUID PK、owner_id、対象、企業版・内部子集合版、全メモID／版のjsonb、件数、issued_at／expires_at | 本人だけ取得、10分有効。期限後は片付け可能。企業・子集合を照合して同じトランザクションで削除。操作記録が先に成功再送を判定 |
| app_sessions（認証の内部保存） | session値のハッシュPK、user_id、Auth session ID、暗号化token、絶対期限／最終利用／失効日時、更新版 | APIへ返さない。暗号鍵はDBに保存しない。失効・期限・refresh競合を扱う。終了後の不要なtokenは消去 |

索引はcompanies(owner_id, selection_status)、memos(owner_id, company_id, updated_at desc, memo_id)、operation PK、確認期限、session期限を基本にする。ボードと比較は整合した読取スナップショット。企業を先にロックしてから所属メモを扱う順序を全書込で揃え、削除照合とメモ追加・編集・削除の競合を直列化する。後続詳細設計は版・子集合・操作記録を別トランザクションへ分けてはならない。

## Input and Response Limits

以下は計画承認対象の新保存APIの制約。代表量や15社を登録上限にしない。限度超過は明示エラーと入力保持で扱い、自動切詰めしない。

| 入力 | 上限案・意味 |
|---|---|
| 新保存JSON要求 | UTF-8で1 MiB。全体上限と項目上限の両方を検査 |
| 企業名／業界 | name 200 Unicode code points、industry 200。nameは前後空白除去後に必須 |
| 企業自由メモ／比較理由 | それぞれ5000 code points。任意空欄はnull |
| 手入力／保存本文、訂正OCR | 各50000 code points。空本文の手入力は拒否し、空の構造化比較メモを勝手に作らない |
| 構造化JSON | 全体256 KiB、既存全項目、各配列100要素以下、各文字項目5000 code points以下。配列空は未記載。本文から自動生成しない |
| 採用Web | 50件／メモ、content 5000、category 200、URL 2048 code points、出典URL・取得日時・adopted必須 |
| イベント／URL | companyName／eventName／speakers各500、eventDateは空または実在日。公式URL2048、http／httpsのみ |
| 比較 | 1要求は1〜20企業、各社1メモ。選択0はUIの対象なし。20は同時比較要求の上限で、企業登録上限ではない |
| メモ一覧 | 既定20、最大100／ページ。本文を返さない。企業の正確な所属件数は別の集計 |

既存画像アップロードの最大20枚／1枚10 MiBと既存生成入力形式は変更しない。Vercelの要求body上限と現在の10 MiB表示には以前から制約差があるため、大画像の既知問題の一括修正をこのBoltへ混入させない。受入画像は1枚64 KiB以下の架空画像を使い、実際のHTTP通過と一時解放を確認する。大画像の保証や未検証の全入力対応を宣言しない。新保存APIの1 MiBは画像送信とは別。[Vercel上限](https://vercel.com/docs/functions/limitations)

## Existing Structure Error Compatibility

Q4=aを、Contract Design C5のHTTP写像に対する明示した例外として計画に組み込む。最終計画承認後は、構造化ルートの回帰条件について本節を参照する。契約原本とレビューの履歴を勝手に書き換えない。これはHTTP値を統一する変更ではない。

| /api/structureの現行条件 | 維持するcode／HTTP |
|---|---|
| JSON読取不能／要求形不正 | invalid_input／400 |
| openai選択時にキー未設定 | not_configured／500 |
| runStructureがStructureErrorを返す | 当該error.code／422 |
| OpenAiRequestError.statusが429 | rate_limited／429 |
| その他provider例外・現在のabort経路 | provider_error／502 |

今回追加する共通認証・Origin拒否は401／403。他の既存ルートが使うserver/errors.tsの写像は維持する。新保存APIの競合・結果不明の応答と、生成の失敗を混同しない。未設定のHTTP500を503へ変える試験は追加しない。

## Finite Timeouts and Performance Targets

新API: ブラウザ15秒、サーバー10秒、DBトランザクション全体8秒。SQL statement_timeoutに加え、全体deadline・取消し・ROLLBACK・接続返却を扱い、期限後に同じ接続へ残ったSQLを実行しない。GET自動再試行は500ms後の1回だけ。POST／PATCHは自動再送なし。結果不明は同operationIdの結果確認・本人の再試行、確認変更は最新取得と再確認。

生成はprovider30秒／サーバー40秒／ブラウザ45秒。Node.jsルートのmaxDurationを保存15秒・生成60秒へ明示し、実Vercel設定とビルドで確認する。上限内に収まらなければ課金や無制限化へ進まず修正・再承認する。関数の上限は処理速度の保証ではない。[関数上限](https://vercel.com/docs/functions/limitations)

代表fixture: 100企業・1000メモ、1社50メモ、880件の約1000字・100件の約5000字・20件の約10000字の本文。対応するOCR／構造化項目にも長文例を含め、Web各4項目と10,000件の小さい操作記録を用意する。概算は日本語UTF-8、JSON・索引・DBベース領域を含む200 MiB以内を予算とし、実DBサイズで確認する。最大長・最大出典数を全1000件へ適用した場合まで無料枠に収まる保証ではない。

応答目標: 認証済みの保存／読取／メモ一覧／20社比較のAPI p95 2秒以内、50メモ付き企業削除p95 3秒以内。初回の認証・Vercel cold start・無料プロジェクト復旧は別に記録し、平均値だけで合格にしない。新しい専用プロジェクトと既存Vercelのリージョンを確認し、可能なら東京へ合わせる。

計測はPreviewのdummy生成・架空データ、同じSHA・指定ブラウザ、warm-up 5回後に各操作50回、同時クライアント2、通常ネットワークで実施。p95、最大、失敗数、端末／ブラウザ版、リージョン、fixtureのbytes、対象SHAを記録する。DB容量・ネットワーク・供給元は本物を使うが、実OCR／LLMや実個人データは使用しない。未達なら修正し、この条件を黙って緩めない。

## TDD and Verification Commands

新規／変更した各対象はrunnerとテスト環境を確認し、受入に対応する失敗を実行（Red）→必要最小の実装（Green）→greenを保った整理（Refactor）。実際のコマンド・対象AC・結果・commit／SHAをUnit記録へ残す。setup不備・無関係の失敗はRedにしない。

Vitestと既存SSR／純粋関数／API fakeを基本とし、ブラウザ自動テスト製品は追加しない。SQLの版・同時書込・削除・操作再送は、ローカルの使い捨てPostgreSQLへ**実際のmigrationとDBアダプタ**を接続して試験する。fake storeだけでトランザクションの合格を宣言しない。ローカルDBのmajor版を新専用Supabaseと合わせ、dummyユーザーのauth参照表を試験用に準備する。CIにも同版のPostgreSQL serviceを置き、実Supabase credentials不要でSQL試験を実行する。

| コマンド案 | 時点・意味 |
|---|---|
| `npm ci` | 固定依存を用意。設定・依存の準備でありRedではない |
| `docker compose -f compose.test.yml up -d --wait` | コード計画で作る試験専用DBを準備。アプリ用Composeの再構成や本番DB起動ではない |
| `npm test -- --passWithNoTests=false` | 各Unitのcheckpoint候補。既存＋完了Unitの受入・SQL結合試験を全実行、0件は成功にしない |
| `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` | Unitの所定確認とリリースPR前の必須4検査 |
| `npm test -- --passWithNoTests=false --coverage` | 80% line coverageと全テストのリリース確認／CI |
| `docker compose -f compose.test.yml down` | 試験DBを終了。人間の別DB／volumeを削除する操作を含めない |

coverageは既存Vitest 4.1.8に合わせた`@vitest/coverage-v8@4.1.8`を追加し、`src/**/*.{ts,tsx}`と`app/**/*.{ts,tsx}`の全アプリコードを計測する。テストファイル、Next生成物、公式AI-DLCだけ除外し、未計測ファイルを隠して達成しない。lines>=80をCIで強制する。GitHubの既存verify workflowにcoverageとローカルSQL試験環境を追加し、別デプロイworkflow・実外部API secretsは追加しない。

2026-10-14、正式なcheckpointコマンド`npm test -- --passWithNoTests=false`は人間の選択1（Approve）で確認し、公式コマンドで登録した。これはテスト実行済み・合格を意味しない。その他の計画とコード計画の承認は別に行う。U1コード計画に新規compose.test.yml、SQL migration、試験bootstrap、依存、coverage設定、CIへの変更を含める。文書と純粋な設定には人工的な失敗テストを作らず、型・構文・build・CI設定・差分を確認する。

## Acceptance and Manual Checks

90 ACすべてを実装時の試験／手動記録へ対応付ける。unit-of-work-story-map.mdの主担当と共同確認を用い、未完了Unitに跨る条件を先に完了扱いにしない。

| AC群 | 自動・SQL確認 | 手動の期待結果 |
|---|---|---|
| AC1.1.1〜4、AC1.2.1〜4 | 本人／別所有者／未認証、直接API、失効・遅延応答、別クライアント読取 | 本人ログイン→PC保存→スマホ再取得。ログアウト後の保護非表示 |
| AC2.1.1〜4、AC2.2.1〜5 | 名前だけ、入力限界・日付・危険URL、ID・所属、二重送信 | 登録ダイアログのfocus／Escape／破棄確認、任意欄保存 |
| AC3.1.1〜8、AC3.2.1〜6 | 8状態・6通常・終了表示、空と失敗、保存結果、次の日付 | 次の選考日を強調、締切別、終了再表示、全列への到達 |
| AC4.1.1〜7 | 0/4/5/14/15/16、検討中除外、企業ID集計、toggle不変 | 15以上だけ文字付き警告、16社目の操作可能 |
| AC5.1.1〜5、AC5.2.1〜5 | dummy、出自証明改変拒否、不正構造、画像非保存、情報区分・出典 | 画像とOCR訂正、生成名不一致でも同じ企業へ保存、dummy表示 |
| AC6.1.1〜4、AC6.2.1〜5 | 手入力・複数・別正本・失敗・安全表示 | 本文／項目／出典の編集、未保存移動確認、本文出力 |
| AC6.3.1〜4、AC6.4.1〜5、AC6.5.1〜6 | 実SQLの旧版、同時編集、同数メモ編集、部分失敗、削除後再送 | 最新を確認して再編集／削除再確認、既に削除・取得失敗で停止 |
| AC7.1.1〜4、AC8.1.1〜5 | 構造編集反映、1社1メモ、欠損・出典・旧保存分離 | メモ切替で7観点と理由が変わり企業志望度は保持 |
| AC9.1.1〜5、AC9.2.1〜4 | 対応するMarkdown、参照版確認、失敗出力禁止、既存復習回帰 | 本文・比較・既存復習の.mdを開き、表示対応と区分を確認 |

画面条件はPC1366×768、スマホ390×844、幅320／767／768、200%／400%拡大。PCキーボード、登録・削除ダイアログのfocus戻し、状態の文字表現、長文、危険なHTML文字列、リンクの安全性、画面読み上げのラベル／通知を手動確認する。実際のOS・ブラウザ版、スクリーンショットは架空データだけで残す。模擬HTMLの既存プレビューを実アプリの受入証拠に再利用しない。

## External OCR Data Boundary

現行OCRはOpenAI Responsesへ画像を送る。外部の標準abuse monitoringには内容が最大30日保持され得る。`store:false`でも外部の全保持がゼロになる保証ではない。画像の安全確認による保持例外もあり、本人組織がZDR承認済みとは仮定しない。[OpenAI Docsの保持条件](https://developers.openai.com/api/docs/guides/your-data)

U2で単発生成のResponses要求へ`store:false`を明示し、fake clientの送信契約で確認する。原画像をアプリDB・ストレージ・localStorageへ保存しないことと、外部保持の説明を画像確認画面の短い案内と資料で区別する。既存provider／modelを勝手に切り替えず、実APIの費用をSupabase無料枠と混同しない。CI／自動試験は常にdummy。

## Definition of Done and Deployment Checks

このBoltが検証する仮説は「本人が端末を変えて企業・複数メモ・選考状態を再取得し、明示した保存参照から比較・出力でき、競合や通信失敗で記録を黙って失わない」。受入証拠は90 ACと3 Unitの連携、TDD記録、DB整合性、型・lint・全テスト・build・coverage、PC／スマホの実操作。

全て揃ったら1つの日本語PRを作り、Intentと本計画、変更、AC証拠、検証結果、対象外、設定・deployment手順を記載する。人間がCI成功後に最終マージする。AIはmainへ直接push／mergeしない。

マージ後は実merge SHAを取得し、そのSHAのVercel deployment状態・URLと本番https://briefing-note-ai.vercel.app を対応付ける。ページ、公開`/api/health`のstatus:ok／service:briefing-note-ai、本人ログイン、企業作成、手入力保存、2端末再取得、状態／社数、編集／競合、比較／出力、確認削除、ログアウトを架空データで確認する。生成／復習の公開確認は実provider利用と費用が必要なら実行前に本人へ確認し、未実施を合格にしない。Previewは同じ候補SHAのdummyで全生成導線を確認する。実providerの本人許可が得られない場合は公開生成の受入を保留し、リリース完了を宣言しない。

失敗したら今回の承認範囲内で修正・再検証し、次Boltを実装しない。ロールバックは人間が承認したrevert PRと再デプロイで行い、保存データを戻す必要がある場合は事前に取得した本人管理のバックアップを用いる。実データをauditへ貼らない。SHA・URL・実行結果・未確認・feedbackを次Intentの入力へ残す。

## Sources and Remaining Human Checks

delivery-planning-questions.md Q1〜Q5の実回答a、承認済み上流9資料、package.json／vitest.config.ts／既存CI／app/api/structure/route.ts／src/lib/server/ocr.ts／src/lib/upload.ts、2026-10-14のGitHub PR・branch照合、各リンク先公式資料を根拠とする。

正式な検証コマンドは人間の選択と登録を完了した。未実施: 最終計画承認、PR #100の人間マージと対象SHA公開確認、専用Supabase作成・本人／鍵／接続設定、適用段階の詳細設計・Code Generation Plan Approval、全アプリ実装・受入・実測・本番確認。これらは具体的な着手／完了条件であり、達成済みとは扱わない。
