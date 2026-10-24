# 保存企業の比較をローカルで確認する

本人としてログインし、共通ナビの「保存した企業を比較」へ進みます。終了した企業も候補に含まれます。「参照メモ候補を取得」で構造化メモを選び、各企業から1つ、選択順に最大20社を比較します。同名でも企業IDが違えば別企業です。所属メモ全件数と取得済みページ数は別表示で、必要なら次のページを取得します。本文だけのメモは自動で構造化しません。

比較は保存した構造化項目の7観点を使います。空の観点は「未記載」、元の「要確認」はそのままです。本文・企業自由メモ・本人の比較理由から企業事実を生成しません。保存企業名、参照メモID/版、出自、イベントを確認できます。dummyは検証用の生成値であり、実企業の事実や実API成功の証明ではありません。採用Webは紙由来と別区分にし、id/category/content/sourceUrl/fetchedAt/confidence/adoptedを保持します。

## 志望度と比較理由

企業志望度は企業の値、比較理由は選択したメモの値です。各欄の保存ボタンはその欄だけを変更します。志望度の「未設定」と「未定」は別です。比較理由は任意・5000 Unicode文字までで、空欄保存はnullになります。本文・構造・他メモの理由は変更しません。

保存前の入力と表示中の保存参照を区別してください。競合では元の基準値・保持入力・最新保存値を別に表示します。最新を取得しただけでは入力を捨てず、本人が「保持入力のまま最新を基準に編集する」を選んでから新しい保存意図へ進みます。

結果不明は未実行の証明ではありません。「操作結果を同IDで確認」し、unknownなら本人操作で同じ要求・同じIDを再試行します。選択から外した対象や削除済み対象も「保持中の保存操作」から照会できます。送信済みの処理を画面移動で取消したとは表示しません。

確定後の最新取得が失敗しても保存成功は保持します。新しいIDで再保存せず、最新の取得を再試行してください。通常の画面往復・欄の再表示だけでは操作ID/要求を新しくしません。追加入力があれば保持します。本人切替では保護内容を隠し、同じ本人にだけ一時状態を保持します。復帰時は最新参照の確認と明示復旧が必要です。再読込・ブラウザ/OS終了を越える未保存復旧は保証しません。

## 比較.mdと旧比較

比較.mdはクリックごとに全選択の企業版・メモ版をC3で再確認します。未保存/送信中/結果不明の間は出力できません。版変更は最新表示を確認してから再クリックし、削除・401・不正応答・期限・途中入力ではファイルを作りません。確認後に別端末で変更されることまで排他しません。

「このブラウザの旧比較」は明示した別入口です。従来の保存形式・有効な選択/編集/出力を維持し、新しい企業へ移行・関連付け・送信・自動削除しません。破損混在では読める記録を保持し、元データを欠落させる書込を止めます。利用不能・破損・有効0件は別状態です。

## 検証環境とコマンド

既存のNode22.23.3をprocess PATHで選び、既存依存と試験専用PostgreSQL17を使います。新依存・DB/migration・環境変数・秘密・Vercel作業は追加しません。実Supabase/Authや実API鍵は不要です。試験DBはloopbackのworkspace_testだけで、必要時の準備は次の既存コマンドです。

```text
docker compose -f compose.test.yml up -d --wait
node --check scripts/check-u3-comparison.mjs
node scripts/check-u3-comparison.mjs --self-test
node scripts/check-u3-comparison.mjs --self-test-failure
node scripts/check-u3-comparison.mjs
```

自己失敗検査は意図的なexit1が期待値です。実画面helperは既存Edge/CDPと専用ローカルpreviewを短時間だけ起動し、専用profile/schema/子プロセスをfinally/watchdogで片付けます。使用済みportがあれば他者のserverを採用・終了せず失敗します。架空fixture/dummyだけを使い、内容・Cookie・秘密は結果へ出しません。Next buildとpreviewを同時起動しません。

既実施の画面全flowを繰り返さず残る条件だけを確認する場合は、同helperの`--remaining`で別メモ・独立保存・結果不明のroute往復・出力拒否・旧保存境界・同本人復旧・scrollの区間を使えます。`--diagnose-switch`は切替のstatus/code/件数/所要時間だけを調べ、残る受入を意図的に実行しないためexit1にします。どちらも同じ専用資源のcleanupを行います。

