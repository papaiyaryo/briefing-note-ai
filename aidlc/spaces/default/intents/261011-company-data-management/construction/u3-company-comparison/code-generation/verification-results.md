# U3 検証結果 — revision02の現在値と履歴

## 2026-10-30 revision03 再検証の現在値

HEAD `e22b4d07a6f9b52228f4e7015d378afb529edfb1`。開始時の対象8 source/testにgit差分なし。旧baselineとの同一HEADを証明できないため、新規に実行した。アプリ・テスト変更なし。Testing Contract `sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440` を適用し、既存証拠は以下に保存する。

Steps 1〜5: readiness 1件、U3全9ファイル141件、全体baseline 56ファイル645件、baseline coverage、session/edits 48件、integration 12件、UI 24件はすべてexit0・skip0。回帰20項目のassertionを確認した。新規の振る舞い変更・不具合修正はなく、条件付きRed/Green/Refactorは非適用。既存成功試験を新規Redと扱わない。

Step 6: rootの専用previewは起動したが、native UIで現在URLを安全に判定できずポリシー停止。画面操作0、M-R1〜5は全未確認。R03・owner切替・export・実画面の操作/モバイル/200・400%/キーボード等の未確認範囲を従来どおり引き継ぐ。自動試験で手動受入を代替しない。

Step 7: `npm run lint`、`npm run typecheck`、`npm test`、`npm test -- --passWithNoTests=false --coverage`、`npm run build`は各1回exit0。最終test/coverageは各56ファイル645件・skip0。v8 coverageはlines85.96%、statements84.34%、branches76.2%、functions82.42%（baselineと同値）。Node v22.20.0、既存dummy PostgreSQLを使用し、依存・assertion・timeout・coverage条件は変更していない。

承認済みscoped `git diff --check` はexit1。実行時の `manual-evidence.md:118` と `tdd-evidence.md:117` に `new blank line at EOF` を検出して停止した。人間が「空行だけでしょ。飛ばして次に進んでいいよ」と明示し、rootが回答記録済み。この判断によりStep 8へ進むが、差分検査を成功へ変更しない。空行修正・再試行・追加試験は行っていない。行番号は当該実行時の値。

preview終了のhelper結果はexit1、`dedicatedPreviewStopConfirmed:false`、`dedicatedSchemaDropped:true`。rootの既知helper/Next親PID照会では両方とも消失。schema削除は確認済みだが、プロセスツリー全体の停止は未証明であり、StopConfirmedを成功に上書きしない。

Step 8の記録更新のみ。manifestの累積29パス、traceabilityの137 IDs（AC90: U3 35/他55、BR17、NFR30）とDeferred/手動限界を維持し、新しいsource claimを追加しない。Step 9の正式レビュー・checkpoint・lifecycle判断はroot担当で未完了。

## 2026-10-29 再実行 — 環境前提で停止

HEAD `e22b4d07a6f9b52228f4e7015d378afb529edfb1`、対象8 source/testに開始時git差分なし。旧baseline HEADの一致を証明できず、以前の141件／645件／lines85.96%は今回の実行結果へ流用しない。既存Node実体の `--version` はv22.20.0。依存・Vitest/v8/include/exclude/lines80/timeout/assertionの変更なし。

必要なDB前提コマンド `docker compose -f compose.test.yml up -d --wait` はexit1。Docker config読取のAccess deniedとdocker_engine pipeへのpermission deniedにより準備できなかった。環境失敗でありアプリRedではない。計画の停止規則に従い、自動再試行や無断インストールを行わなかった。

今回のreadiness/U3 all、全体baseline test/coverage、session/edits・integration・UI exact、preview、lint/typecheck/test/coverage/build/承認済みscoped diffはすべて未実施。従って今回のcoverage80%以上、R-01/R-02再検証、回帰20件の動的確認、全体品質合格は未確認。Step 1〜8とroot担当Step 9は未完了。アプリ・試験変更0、他者dirty/worktreeと監査履歴を保全した。以下の成功／失敗は各日付の履歴で、今回の成功ではない。

## revision03 — 承認済み差分検査の完了（2026-10-28）

本人が公式ツール所有audit shardだけを除外するコマンドへ承認済みStep 7を変更。前回成功したNode22でのlint/typecheck/全645件/coverage lines85.96%/buildは再実行せず、その同じ試行の結果を使用した。変更後の `git diff --check -- . ':(exclude)aidlc/spaces/default/intents/261011-company-data-management/audit/**'` はexit0。表示は `docs/generated-notes-checks.md` のLF→CRLF警告のみ。Step 7の指定品質確認は完了した。

