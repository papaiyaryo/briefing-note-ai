# U1：既知3不具合の修正証拠（改訂3）

## Baseline and Scope

承認済み改訂3のU1だけを実行する。実外部Auth/Supabase/Vercel・公開受入は対象外。旧review-02.mdと改訂2の40ms/operation_unknownは保持する。

- Runner準備：`npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` → 24/24、skip0、exit0。
- 変更前全体：`npm test` → 54 files / 587 passed、skip0、exit0、35.85秒。今回修正後の結果ではない。
- 既存U1 source aggregateは `4f419fdb5da964d28f61d712638557e56a497cf780389c508ea47578e293510c`。既存dirtyは保持する。
- PostgreSQL実測17.6、結合試験後のu1_test_隔離schema残存0。U2既存41file aggregate `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8`、U3既存29file aggregate `36a9f6f6cfaf75eeefdb116382f7a0d49ccfebe7436ca55d63421bac39d49d93`。作業中照合ではU3 mismatch0、U2は承認済みU1共有docのcompany-data-setup.mdだけ更新、他40file不変。最初の照合scriptはU2のhashes形式をfilesと誤読しexit1となったため、形式を合わせた再照合を実施した（アプリ試験ではない）。

## Repository — Red / Green / Refactor

対象：US6.4/6.5、BR6.5/6.6、NFR2.3/3.2、RD1。

初回 `npm test -- tests/u1-company-notes/repository.integration.test.ts --passWithNoTests=false`：15件中12成功・3失敗、exit1。実PGの `pg_blocking_pids` とLock待機を有限100回で観測してからDate.nowをexpiry+1へ制御した企業・メモ各caseは、期待拒否に反しcompany_delete/memo_deleteを確定して失敗した。これは対象不具合のRed。任意sleepだけで到達を推測せず、finallyでlock・clock・接続を解放した。

残るnow=expiryの初回失敗は試験側の誤り：repositoryのWorkspaceErrorにHTTP statusはなく、codeだけを保持する。存在しないstatus:410へのassertを除き、confirmation_expiredの厳密照合は維持する。HTTP410写像は既存route回帰で別に確認する。この失敗を対象不具合のRedに数えない。修正した試験を本実装修正前に再実行する。

修正後の試験を本体未変更で再実行：15件中13成功・2失敗、exit1、8.84秒。企業・メモの親Lock待機後だけが同じ誤った削除成功となった。now=expiry・期限内・成功再送は成功。setup失敗なし。

Green：同じexact commandが15/15、skip0、exit0、4.16秒。親ロック取得直後へ同じ期限照合を追加。executeの成功操作照合・session→operation→親の順は変更しない。

Refactor：最小差分とロック順を確認し不要な抽象化を加えず、同じexact commandが15/15、skip0、exit0、5.19秒。

## Restore — Red / Green / Refactor

対象US1.1、FR1.3、NFR2.6、RD3。`npm test -- tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts --passWithNoTests=false` の本体修正前Red：3 files、50件中46成功・4失敗、exit1、5.27秒。新6件のうち、logout旧Cookieと別の有効Cookieがok:trueへ復活、session/token各2行の残存、再実行時2行残存で失敗。企業データ同一性・fresh loginは成功。実PG＋runtimeFixture＋本物AccessControl。外部logout失敗時もアプリlogout成功・復元前拒否・旧行復元後認証成功を対照として実行し、SQL不存在そのものはRedにしていない。

Green：通常dumpからsession行を除外し、鍵の有無に依存せず共通保守SQLで復元session全行を除去する。scriptとtestは同じSQLを読み、会社データの同一性とsession行ゼロを別々に確認する。同じexact commandが3 files / 50/50、skip0、exit0、5.66秒。

Refactor：Red用の「SQL不存在なら旧処理」分岐を除き、今後SQLの欠落は明確なsetup失敗にする。同じ試験と実dump/restore手順を確認する。

- Refactor exact：3 files / 50/50、skip0、exit0、5.05秒。
- `node scripts/workspace-restore-check.mjs`：最初はDocker API/configへのsandbox権限不足でexit1（環境失敗）。承認済み使い捨てDockerへのアクセスで再実行exit0。実pg_dump custom→別の専用DBへpg_restore、通常session行0、古いsession行投入後共通SQLで除去、企業/メモ/操作/確認とDDL指紋一致、RLS owner isolation成功、session鍵に依存しない新ログイン必須。専用DB/schema/dump cleanup true。実外部backupは未確認。

## Frontend — Red / Green / Refactor