途中の条件だけを独立確認するときは、`--m4-check`、`--section=m6`、`--section=m6-versions`、`--section=m7`、`--section=m8`、`--section=m9`、`--section=m10`、`--section=m12`を使えます。M12の構造編集だけは`--structure-only`を併用します。各区間の実行結果は別に記録し、一部成功を全flowのexit0に読み替えません。`--m4-diagnostic`は停止操作の診断であり、意図的にexit1で終わります。

M9を1幅だけ切り分ける場合は`--section=m9 --m9-width=1366`のように指定します。許可幅は1366/390/320/767/768で、当幅の終端確認後にreturnし、他幅/native/性能は実行しません。前の単幅の結果・cleanupを回収してから次の未確認幅へ進みます。

倍率の不足だけは`--section=m9 --m9-native=200`または`--m9-native=400`で確認します。各回は基準100%のCSS幅/DPRを読み、指定倍率の新しい非emulated tabだけで操作します。`--m9-layout-only`は既成功1366/390の可視領域・7観点順の読取だけです。`--m9-keyboard --m9-width=1366`は一時DOMでキー配送を先に確認してから、実Tabで主要操作へ到達します。配送プローブのprogrammatic focus、実操作のTab到達、既存のShiftTab/Escape/scroll証拠を区別します。

`--section=m6-security`は危険文字の表示/.md、契約不正URLの配送・拒否・file0、出力中401を確認します。既存Analytics初期化Scriptの総数と既知一致boolを残し、対象操作による外部HTTP増分0を別に判定します。未知/操作起因要求は除外しません。`--section=m6-versions --m6-during`はcaseごとに新しいC3確認の保留状態→別clientの実HTTP変更/削除成功→解放後の当C3完了/期待status→file0を確認します。過去の出力前変更試験と、確認中の変更試験を分けます。

download観測はblobだけを捕捉し、通常リンクはnative clickに委譲します。非cancelableな合成clickで未保存ガードを迂回したり、native beforeunloadを自動承認したりしません。M9の主要操作は可視・有効な要素をscrollして実座標/焦点を確認し、trusted mouseで操作します。M10のキーボード証拠とは区別します。保持中の操作の同ID再試行が保存成功になった後も、比較参照は本人の明示再取得で確認します。

keyboard限定モードではmouseの代わりに実Tab到達・Enter/Spaceのtrusted activationを使い、文字入力も対象focusを確認します。実行中に503からの回復だけを既存helper clickで行った場合などは、その範囲を全keyboard-only成功へ読み替えず記録します。

幅/倍率条件は各条件で選択・比較・独立保存・競合/unknown復旧・出力・旧入口へ到達する確認です。すべての異常種類と幅の追加直積は要求していません。native zoomとviewport模擬の実施方法、URL/危険文字の実確認範囲、未到達操作は手動記録に分けて残します。

比較参照POSTの読取失敗を0件や更新結果不明に読み替えません。画面が失敗を示した場合は、保存を再送せず「比較参照を再取得」を本人操作で選びます。helperも失敗による出力阻止と、明示再取得後の追加writeなしを別々に記録します。一過性503の原因は観測だけで断定せず、回復した事実で元の失敗を消しません。

PC1366×768、スマホ390×844、幅320/767/768、native browser zoom200/400、Tab/ShiftTab・focus・通知、長文/危険文字を確認します。viewport模擬とnative zoomの実CSS幅/DPRを分けて記録し、Node callback/SSRを実DOMの合格証拠にしません。

性能は実TCPのHTTPを別に測定します。100企業/1000メモ/10000操作、20社比較、warmup5、2client×50、p95/最大/失敗数、fixture bytes/DB size/対象版/環境を残します。p95≤2秒・DB200MiBは承認済み目標で、ローカル参考値を実Supabase/本番達成に読み替えません。

## 結果と残る境界

実結果は[U3検証記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/verification-results.md)、[手動証拠](../aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-evidence.md)、[TDD証拠](../aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/tdd-evidence.md)へ記録します。未作成/未実施の間は成功を意味しません。

U1の競合draft破棄/復元session復活/ロック待ち後削除期限、U2の保存後往復による同候補重複保存/native200%入口未確認、既存audit high5/critical1は本Unitで修正していません。U3の同種境界の成功をこれらの解消として扱いません。実Auth/Supabase・実CI・公開・対象merge SHAは別途未確認、Vercelの実設定/deploy/公開確認は本人担当です。[既存設定・backup手順](company-data-setup.md)を参照してください。
