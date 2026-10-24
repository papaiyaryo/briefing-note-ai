# U1 TDD実行記録

## Scope and Baseline

基点df63c09be502bf5c9e50b58a69e2bacea5c39bc5、作業branch release/bolt-002-company-data-management-local。Node22.23.3をtask-local npm execで起動し、以下のnpm commandをその環境で実行。global設定・実外部秘密は使用しない。

Step2設定: test既定のpassWithNoTestsを外す。承認4依存をexact追加し、全アプリcoverage-v8 lines>=80を設定。別worktreeとtask-local cacheは現アプリの重複検査を避けるためrunner/lint/typecheckから除外し、src/appのcoverage対象は縮小しない。

readiness `npm test -- tests/sample.test.ts --passWithNoTests=false` はexit0、1file/1test成功。実装前baseline `npm test` はexit0、21files/103tests成功、skipなし。Docker Compose up --waitはexit0 healthy。実SQLのSHOW server_versionは17.6、試験専用DBと架空Auth参照2名を確認。tmpfsでデータを一時化、終了はcompose downで行う。

## Data Model / Database — Red

AC1.2、AC2.1/2.2、AC6.1/6.5、BR2/5/6/10のテストを先に追加して実行。

```text
npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/database.integration.test.ts --passWithNoTests=false
exit 1 / Test Files 2 failed
schema.test.ts: Cannot find module '../../src/lib/workspace/schema'
database.integration.test.ts: ENOENT db/migrations/001-company-workspace.sql
```

runnerと実DBは上記baselineで成立済み。失敗原因は対象schemaと実migrationの未作成。beforeAll失敗のためDB9試験はrunner上skippedとなったが、合格とは扱わずGreenで全実行する。時点12:06（2026-10-15、作業環境表示時刻）。この後にschema／SQLの最小実装を追加する。

## Data Model / Database — Green

同じexact commandをNode22で実行しexit0、2files/32tests成功、skip0（12:11）。RLS/context未設定拒否、normal role、別owner、複合FK、DB制約、非公開schema、原子的rollbackを実PostgreSQLで確認。共有型と実行時schemaを追加し、画像等の未定義保持欄を拒否した。

自己レビューで企業名をtrim前に文字数判定していた境界を発見。trim後200 code pointsの受入仕様に対応する追加テストを先に置き、次の実行で失敗を確認してから修正する。

補足Red（12:14）：同じgroupコマンドはexit1、追加したAC2.1.2だけ失敗、既存32件成功。trim後200文字の名前が「文字数の上限」で誤拒否された。最小修正でtrim→上限検証へ順序を直す。Refactorではhashのキー順をlocale非依存へ明確化し、架空Auth bootstrapの初期化をtransaction advisory lockで直列化する。

補足Green／Refactor（12:17）：修正と対象ファイルのPrettier整形後、同じexact groupがexit0、2files/33tests成功、skip0。SQLの親子・RLS条件とassertionは維持。

## Repository / Session — Red

```text
npm test -- tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts --passWithNoTests=false
exit 1 / Test Files 2 failed
Cannot find module '../../src/lib/server/workspace/database'
```

12:20実行。runner/実DBの成立後、未作成のDB adapter・repository/session実装を参照する両suiteが失敗。先に追加した試験は同時再送、版競合、削除後再送/ID再利用、実rollback/COMMIT応答途絶、cursor、DB期限、session共有排他・refresh/logout・両期限を対象とする。まだ試験の成功は認定しない。

## Repository / Session — Green and Refactor

12:26、同じexact groupはexit0、2files/18tests成功、skip0。shared sessionの限定SQL関数と行lock、session→operation advisory lock→親→メモ、RLS context、操作と対象の原子確定、永続ID予約、確認後の集合/版再照合、signed cursorを実装。実COMMIT後の応答途絶相当の故障でunknownを返し、別接続からcommitted照合に成功した。

Prettier後12:28の同groupもexit0、18tests成功。中間typecheckはexit1、pgのQueryConfig型がquery_timeoutを受け付けず失敗した。振る舞いRedではなく型統合不備。ROLLBACKには既に稼働している全体deadline timerを適用し、型のないquery optionを除去して再確認する。

12:31、修正後のrepository/session exact groupはexit0、18tests成功。`npm run typecheck`もexit0。接続待ちを含む期限とdestroy処理・SQL変換を共通化したまま、独立接続の競合をgreenに保った。

## Business / Auth — Red

```text
npm test -- tests/u1-company-notes/auth.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/board.test.ts --passWithNoTests=false
exit 1 / Test Files 5 failed
Cannot find module: workspace/service, workspace/board, auth/crypto, workspace/generationReceipt
```