対象US6.3/AC6.3.2、BR6.3/6.4、NFR3.2。`npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/draft.test.ts --passWithNoTests=false`：2 files、56件中51成功・5失敗、exit1、6.59秒。実CompanyDetail/MemoWorkspace/mutation callbackを通した企業・メモ各409→最新取得は旧versionのまま、取得失敗caseはGETへ到達せずエラーを表示しない、移動取消後も最新内容を取得できない。owner別vaultの追加caseは成功。ブラウザDOM確認とは区別する。

Green：最新取得をmove/discardから分離。元draft/baseはvaultに残し、最新保存版と保持入力を別表示。版が違う間は編集/新保存を停止し、保持入力の明示再編集だけで新baselineへ移す。以下で実行結果を確認した。

Green初回は56件中53成功・3失敗、exit1。企業/メモのlatest取得・元draft/base保持・明示再編集→新version/new operationId保存は成功。2件は新試験がHTTP500の生messageを期待した誤りで、既存clientの安全な固定メッセージへ厳密期待を訂正する。残る既存構造編集caseは新しいdisabled fieldsetによりselectorが祖先を選んだため、専用testidで編集領域の祖先を除き従来の事実fieldsetを選ぶよう最小調整する。事実値のassertionは維持し、緩和しない。

訂正後Green：同じexact commandが2 files / 56/56、skip0、exit0、3.25秒。Refactorとbrowser手動は後続。

初回Refactor exact：56/56、skip0、exit0、3.53秒（2026-10-21）。手動確認でlatestの並列GETが503となり完了しないため、実HTTP handler＋runtimeFixture/PGを通すメモ選択中の最新取得回帰を追加した。最初の診断試験は「503が一度もない」を余計にassertし、有限再試行後にlatestが取れたにもかかわらず失敗したため、有効なRedとは扱わない。

実際の4対象最新取得を完了する受入へ訂正後、同exactは57件中56成功・1失敗、exit1、8.84秒。実HTTP statuses `200,503,503,200,503,200`、既存の有限GET再試行後も選択メモの版が旧版のままで失敗した。Auth/DB実装の内部原因は推定せず、承認対象CompanyDetailの同sessionへ並列に集中した最新取得だけを順番に待つ最小差分にする。HTTP契約・要求数・期限・再試行回数・Auth/DB層は変更しない。途中失敗で表示を部分更新しない条件も維持する。

## Manual and Final Quality

### 最新取得の追加Greenと参照タブ

同じfrontend exact commandの追加Green：57/57、skip0、exit0、5.02秒。CompanyDetailの4対象GETを順に待ち、途中失敗で既存表示と元draft/baseを保持する。HookHarnessの既定12 microtask passesは維持し、該当の連続取得試験だけ48回を指定した。HTTPの期限・有限再試行回数を伸ばしていない。

rootの実ブラウザ確認で、再編集前の`needsRebase` disabled fieldsetがメモの参照タブまで無効にすることを確認した。追加回帰は参照タブにdisabled祖先がないこと、比較用項目と原文の最新内容を実callbackで表示できること、変更と保存callbackはゼロであることを検証する。58件中57成功・1失敗、exit1、5.69秒。既存fieldset配下にTabButtonsが残っており、期待する参照操作が妨げられる構造が失敗した。有効な対象Redで、DOM操作の実証は別記録と区別する。

最小変更はTabButtonsをdisabled fieldsetの外へ移すだけ。最初のGreen試行は58件中57成功・1失敗、exit1、5.01秒。構造化textareaのvalueをchildrenとして検査した試験側の誤りで、対象Redには数えない。textareaのvalueを厳密照合するよう訂正したGreenは58/58、skip0、exit0、5.27秒。

既存Prettierで承認対象のCompanyDetail/CompanyForm/MemoEditor/uiCallbacks/repository.integration/restore.integrationの6fileを整形した。不要な抽象化は加えず、同じexact commandのRefactorは58/58、skip0、exit0、5.00秒。編集・saveのneedsRebase guardと本人別vaultを維持した。

### 画面確認の範囲

追加画面証拠はroot所有の[改訂3手動確認](manual-revision-03-root.md)を参照する。企業・メモの2クライアント競合、最新と元入力の別表示、明示Enter再編集、確定保存、別クライアントでの最終値一致を区別して記録している。スマホは新規tab上で390×844を実測した。古いtabのviewportが反映されなかった試行や、5分寿命後のメモ作成・同ID照会が未確定だった試行も残し、成功へ上書きしない。

