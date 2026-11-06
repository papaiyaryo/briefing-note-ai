# U3 TDD証拠

## 2026-10-30 revision03 再検証の現在値

HEAD `e22b4d07a6f9b52228f4e7015d378afb529edfb1`。開始時の対象8 source/testにgit差分なし。旧baselineとの同一HEADを証明できないため、新規に実行した。アプリ・テスト変更なし。Testing Contract `sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440` を適用し、既存証拠は以下に保存する。

Steps 1〜5: readiness 1件、U3全9ファイル141件、全体baseline 56ファイル645件、baseline coverage、session/edits 48件、integration 12件、UI 24件はすべてexit0・skip0。回帰20項目のassertionを確認した。新規の振る舞い変更・不具合修正はなく、条件付きRed/Green/Refactorは非適用。既存成功試験を新規Redと扱わない。

Step 6: rootの専用previewは起動したが、native UIで現在URLを安全に判定できずポリシー停止。画面操作0、M-R1〜5は全未確認。R03・owner切替・export・実画面の操作/モバイル/200・400%/キーボード等の未確認範囲を従来どおり引き継ぐ。自動試験で手動受入を代替しない。

Step 7: `npm run lint`、`npm run typecheck`、`npm test`、`npm test -- --passWithNoTests=false --coverage`、`npm run build`は各1回exit0。最終test/coverageは各56ファイル645件・skip0。v8 coverageはlines85.96%、statements84.34%、branches76.2%、functions82.42%（baselineと同値）。Node v22.20.0、既存dummy PostgreSQLを使用し、依存・assertion・timeout・coverage条件は変更していない。

承認済みscoped `git diff --check` はexit1。実行時の `manual-evidence.md:118` と `tdd-evidence.md:117` に `new blank line at EOF` を検出して停止した。人間が「空行だけでしょ。飛ばして次に進んでいいよ」と明示し、rootが回答記録済み。この判断によりStep 8へ進むが、差分検査を成功へ変更しない。空行修正・再試行・追加試験は行っていない。行番号は当該実行時の値。

preview終了のhelper結果はexit1、`dedicatedPreviewStopConfirmed:false`、`dedicatedSchemaDropped:true`。rootの既知helper/Next親PID照会では両方とも消失。schema削除は確認済みだが、プロセスツリー全体の停止は未証明であり、StopConfirmedを成功に上書きしない。

Step 8の記録更新のみ。manifestの累積29パス、traceabilityの137 IDs（AC90: U3 35/他55、BR17、NFR30）とDeferred/手動限界を維持し、新しいsource claimを追加しない。Step 9の正式レビュー・checkpoint・lifecycle判断はroot担当で未完了。

最新の2026-10-29再実行はDocker権限拒否で試験前に停止。製品Red／条件付きGreen／Refactorは未到達。末尾の当日追記を参照し、過去の成功と区別する。

## revision03 — 既存修正の再検証（2026-10-28）

承認済みrevision03はR-01/R-02の既存修正を再検証する計画。runner確認後、session/edits 48件、実PG結合12件、UI、U3全9ファイル141件が現行の実装と回帰に対して成功した（詳細は[検証結果](verification-results.md)）。S-R1〜5、C-R1〜7、U-R1〜6、I-R1〜2は既存の20回帰であり、今回新たなRedとして数えない。旧Red→Green→Refactorは[revision02修復証拠](bugfix-evidence-revision-02.md)の履歴として保持する。

今回の画面確認はpreview起動後に操作環境へ接続できず、M-R1〜M-R5の実DOM成功0。新しい対象内の製品不具合は再現していないため、Step 4/5の新規Red/Green/Refactorは非適用。初回PG接続失敗と全体差分検査のaudit末尾空白はアプリRedではない。アプリ・試験コード、assertion、coverage閾値、timeoutは変更していない。