12:37、5suiteが未作成の対象module参照で失敗。先に作成した受入試験を基準に、本人検証・token暗号化・出自検証・集計・正本分離を最小実装する。Supabase SDKのlocal logoutはpinned sourceのGoTrueAdminApi.signOutを照合し、本人JWT＋local scopeで管理鍵を用いない。

## Business / Auth — Green and Refactor

中断後、pending patch完了と実ソースを照合して再開。同じexact Business/Auth groupをNode22 wrapperで実行し、15:51 exit0、5files/42tests成功、skip0。`npm run typecheck`もexit0。本人検証、暗号化token、鍵rotation、署名/本人/provider束縛、refreshの実DB共有排他、外部logout失敗時の内部失効、8状態・active集計、本文と構造/志望度と理由の独立更新を確認した。

Refactorでguard/errorと正本別のservice境界を維持し、対象実装と試験をPrettierで整理。15:56、同じexact groupはexit0、42tests成功、skip0。対象SHAは共通base `df63c09be502bf5c9e50b58a69e2bacea5c39bc5` 上の未commit差分で、まだ実Supabase適合・公開受入は検証していない。

## API / Endpoint — Red

`npm test -- tests/u1-company-notes/routes.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/existingRoutes.test.ts --passWithNoTests=false`をNode22で実行。16:00 exit1、3files failed。HTTP adapter未作成により2suiteがimport失敗、既存4routeは認証/Origin境界未実装により各400（期待401/403）で8件失敗。既存healthにtimestamp欄があるため新試験の完全一致1件も失敗したが、これは試験の過剰制約でRed根拠から除外。既存公開契約の必須値とowner非公開を検証する形へ訂正し、health実装は維持する。C4全CRUD/操作/比較入口、401/403/404/409/410/413、作成201/再送200を試験する。

## API / Endpoint — Green and self-review Red

16:14、同じexact API groupはexit0、3files/33tests成功、skip0。typecheckもexit0。共通HTTP境界、実byte上限、厳密query、no-store、本人/Origin、C4と認証入口、後で設定するruntimeを接続した。既存health実装とprovider失敗写像は保持。

自己レビューの補足試験を先に追加し、Business/AuthとAPIのexact両groupを一つのVitest invocationへ合わせて実行（16:18）。exit1、2files failed/6passed、5failed/81passed。旧service_role JWT/未知key形式/資格情報入りURL/path付きURLを誤許可する4件と、外側server期限がCOMMIT不明をunavailableへ変える1件がRed。認証消費後の残期限と実SQL待ち中の書込rollback・遅延commit停止の2件は成功した。これから設定検証を厳密化し、request scopeへCOMMIT中の不確定状態を伝達する。

補足Green（16:24）：両group＋既存OCR/Web routeをNode22で実行しexit0、10files/92tests成功、typecheck exit0。設定の公開key形式・URL境界とCOMMIT状態を修正。既存routeのassertionは維持し本人Cookie＋実DB fixtureを追加した。Refactorで共通HTTP検査・エラー/no-store・限定runtimeを整理、動的importを有限mapへ変更しPrettier適用。16:29、API/Auth＋既存OCR/Web routeはexit0、6files/58tests成功、skip0。

## Frontend Behavior — Red

`npm test -- tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false`をNode22で実行（16:34）。exit1、3suite failed。未作成client/draft/CompanyBoardが直接原因。SSRケースはexact entry ui.test.tsからJSX helper uiCases.tsxを読む。有限GET/POST自動再送禁止、owner-bound draft、要求世代、状態表示と情報区分を対象に最小実装する。

初回Green（16:43）：同じexact group exit0、3files/28tests成功。typecheckは誤ったURL helper名1件でexit1（環境Redでなく統合不備）。実在isSafeUrlへ直し、controller/page接続後16:50の同groupもexit0、28tests成功、typecheck exit0。

補足Red（16:52）：本文だけ保存して別タブ編集を保持する、送信中の追加入力保持、新規メモ確定IDへのdraft移動、dirty判定の4試験を先に追加。同じexact groupはexit1、4failed/28passed。未作成reconcile/hasDirtyが直接原因。確定した欄だけを最新へ合わせ、未確定の他欄を新しい版へ結び直す純粋処理を追加し、controllerから呼ぶ。

補足Green（16:58）：同じexact group exit0、3files/32tests成功、typecheck exit0。別タブのdraft保持と送信後の追加入力を新しい保存版へ結び直し、新規メモでは確定IDへ移動。再編集は最新を読んだ後の明示操作とした。