除外前の全体 `git diff --check` exit1とaudit shard末尾空白2件は下記の失敗記録のまま保持する。この変更はauditの修復や全体差分合格を意味しない。画面M-R1〜M-R5、実B/R-03、実CI/本番は未検証。

## revision03 — 本人承認後のStep 7再試行（2026-10-28）

Node v22.20.0/npm 10.9.3をprocess-local PATHで用いた。承認済み順序で`npm run lint` exit0、`npm run typecheck` exit0、`npm test` exit0（56ファイル/645件成功）、`npm test -- --passWithNoTests=false --coverage` exit0（同645件、v8、全app/src lines85.96%=2964/3448、statements84.34%、branches76.2%、functions82.42%）、`npm run build` exit0（Next.js 15.5.19、静的18ページ生成）を確認した。

最後の`git diff --check`はexit1。U3外のツール所有audit shard `aidlc/spaces/default/intents/261011-company-data-management/audit/neo-ba01a9a9622f.md` の25066行と25270行に末尾空白があり、後者は履歴メッセージの末尾。 `docs/generated-notes-checks.md`のLF→CRLF警告も表示された。auditは変更せず、Step 7は失敗のまま停止、Step 8と正式checkpointは未実施。自動再試行なし。下記初回PG停止の結果も履歴として保持する。

## revision03 — 今回のStep 7停止（2026-10-28）

承認済み順序で直列実行した。 `npm run lint` exit 0、`npm run typecheck` exit 0。続く `npm test` はexit 1。56ファイル中42成功・14失敗、645件中508成功・8失敗・129 skip。失敗はローカルPG `127.0.0.1:55432` の `ECONNREFUSED` に伴う実PG系の収集・実行失敗であり、新しいU3アプリRedとは認定しない。preview起動とDocker準備も同じ環境前提で停止（[画面証拠](manual-evidence.md)）。

計画の失敗時停止規則に従い、coverage、build、`git diff --check` は未実行。lines80%以上の今回判定、全体品質の合格、U3の正式checkpointは未確認。下記revision02の成功は当時の結果として保持し、今回の全体成功に流用しない。

## revision02 — 現在の最終ローカル品質
正本は[verification-revision-02.md](verification-revision-02.md)。最終typecheck/lint/build/diff exit0、通常635件成功、同条件coverage Retry635件成功/lines85.95%(2962/3446)、U3全139件。旧587件/83.50%は以下の履歴であり現在値ではない。初回shell/typecheck/coverage失敗は[停止履歴](verification-revision-02-root-stop.md)に保持。実CI/公開/実Auth/Supabaseは未確認。限定GUI/Step9未完は[現在の手動記録](manual-revision-02-root.md)を参照。

## 以下はrevision01以前の検証履歴

## CDP Retry後の最終補完

比較app/共有接続/単体試験は再開時からbytes不変。変更はhelper/docsのみ。既存587tests/lines83.50%/typecheck/build成功をその同じapp bytesの既実行結果として維持し、今回再実行したとは表現しない。

- helper構文 `node --check scripts/check-u3-comparison.mjs`: exit0。
- `node scripts/check-u3-comparison.mjs --self-test`: 3check/exit0。
- `node scripts/check-u3-comparison.mjs --self-test-failure`: falseを検出する意図的exit1（成功へ変更しない）。
- `npm run lint`: exit0、warning0。npm更新noticeは依存更新指示として実行していない。
- 独立実DOM結果/各commands/exit/cleanupは[CDP証拠](cdp-retry-evidence.md)と[現在受入表](manual-acceptance-status.md)へ。最新の全幅/native/安全/keyboard/確認中変更はそれぞれ有限の区間で成功し、全flow/性能100回の反復ではない。
- 最終read-only cleanup: Node22.23.3、isolatedSchemas0、dbClients[]、3000/9224 responding=false、exit0。
- 所有照合: strict manifest29path一致/削除0、U3 aggregate `36a9f6f6cfaf75eeefdb116382f7a0d49ccfebe7436ca55d63421bac39d49d93`、再開変更helper/docs2fileのみ。U1 94source4f419f…/target337337…とU2 41source530045…を実再計算で確認。
- 137IDと文書リンク/最終diffの検査結果は最後の校正記録へ。Step16は実B未確認で未チェック、他の完了済みcheckboxを変更しない。

### 2026-10-20の記録照合