## revision02 — 現在の修復証拠
[bugfix-evidence-revision-02.md](bugfix-evidence-revision-02.md)に承認後のrunner確認、615件baseline、Business/実PG/UIの実Red→Green→Refactorと20回帰を記録した。U3既存119件を保持し最終139件。全体品質は[verification-revision-02.md](verification-revision-02.md)、GUIは[manual-revision-02-root.md](manual-revision-02-root.md)。shell起動失敗・追加mock型エラー・既存U1のcoverage timeoutを新アプリRedとしない。

## 以下はrevision01以前のTDD履歴

## 今回CDP Retryの扱い

app/共有接続/単体試験は変更0。新しいapp Redを主張せず、以前の各レイヤーRed→Green→Refactor/初回Greenの実PGという履歴を保持した。helperの非cancelable click、配送未証明、誤ったready待ち、global外部countの過剰な初期化込み判定を、内容なし診断・実DOM自己境界・限定実行で切り分けた。過去exit1/自動承認レビュー拒否は[CDP証拠](cdp-retry-evidence.md)へ保存し、実app不備へ加算しない。最終helper構文0/自己検査0/意図的failure1/lint0。実B未確認を単体/実PG成功で置換しない。


## U1改訂2後の再開

今回の実変更はU3 helper/利用手順/記録だけでapp/test挙動変更なし。既存の各層受入Red→Green→Refactorは以下の履歴を維持する。新たなapp不備を証明していないため、比較HTTP503の読取error/回復、helper候補待機不備、CDP timeoutをapp Redに加算しない。helper構文exit0、自己検査exit0/意図的exit1、失敗時の専用cleanupを別証拠にした。詳細は[再開証拠](post-u1-resume-evidence.md)。

最終lint/typecheck/test/build/coverage/diffは順次exit0、全587passed・lines83.50%。これはStep16の未到達条件を補完する証明ではない。未確認Mを維持して書止める。U1期限試験の正式改訂2は別Unitの承認済み作業でありU3から変更していない。

契約は公式briefのTDD/Standard。同じexact groupをRed→Green→Refactorで実行する。setup失敗や初回成功した既存境界を新Redに数えない。

## 前提

[preflight.md](preflight.md)の変更前468件、runner1件と実PG17.6の成功を確認後にStep3へ進む。AC8.1/9.1、BR2/3/5/6のモデル/旧形式を最初の対象とする。

## Step3 モデル・旧形式 Red

`npm test -- tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/legacy.test.ts --passWithNoTests=false`

exit1、2files/20tests収集、20failed、skip0。model12件/legacy8件。未実装のU3 moduleを動的importで検出し、各受入assertionが失敗。runner/fixture/DB設定失敗や0件ではない。選択上限・所属・出典・7観点・安全出力、旧形式保持/破損非破壊のAC/BRは各test名に記載。最小実装後に同groupで各振る舞いのassertionまで実行する。

## Step4/5 モデル・旧形式 Green/Refactor

同exact command: Green exit0、2files/20tests全成功・skip0。共有workspace schemaとCOMPARISON_POINTSを再利用し、選択/全snapshotの所属/版/構造/出典検証、7観点と安全Markdown、旧有効形式保持・不正混在書込拒否を実装。

既存Prettierで対象6fileだけ整形後、同exact commandでRefactor exit0、2files/20tests全成功・skip0。既存comparison.tsやU1/U2のsource変更なし。

## Step6 C4 consumer・実PG Red

`npm test -- tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false`

exit1、2files/28tests収集、26failed/2passed・skip0。client18件と実PG10件。U3 consumer未実装が26件の失敗原因。実PGの既存handlerによる未認証/Origin拒否、他owner/不存在404の2件は初回Greenであり、新Redには数えない。実DB bootstrap/migration/専用schema作成とfixture保存は成立し、afterAllで接続/schemaをcleanupした。新DB/repository/server層なし。今後同exact groupでconsumer経由の振る舞いを確認する。

## Step7/8 C4 consumer Green/Refactorと受理境界修正