初回preview再起動時のPostgreSQL停止によるECONNREFUSEDは環境失敗でRedではない。承認済みcompose起動でHealthyへ復旧後にrootが手動確認を再開した。専用schema/processのcleanupとport停止はroot記録に残す。実Auth/Supabase/Vercelの受入ではない。

### 最終品質

#### 共有consumerの非同期flush修正

初回全体`npm test`は55files、605成功・1失敗（606件）、skip0、exit1、25.10秒。唯一の失敗は既存U2 `ui.test.ts`の「exposes the generation entry only with the currently selected company」で、CompanyDetailの入口buttonがまだ存在しなかった。U2 source/testは変更していない。これは今回の全体回帰失敗として残し、製品不具合のRedへ読み替えない。

U1に同じCompanyDetail・3対象serial mock GET・既定settleを通す対照回帰を追加。最初のsettle直後は入口未到達だが、1event-loop turn後に同じmockの入口が存在することを確認してから「settle完了時に入口あり」の期待で失敗した。frontend exactは59件中58成功・1失敗、exit1、4.52秒。実DB・実時間timeoutなしで、共有harnessがResponse.jsonの連続microtask完了前に戻ることを実証した。

承認計画のhookHarness最小拡張としてsettle末尾へ有限1回のsetImmediateとrenderを追加した。既定12pass、実時間timeout、全既存assertionを維持し、実I/Oの完了待ちや製品の期限・再試行を代行しない。U1 ui/draftと失敗した既存U2 uiのexact3fileは93/93、skip0、exit0、Green4.33秒・既存formatter後Refactor4.20秒。この追加1caseとharness修正は、既存U2 testを編集しないverify/fixである。

#### 最終実測

Node22.23.3、既存Vitest4.1.8/v8、dummy Auth/provider、loopback PostgreSQL17.6。重い処理は順次実行し、実サービス・秘密値なし。今回新規ケース20件（repository5・restore6・draft1・frontend8）を加え、587→607件となった。runner/coverage設定と依存は変更していない。

| command | 最終結果 |
|---|---|
| 試験手順のU1 exact16file | 253/253、skip0、exit0、17.79秒 |
| `npm run lint` | exit0、warning0 |
| `npm run typecheck` | exit0 |
| `npm test` | 55files / 607/607、skip0、exit0、26.02秒 |
| `npm test -- --passWithNoTests=false --coverage` | 55files / 607/607、skip0、exit0、22.55秒 |
| `npm run build` | exit0、全route生成 |
| `git diff --check` | exit0、既存LF/CRLF警告のみ |

全app/src lines **84.69%（2850/3365）**、statements83.04%（3007/3621）、branches74.28%（1988/2676）、functions80.68%（735/911）。80%のlines下限を達成し、branchesが80%とは主張しない。通常coverage出力はGit管理外`coverage/`で、レポートを証拠の代わりにコミットしない。共有harness修正前にもU1 exact252/252、lint/typecheck/build成功を得たが、最終欄は修正後のbytesで再確認した結果である。

旧40ms/operation_unknown試験と実PG回帰は維持した。実Supabase/PostgreSQL17.11・本人Auth・外部API・実CI・Vercel・公開受入・実Bセッション切替・dependency audit high5/critical1は未対処/未確認のまま。U2/U3の未修正所見と新規計画・レビュー・checkpointは後続の公式routingに委ねる。

## Final Source and Self Review

旧91claimsを保持し、新SQLとrestore試験の2claimsを追加したstrict manifestは93claims、展開96files。各bytes hashの再照合mismatch0、aggregateは`e1d869dcb42cab9f57ac4bb5475ba5c1f4bf63e7f7bfd69cbb6a8bbf4b40d435`（sorted path+NUL+SHA256(bytes)+LFのSHA256、commit SHAではない）。今回変更は12filesで、[現在の指紋](source-fingerprints.json)に区別する。

146upstream IDs/146coverage IDs/unique146、OK target欠落0。改訂2との対応差分はAC6.3.2・BR6.6・NFR2.6の3件だけで、その他のIDs/対応を維持した。承認済み計画はcheckbox以外一致、試験手順は全文一致。既存期限caseのhashは`33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5`で改訂2から不変。

code-summary/bugfix-evidence/root手動記録の相対リンクを検査し欠落0。手動確認/最終品質の実測と失敗履歴を照合し、下書き/成功操作/本人隔離/期限/復元境界を自己確認した。rootの引継ぎ確定後にsourceを計算し、正式レビューへ渡す前にsource/producesを凍結した。旧レビュー・audit/state・承認receiptは編集していない。