既存client境界Red（17:02）：OCR/structure/Web/review clientの401が共通本人状態を無効化しない4件を追加し、同group exit1、4failed/32passed。provider入出力は変えずsame-origin/no-store・45秒と401通知を共有fetchへ接続。17:07同group exit0、36tests成功、typecheck/lintもexit0。

旧応答Red（17:10）：認証コンテキスト無効化後に遅れて返る保存/生成401が、新しい本人状態へ再び作用する2試験を先に追加。同group exit1、2failed/36passed。要求開始時の認証世代と現在を照合して通知し、ログイン/ログアウト/失効で世代を進める。

補足Green：認証世代の修正後、同exact groupは38tests成功、typecheck/lint exit0。最初の全suiteは278tests成功だがlines53.83%でcoverage exit1、品質目標は未達。計測対象と80%下限は維持した。

## 2026-10-16 再開・Frontend callback補完

公式resumeの同一Testing Contractとapproved計画を確認。pending patchの実適用を照合して二重編集を避けた。追加callback込み初回は1failed/52passed。void onClickが開始した非同期処理の完了前にassertしていたharness不備でありapp Redから除外。非同期完了を待つ修正後、同じClient/UI exact groupは53/53成功、exit0。追加harnessのReact型参照1件を修正しtypecheck exit0。SSR/callbackはDOM・focus・実browserの証拠にはしない。

全coverage再測定：36files/293tests成功、skip0、lines71.23%（1600/2246）でexit1。80%未達として、実設定拒否・SDK fake transport・画面callback等の未実行境界を補完する。

### ローカル実画面 focus Red → Green

既存Edgeの専用profileとloopback CDP、dummy Auth/provider＋実PostgreSQL17の隔離schemaで実行。helperがfalseでもexit0だった不備を先に修正。`node scripts/workspace-browser-check.mjs` のRedはexit1、企業名初期focusのみfalse、ログイン・名前のみ登録・手入力保存・HTML非実行・dirty移動取消・390px表示は成功。appのConfirmDialogへ初期focus指定を追加し登録だけfirst-input、危険操作の既定cancelを保持。Greenは同helper exit0、8項目成功（元6フロー・初期focus・idle3秒API追加0件）。画像は一時領域へ出力。外部Supabase・公開受入・2端末の証明ではない。

previewは確認時だけ起動。最初の5分寿命cleanupは専用既知PIDのtaskkillがAccess deniedでexit1。read-only CIMでそのPID/子なし、port3000停止を確認し、その隔離schemaだけ削除、専用Edgeも閉じた。次回は起動/停止権限を揃え、TTYのstop入力で専用Next停止・schema削除を示すJSONとexit0を確認、Edgeはhelperのfinallyで終了。旧大量ログと実行停止の因果は未確定。今回のidle3秒ではAPI要求反復なし、route初回compileと操作要求を観測した。

### 自己レビューの追加Red / Green

確定後の最新GET失敗で確定表示が消える、登録modalの外にunknown照会ボタンが出る2件を先に追加。Client/UIとBusiness/Authのexact groupを合わせた実行は2failed/123passed、exit1。appに関係しない試験側呼出ミスは先に直してRedから除外した。確定を保つエラー表示とmodal内照会へ最小修正後、Client/UI exact groupは55tests成功、exit0。削除modalの共通照会も同様に内側へ置く。

SDKは実通信しないfake fetchでsignIn/getUser/refresh/local logoutと上流失敗分類、runtimeは実migrationしたPostgreSQLと明示dummy設定・不正設定の拒否を確認。新試験のメソッド名・エラーコード/日本語messageの取り違えによる初回失敗はapp Redにしない。既存生成/旧比較のcallback・provider JSON検証と実App Router wrapperも追加し、Client/UI＋API exact groupは6files/106tests成功、exit0。

構造256KiBの境界を自己レビューで追加。Model/database exact groupは1failed/33passed、exit1。アプリschemaで正しいcompact JSON262144bytesを、DBのjsonb表示空白が余計に数えてCHECK拒否した。文字列内部の空白を保った再帰byte計算で、compact JSONの上限を変えず修正。上限と+1のDB検査はGreen、容量参考試験の引数不備を別途修正後、同exact groupは35tests成功、exit0。

### 品質・実DB復元・容量参考

全suiteとcoverage：36files/332tests、skip0、exit0。全アプリlines82.38%（1852/2248）、statements80.67%、functions78.90%、branches69.49%。80%のlines下限・include/excludeは維持。typecheck exit0。lintの新試験にある予約変数名moduleを修正しlint exit0。実秘密なしのbuildもexit0。後続の自己レビュー修正後に最終回帰を行う。