同exact C4/実PG command: Green28/28・exit0、整形後Refactor28/28・exit0。既存WorkspaceClientを構成利用し、比較POSTはread-error、GET限定retry、15秒全体期限/外部取消、body待機の有限終了、runtime全参照/保存結果検証を実装。PG10件は全件成功・skip0。

補助typecheckはmock引数推論2件でexit1。mockへ既存fetch型を明示しassertionを維持、後のtypecheckはexit0。アプリRedに数えない。

root途中点検からBR5.3/NFR1.4/5.1回帰を追加。model/legacy exact22件中2failed（opaque版をUUID限定、URL raw改行がMarkdown構文へ漏れる）exit1。client/実PG exact30件中2failed（expectedVersionと概要版をUUID限定）exit1。他の既存48件は成功。共有契約Versionは非空不透明値のため、U3受理と要求保持だけを修正、既存U1 schema/serverは変更しない。URLは安全判定後のnew URL().hrefを出力し、raw改行・空白の構文注入を防ぐ。修正後同exactはmodel/legacy22/22、C4/実PG30/30、typecheckともexit0。lookupの別action/対象/版は後続edits境界でさらに確認する。

## Step9 状態・欄別更新・出力 Red

`npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts --passWithNoTests=false`

exit1、3files/42tests収集、42failed・skip0。session12/edits18/export12。未実装のU3 moduleを検出した受入assertion失敗で、setup/収集失敗ではない。各test名にBR/NFRを付し、owner/世代、draft保持、committed/unknownの往復、同ID/body、競合base/draft/latest、lookup action/対象/版、全版・入力世代の出力阻止に対応する。

## Step10/11 状態・保存・出力 Green/Refactor

同exact state commandは42/42成功・exit0。整形後のRefactorも42/42、model/legacy22/22、C4/実PG30/30、typecheckすべてexit0。

途中自己点検の追加回帰: A→B→Aの旧login COMMIT/latest応答、送信中の追加入力破棄の3件は45件中3failed/42passed・exit1。owner文字列とlogin世代を分けて照合し、旧送信は同ID照会可能なunknownへ保持。discardは送信値を残し未送信追加だけ破棄。修正後45/45・exit0。

committed後の他client更新のclean同期とdirty保持は47件中2failed/45passed・exit1。snapshot install時だけclean欄の最新base/draftを更新し、intent/outcomeを過去の確定履歴として維持。dirtyのbase/draftは保持しlatestを別領域へ置く。修正後47/47・exit0。追加POSTなしを確認。deferred mock戻り型の補助typecheck不一致1件は注釈を訂正し、後のtypecheckはexit0。

## Step12/13 UI Red/Greenと復旧境界

`npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false`

初回16tests収集、16failed・exit1。未実装U3画面の受入assertionが原因。実装後17件のうち9passed/8failedで、保存値表示不足1件は実Red、7件はNode harnessがReact要素を返すだけで対象関数を実行していなかった補助不備。assertionを変えず関数callbackを実行するよう訂正、これら7件をapp Red追加には数えない。

選択外/削除済みunknownの照会導線を追加回帰した時点では18件中16passed/2failed・exit1。保存値表示と選択非依存の保持操作照会が実不備。表に保存志望度/理由を別表示し、現在snapshotや候補から失われた対象も同ID照会できる領域を設けた。修正後18/18・exit0。SSR/callbackはDOM証拠ではない。

## Step14 既存回帰と品質の途中結果

`npm test`: 54files/586tests収集、585passed/1failed・exit1。U3全118件と既存UI/生成/旧比較は成功。凍結U1 routesの40ms COMMIT不確実性試験だけ、operation_unknown期待に対しunavailable。該当U1 source/testは未変更。負荷下でCOMMIT段階前に期限到達した可能性はあるが原因断定しない。

`npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false`: 単独再確認19/19・exit0。assertion/期限/設定を変更せず、最終全suiteは他の重い検査と重複させず再確認する。途中のlint/typecheckはともにexit0、warning0。最終Step17の全体成功とはまだ区別する。

