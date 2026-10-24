# U2 TDD evidence

実行はNode22.23.3 wrapper経由。exact npm command自体は承認済みのまま。全内容は架空fixture／dummyのみ。

## Model — Step2 Red

対象: AC5.1.1〜5、AC5.2.1〜5、AC6.2.2〜4、BR1.2/2.1〜4.3。

`npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts --passWithNoTests=false`

- 初回は対象本体module未作成による3suite収集失敗/exit1。runner成功・動作Redには数えない。
- 型付き未実装stubを用意して同command再実行。22tests収集、18failed/4passed、exit1。mapper正常・画像排除、owner別draft・保持、C2凍結保存・unknown照会・再試行等が未実装エラーで失敗。拒否assertion4件はstubでも通るためGreenの妥当性は全件の再実行で確認する。
- readiness自体はpreflight記載の既存16tests/exit0で成立済み。

## Model — Step3 Green / Step4 Refactor

- 同exact groupの最初のGreenは21passed/1failed、exit1。唯一の失敗はJSON objectのキー順への試験側の仕様外拘束。parse後のC2全値完全一致へ修正した。同一要求再試行のbody文字列一致は維持。
- Green再実行: 3files/22tests passed、exit0。
- Refactor: shared C2 schemaによるallowlist、既存DraftVault、WorkspaceClientへ責務を限定。先行して不要だったpending補助は除去。所有7filesだけ既存Prettierを実行（exit0）。同exact group再実行22tests passed、exit0。新依存／既存設定変更なし。

## Server — Step5 Red / Step6 Green / Step7 Refactor

対象: US5.1/5.2、BR1.1/3.1〜4、SD1/SD2/PD1、NFR2.1/4.4。

`npm test -- tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts --passWithNoTests=false`

- Red: 20tests収集、17failed/3passed、exit1。issuer未実装5件、4providerのstore:false未指定、取消し前dispatch防止、30秒cap、abortを無視するtransportの有限待機、40秒server境界が失敗。収集／環境設定の失敗なし。stubがworkを呼ばないためdone未定義となった1件と警告はアプリの独立Red根拠には数えず、他16件の実失敗を維持。
- Green: server-only発行を既存memo-generation:v1 HMAC形式とkeyringで実装。共有deadlineでtimer/listener解放、provider30秒cap/server40秒、store:false、signal伝播を接続。20tests passed、exit0。
- Refactor: 重複provider timerを共有requestProviderへ集約、既存JSON検証／model／safe status errorを維持。所有9filesだけPrettier実行exit0。同exact20tests passed、exit0。
- 既存生成回帰exact15file command（unit-test-instructions.md既定）: 15files/82tests passed、exit0。実外部API呼出しなし。

## API/client — Step8 Red / Step9 Green / Step10 Refactor

対象: US1.1/5.1/5.2/9.2、C5、SD1/SD2/PD1。

`npm test -- tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts --passWithNoTests=false`

- 初回Red: 37tests、16failed/21passed、exit1。receipt未接続、構造不正の200、40秒/45秒・JSON body読取の無期限待機、取消後late成功、不正成功応答、日付正規化/無効暦日、安全診断metadataの失敗。収集/環境失敗なし。
- 同じ境界の事前取消し・不正任意proof型を追加してRed再実行: 45tests、24failed/21passed、exit1。既存401/403とstructure code/status互換は成功。
- Green: 45tests passed、exit0。本人context/出自鍵をserver内部だけで接続、検証後発行、private,no-store、safe requestId/status/duration診断、browser45秒でJSON読取まで有限待機。外部応答を実行時検証。C5 unionの本人/Origin errorを安全表示。
- Web取得日が日付だけの場合はUTC日付開始に正規化（元の精度は日付、実取得時刻の証明ではない）。有効datetimeは完全保持、無効暦日を拒否。id/sourceUrl/confidence/採用状態保持、共有C2 schema変更なし。
- Refactorで所有14files整形exit0、exact45tests/exit0。その後既存15file回帰は81passed/1failed、exit1。C5のoverview.eventDate='要確認'をC2日付制約で拒否した実退行。assertion維持。
- C5『要確認』保持とC2保存拒否を同時にassertする追加試験を先行: exact46tests中45passed/1failed、exit1。既存完全JSON検証と保存制約を分離し、候補で確認/編集すべき値として保持。
- 最小修正後exact46tests passed/exit0、既存15files/82tests passed/exit0、typecheck exit0。C2 schema・保存規則・U1既知不備は不変。

## Frontend — Step11 Red / Step12 Green / Step13 Refactor

対象: US5.1/5.2/6.2/6.3/9.1/9.2、選択企業固定、別正本、明示保存、unknown、本人・作業世代、一時画像と出力。

`npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false`