実PostgreSQL17でpg_dump customを専用隔離DBへpg_restoreし、5正本のowner/ID/版/成功operation等のdata fingerprintとschema fingerprintが一致、復元後RLSも本人1社・別本人0社。`node scripts/workspace-restore-check.mjs`はcleanup完了JSONとexit0。session暗号鍵が揃わない実復元では再ログインが必要であり、今回の架空復元は実環境backup成功の証拠ではない。

100社・1000メモ・10000operations、warm-up5回後に2clients各50回のlocal adapter参考値は全失敗0。p95/最大(ms)はboard39.12/86.23、detail26.03/30.92、memo page31.82/41.59、operation lookup26.45/36.24、50メモ企業削除（作成・確認の準備込み）154.64/206.32。一時JSONへ記録。実外部Auth・ネットワーク・pooler・公開API p95ではない。

本番依存auditは`npm audit --omit=dev --json` exit1、high5/critical1の6対象。Next15.5.19、sharp0.34.5、postcss8.4.31、nanoid3.3.12、source-map-js1.2.1、@vercel/analytics2.0.1はいずれもbaseと同一。追加のSupabase/pg/coverageはこのreportの対象にない。自動forced fix/承認外upgradeはしていない。Windows server/Image Optimization等の既存Next重大advisoryはリスクとして引き継ぐ。

追加keyboard確認はEscapeでtimeoutしexit1。Tab/Escape/h1はこの実行で成功としない。専用Edgeはfinally、previewはstopで専用schemaと共にexit0 cleanup。helper/CDP条件とアプリ境界の切り分け中。汎用compileの反復も観測したため、純粋設定としてTailwindのclass走査をapp/srcへ限定し、一時profile/cache/recordsを除外。変更後build exit0、native停止との因果は断定しない。

### Keyboard / focus の実Red → Green → Refactor

CDP Page.bringToFront・rawKeyDown/native key codeで再確認し、trusted Tab3回がcancel→confirm→BODY、trusted Escapeが届くが閉鎖/cancelなし、詳細h1未focusを記録。helper全体はexit1で、headers・元のフロー・idle0・危険操作cancel初期focus等は成功。失敗を残して独立項目まで確認したもので、assertionを弱めていない。

dialogのTab/Shift+Tab端wrapとEscape取消を明示し、詳細h1はcompanyIdの初回/会社切替だけfocusする最小修正。実Edge全フロー13項目がexit0、Tab→name復帰、Escape閉鎖/起動元focus、詳細h1を確認。Shift+Tabは別のkeyboard-only実行で6項目exit0、confirmへの後方wrapも実確認。専用Edgeはfinally、各専用preview/Next/schemaはstop入力後のcleanup JSONとexit0で終了した。以後buildとpreviewを重ねていない。

Node callbackに前後wrap・busy時のEscape拒否を含む4回帰も追加し、Client/UI exact groupは64tests成功、exit0。実DOM/focus証拠は上記Edgeで別記する。所有ファイルだけPrettier整形し、CIでも一時出力dirを作る試験準備を補正した。

### 最終検証

- npm run lint：exit0、warning0。
- npm run typecheck：exit0。
- npm test：36files/336tests成功、skip0、exit0。
- npm test -- --passWithNoTests=false --coverage：同336tests成功、exit0。全アプリlines82.48%（1869/2266）、statements80.78%、functions78.97%、branches69.76%。include/lines80下限を維持。
- npm run build：exit0、実外部秘密なし、全route生成成功。
- Compose config/PG17.6 healthy確認：exit0。Git diff --check：exit0。
- 既存js-yamlでCI parse：exit0、PG17 serviceとcoverage command確認。最初の未導入yaml moduleによる補助parse失敗は環境誤参照でありapp Redではない。新依存なし。GitHub CI実行とは区別する。

最終回収したlocal参考値はp95/最大(ms)：board58.49/138.40、detail24.16/29.98、page30.44/42.38、operation23.62/30.65、50メモ削除準備込み183.79/201.56。全失敗0、同fixture100/1000/10000、2clients×各50回。DB全体14,737,935bytes/専用schema3,366,912bytesを観測。外部p95・実Supabase Free枠達成としない。実装/試験/設定94pathsの作業tree fingerprintはcode-summaryへ記録した。

最終文書確認でNFR2.5/2.7・RD3の運用手順を補完。backupは変更日の終了時・deploy/形式変更前、24時間以内の成功取得を運用目標とし、成功日時/対象の本人管理・最後成功以降の損失可能性・自動RPO保証なしを明記。停止時のAuth/DB復旧→再認証→同operation照合、人間承認revert PRと対象SHA再配置確認、データ復旧の別判断も追記した。実行可能コード・試験・検証コマンドは変更せず、94path fingerprintを再計算し文書/所有境界を検証する。