親側の読取検査はexit0。manifest29件とfingerprints29件のbytes不一致0、再計算aggregateは上記36a9f6…と一致。traceabilityはupstream/coverage各137件、unique137（90AC/17BR/30NFR）、OK参照先の実file欠落0。主要記録6文書の相対リンク28件は欠落0、git diff --checkはexit0（既存LF/CRLF警告のみ）。保存済み実装の試験を新たに実行した結果ではない。最新限定区間と以前の診断失敗の区別だけを文書校正し、承認計画・試験手順・アプリsource・テストは変更していない。


## 直前Retry時点の判定（以下は履歴）

Step17品質は順次すべてexit0：lint warning0、typecheck、54files/587passed（29.43秒）、build、coverage同587passed（30.01秒）・全app/src lines83.50%（2794/3346）、git diff --check（既存LF/CRLF警告のみ）。include/lines80下限/既存assertion不変。実PGskipなし。以下の旧U1失敗と今回の別承認修正後結果を区別する。

Step16はCDP Runtime.evaluate timeoutで未完了・未チェック。helperは残M区間だけを実行し、M2/M3等5check成功後exit1、専用cleanup全true。比較切替時503/unavailableは明示再取得で回復し確定値/追加PATCH0を確認、原因は未確定。app Red認定なし。詳細・未到達条件は[再開証拠](post-u1-resume-evidence.md)と[手動記録](manual-evidence.md)。品質成功だけでUnit全体を合格にしない。

今回はhelper/docs/記録だけ変更、app/test挙動は不変。current29source aggregate a56c3783dd915054858aa2f62501da73b82786d01bba63baf6806808a2a69740。U1改訂2/U2は維持、実CI/本番Auth/公開は未確認。以下は再開前の履歴で、過去の失敗/未実施を消去しない。

## 判定

Unit全体は未合格。Retryでもcoverage付き全suiteが凍結U1期限試験で失敗した。U1変更は未承認のため適用せず、依存しないU3補完の結果を記録して書止めた。計画Step15は完了、Step16〜18は未チェック。正式レビュー・Unit完了の証明ではない。

## Retryの最新結果（以下の旧結果を上書き合格にしない）

公式Retry後、U3 all exactは9files/119passed・exit0。整形後のstate/edit/export exactは48passed・exit0（Refactor）。typecheck/lintはexit0・warning0。以後のhelper変更は最新lint未再実施、production app source変更なし。

`npm run build`はexit0、`git diff --check`はexit0（既存LF/CRLF警告）。`npm test -- --passWithNoTests=false --coverage`は54files/587tests中586passed/1failed・exit1、同じU1 routes:262の40ms期待operation_unknown/実際unavailable（68ms）。coverage集計はこの出力に出ず、80%判定未確認。以後の全体test/coverage再試行は停止した。

119件終了後のread-only診断では隔離test/preview schema0、他DB接続0、専用3000/9224応答なし、専用node process0。残存による継続負荷の証拠なし、全suite内の実時間競合/原因は未確定。[最小の未適用U1試験案](u1-deadline-diagnosis.md)は再承認が必要。

helper構文0/自己検査0/意図的失敗1を再確認。cleanup code128を観測した後、所有childの終了確認を有限待機する最小修正と「実終了あり/なし」の自己検査を行い、29check成功・process exit0・preview/Edge/profile/schema cleanup全true/errors=[]を確認した。実TCP p95 616.30ms、最大929.48ms、失敗0、DB15,617,171bytes。以前のexit1は履歴として維持。

追加M flowは25check成功後、M3追加入力破棄→旧/新比較切替後のready待機でexit1。最小診断では旧表示に到達済みで、再入口後server=true/loading=false/readError=true、要求数52→56、login=false。helper前提かapp境界か原因未確定。両実行ともpreview/Edge/profile/schema cleanup全true・errors=[]。一時診断分岐を通常helperへ戻した後の構文はexit0。新しい実helper/補完修正は停止、未到達variantを未実施のまま残す。

未実施は最新helperのlint/全補完の成功確認、Mの残variant、最終全体npm testの再実行、coverage80%認定。型/lint/buildの以前の成功を全体合格へ読み替えない。詳細は下の履歴とmanual-evidence.md。

## 実行結果

Node22.23.3 / npm11.6.1、既存依存、dummy認証/provider、隔離実PostgreSQL17.6を使用。新依存・設定・DB変更なし。