- 初回29件のUI stub・未接続失敗を実行。単発入口のhelper既定targetと、void callback後のNode Response.json stream待機不足はhelper不備として除外。有限setImmediateによる待機を補い、実際にeditor到達後の保存案内欠落を確認した。helper修正後29failed/exit1を確定。
- Fields/SavePanel・一時draftを接続。明示再開2件を追加して31件中20passed/11failed、exit1。未接続Flowと再開の実失敗を維持。
- Flowと企業詳細の入口を接続して31passed/exit0。画像を保存DTO/一時vaultへ入れず、別本人の遅延応答を拒否。保存確定とGET失敗を分け、同一凍結要求の照会・明示再試行を維持。
- 所有10files整形後、UI31passed/exit0、model22passed/exit0、typecheck0、lint0（cleanup ref警告1件）。SSR/callbackはDOM/focus証拠ではない。
- 自己点検で、最後の候補の本文/構造だけを編集したとき、後から訂正した作業OCR/イベントが旧候補へ戻る2件を追加。33件中2failed/31passed、exit1。最小修正は候補内で明示変更した項目だけ作業入力へ反映。修正後33passed/exit0を確認。
- 既存U1 UI exact command `npm test -- tests/u1-company-notes/ui.test.ts --passWithNoTests=false`: 38件中1failed/37passed、exit1。生成callbackがPromiseを返さなくなった今回の退行。await契約を復元後、editor到達は成功したが復習callbackにも同じ問題が残り、同件が後段で再失敗。assertionは維持し、復習のPromise返却も最小修正。最終回帰38passed/exit0、U2 UI33passed/exit0、typecheck0、lint0（警告なし）。

## Real PostgreSQL — Step14 initial execution

`npm test -- tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false`

- 初回10件収集、9passed/1failed、exit1。別owner fixtureを本人sessionHashだけ流用して作ろうとしたためDB本人検証で拒否された。これはfixture設定の失敗でありU2 app Redではない。他9件は実migration/HTTP/service/adapter/PGを通過。
- 別ownerの企業を隔離schema管理接続でfixtureとして投入し、本人HTTPからの404拒否を検証する形へ修正。本人認証・RLSのassertionは維持。
- 新DB/repository層の実装はなく、結合の本体接続は先行API/UIの実Red→Greenで既に成立している。初回成功部分をStep14の新たなRed達成と称さず、計画のRed順序と実行順序との差として残す。人工的破壊やassertion緩和は行わない。
- fixture修正後、同exact実PG group10passed/exit0。新たなapp修正なし。Step14のRed達成checkboxは未チェックのまま理由を残す。
- Step15/16: 既存helper再利用と所有schema finally cleanupの責務を整理し、所有2filesを既存Prettierで整形exit0。U2全9file exact group131passed/exit0（実PG10件を含む）。model再回帰22passed/exit0。DB/repository/共有schema変更なし。

## Browser/self-review fixes — Step18

- 初回実Edgeの入口heading focusがfalse、helper exit1（詳細manual-evidence）。対象入口でのみ見出しへfocusする最小修正を行った。2回目はfocus・入力中focus保持・Tab/ShiftTabを含む23確認成功。後続helperが保存editor内で非表示の企業詳細ボタンを探したため未到達/exit1。これはhelper導線不備でapp Redではなく、既存「編集を閉じる」を挟む手順へ修正。両回とも専用preview/Edge/schema cleanup成功。
- 自己点検で旧候補commit時の新しい作業OCR保持を追加。初回34passedだったがcallback fixtureが正規化後C2 snapshotでなくキー順差によりdirtyを残す偽陽性だった。実契約どおりmapGeneratedCandidateしたsnapshotで再実行し、34件中1failed/33passed、exit1。新しい訂正のvault消失を実Redとして確定。
- 最小修正: 送信候補と別に残るOCR/event/採用Webの作業入力差分もcommit後dirtyとして保持する。保存した候補へ勝手に混ぜず表示で説明。保存メモを開く際の破棄確認と取消で保持し、vaultの破棄責任をFlowへ置く。U1の競合処理・repositoryは変更しない。所有4files整形exit0、同UI exact34passed/exit0、既存U1 UI exact38passed/exit0。取消後も保持するassertionを維持。

## Final verification — Step19

- 承認済みU2全9file exact command: 132passed/exit0。既存15file生成回帰exact command: 82passed/exit0。
- npm run lint / npm run typecheck / npm test / npm run build: すべてexit0。全testは45files/468passed。lint初回warning2件をhelper if/elseと試験の未使用値除去だけで整理し、再lintは警告0/exit0、型exit0、同exact実PG10passed/exit0。app動作は変更していない。
- npm test -- --passWithNoTests=false --coverage: 468passed/exit0、全app/src lines84.07%（2328/2769）。include/閾値/除外変更なし。git diff --check exit0。
- 実画面の最後は34確認中33成功/exit1。native200%操作の未到達を隠さず、Step18/NFR5.2全体を未達として残す。実結果とcleanupはmanual-evidenceへ。追加の無期限試行や人工Redを作らない。

## Artifact self-review — Step20

ローカル読取専用validatorはexit0/pass:true。strict manifest41source、全hash、baseline他変更0、trace135ID（AC90/BR14/NFR31）と実在target、17のlocal Markdown link、conflict marker/空白を確認した。承認済みplan本文はcheckboxを除き一致。新Red未実施のStep14と手動受入未達のStep18は未チェックのまま。validator初回2回の起動失敗（command line too long / system cannot find the path specified）はapp不備に数えず、task-local読取専用fileの短いnode起動で確認した。2回目の根本原因は断定しない。公式sensor/承認の代替とはしない。