Step14 U3 all exact（試験手順の9file完全指定）は9files/118tests全成功・skip0・exit0。最新の整形/共有接続後のRefactor確認を含む。Step15の文書/helperと実画面・性能、最終全体品質はこれから実施する。

## Step15〜17と停止時の追加回帰

helper構文exit0、自己検査exit0/意図した自己失敗exit1を確認後に実Edgeを実行。setup/helper失敗をapp Redへ加えない。直近29check成功でもhelper exit1であり、詳細はmanual-evidence.mdへ記録した。

Step17の`npm test`は他の重い検査を同時に実行せず、54files/586tests中585passed/1failed・exit1。同じ凍結U1 routes.test.ts:262の40ms COMMIT期限でexpected operation_unknown/actual unavailable。focused19成功で全体合格とはしない。

最後のBR1.2自己点検で、A送信→B→A再login→旧要求の401拒否は、旧成功応答と違いrejectedになり同ID照会へ進めない境界を追加した。

`npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts --passWithNoTests=false`

Redは3files/48tests中1failed/47passed・exit1。対象assertionはstatus unknown、frozen request保持、outcomeなし、readMemoなし。runner/収集不備ではない。sendのcatchでもowner/login世代を照合し、古い応答をoperation_unknownへ置換する最小修正後、同exactは48passed・exit0（cell466）。未確定要求を新IDで再送せず、同本人の照会用に保持する。

rootから全体失敗の本人確認へ移る停止指示を受領し、開始済みGreenの回収後にsource変更を停止した。この追加1件のRefactor/全体再確認と最終lint/typecheck/build/coverage/diffは未実施。U3全件は118成功の時点と区別し、現在の119件一括成功と主張しない。計画の未完Stepは未チェックを維持した。

## 公式Retry後の回収（前節は当時の履歴）

公式brief全文を再読し29sourceの欠落0/hash変化0から再開。試験手順のU3 all exactは9files/119passed・exit0。最後のedits回帰を整形し、同state exactは48passed・exit0、責務を点検したRefactor完了。typecheck/lintともexit0・warning0。その後のhelper-only変更の最新lintは未再実施。

build/diffはexit0。coverage付き全suiteは587中586passed/1failed・exit1、凍結U1の同じCOMMIT期限試験。U1 source/test/40ms/assertionと設定は未変更。coverage集計/80%成功は未確認、全体再試行は停止した。

helper cleanupはowned-edge-stop/code128を実観測。所有childの終了を最大1.5秒待ち、未終了なら元エラーを維持する最小修正を行った。既存--self-testで「kill失敗後に実終了」「kill失敗し未終了は拒否」の両境界が成功、自己失敗flagはexit1を維持。実29check/exit0・専用全cleanup trueへ確認した。これはhelper修正でありapp Redとは別。

追加M2/M3/M10は実操作成功。続く切替後ready待機は失敗し、最小診断で新server表示のreadErrorまで到達することを確認したが、原因は未確定。診断/補完失敗をapp RedやGreenへ加算しない。通常helperへ戻し構文exit0後に書止め、残るM/全体失敗は保留。source/試験条件/依存の拡張や凍結U1の無断修正はない。
# 2026-10-29 再実行の追記

HEAD `e22b4d07a6f9b52228f4e7015d378afb529edfb1`。正式Testing Contract `sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440` をbriefで取得し、承認済みrevision03計画／試験手順を読んだ。既存20回帰や旧Red/Greenを新規Redとして数えない。対象8ファイルに今回の変更なし。

DB準備 `docker compose -f compose.test.yml up -d --wait` がDocker権限拒否でexit1となり停止。runner、baseline、Step 3 exactはいずれも未実施。今回の製品不具合再現0という判定もできず、条件付きStep 4/5は未到達。新しい受入失敗試験・実装・Refactorなし。環境失敗をRedにせず、既存修正を戻す人工Redも作らなかった。旧baseline HEADとの一致を証明できないため旧成功を今回の動的証拠へ流用しない。以下の既存記録は履歴として保持する。