| 対象・command | 実結果 | 範囲・限界 |
|---|---|---|
| 着手前 `npm test` | 45files/468passed、exit0 | U3変更前のworking tree baseline |
| readiness exact | 1passed、exit0 | runner成立。app Redではない |
| model/legacy exact | 22passed、exit0 | opaque版・URL正規化回帰を含む |
| client/実PG exact | 30passed、exit0 | client20＋既存handlerを通る実PG10、skip0 |
| state/edit/export exact（途中） | 47passed、exit0 | owner/世代・dirty・unknown・rebase・出力 |
| UI exact | 18passed、exit0 | Node callback/SSR。実DOMとは別 |
| U3 all exact（Step14） | 9files/118passed、exit0 | 最後の追加1回帰より前。現在の119件一括成功とは言わない |
| `npm run lint`（Step14） | exit0、warning0 | 最後のedits/test/helper変更前。最終再確認は未実施 |
| `npm run typecheck`（Step14） | exit0 | 最後の追加回帰/最小修正前。最終再確認は未実施 |
| `npm test`（Step14） | 54files/586tests、585passed/1failed、exit1 | 凍結U1の40ms COMMIT期限試験 |
| `npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false` | 19passed、exit0 | 既存assertion/期限を維持した単独再確認 |
| `npm test`（Step17、重い検査の同時実行なし） | 54files/586tests、585passed/1failed、exit1 | 同じU1期限試験が再現。最終全体合格なし |
| 最後のstate/edit/export exact Red | 48tests、1failed/47passed、exit1 | A→B→Aの旧login拒否応答がrejectedになる実不備 |
| 同exact Green | 3files/48passed、exit0 | 旧loginのエラーも同ID照会用unknownへ保持。これ以後source変更なし |
| `node --check scripts/check-u3-comparison.mjs` | exit0 | 診断用finally補足より前 |
| helper `--self-test` / `--self-test-failure` | exit0 / 意図したexit1 | 偽の成功を防ぐ自己確認。最新finally診断追加後の再実行は未実施 |
| 実画面helper | 直近29check成功、process exit1 | 全M条件やhelper総合合格ではない。[手動記録](manual-evidence.md)参照 |
| `npm run build` | 未実施 | 停止指示後に開始せず |
| `npm test -- --passWithNoTests=false --coverage` | 未実施 | 全app/src lines80%以上はU3で未測定。旧coverage値を流用しない |
| `git diff --check` | 未実施 | 最終検査は残存 |

各exact groupの全文commandとRed/Green/Refactorは[TDD記録](tdd-evidence.md)・承認済み[試験手順](unit-test-instructions.md)に対応する。最後の追加修正のRefactor・全体再確認は停止指示により未実施。成功件数へ未実行/skipを加算しない。

## 全体失敗の具体的境界

`tests/u1-company-notes/routes.test.ts:262`、`server deadline during COMMIT response uncertainty stays operation_unknown`。40msの要求で期待`operation_unknown`、実際`unavailable`。単独順次の全suiteでも70msで同じ失敗、全体26.65秒。COMMIT前に予算切れする可能性はあるが、原因は未確定。focused19件成功だけでこの全体失敗を取消さない。U3 sourceを直接importしない既存試験であり、凍結U1 source/test・期限・assertionを変更していない。

## 実画面・参考性能

Edge155.0.4283.62 / protocol1.3 / Windows10.0.26300。直近は29checkすべて成功、専用preview/Edge/schema停止確認はすべてtrue、preview exit0。ただしprocess exit1のfinally設定元は未特定。最後に段階/エラーcodeだけの診断とprofile除去の有限retryを追加したが、停止指示により未再実行。profile除去失敗を確定原因とは言わない。

native200/400%は別tabの実browser設定で幅1342→671/335、DPR1→2/4を確認し、両倍率で理由保存・比較.md・旧入口を実操作。viewport1366/390/320/767/768は別の模擬結果。既存単発の本人編集本文.md/復習.mdも実操作。M2等の未確認variantは手動記録の表に残す。

実TCP HTTP、100企業/1000メモ/10000操作、20社比較、warmup5→2client×50、p95 482.70ms/最大647.59ms/失敗0、cold参考1450.87ms、fixture7,894,886bytes、DB15,338,643bytes。ローカルp95≤2秒/DB≤200MiBの参考条件はこのfixtureで成立。実Supabase/外部ネットワーク/本番の達成ではない。

## 残る条件

実Auth/Supabase/鍵・実CI job・公開・対象merge SHAは未確認。Vercelは本人担当。既存U1の競合draft破棄/復元session復活/ロック待ち後削除期限、U2の保存後往復による重複保存/native200入口未確認、既存dependency audit high5/critical1は未修正。新しいU3回帰や画面成功をそれらの解消としない。

再開時は全体失敗の正式な処理、helper finallyのcode/段階回収、未確認M variant、最後の48件のRefactor/型/lint、U3全119件、最終4品質/coverage/diffの順に必要な確認を行う。確認・修正がないままUnit完了へ進めない。
