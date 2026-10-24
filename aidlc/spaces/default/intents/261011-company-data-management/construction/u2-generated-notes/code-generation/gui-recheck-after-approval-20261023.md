# U2 承認後の回帰・追加画面確認

## 実行条件と区別

2026-10-23。本人の新しいApprove Planを公式記録へ保存後、現在の10ステップ計画で実行した。対象はHEAD df63c09be502bf5c9e50b58a69e2bacea5c39bc5と既存dirty。アプリ・試験・設定の変更、旧Redの再演はない。実Auth・実Supabase・外部AI・本番は使っていない。

## Steps 1–2

Node22.23.3、Vitest4.1.8。既存v8・app/src全対象・line80%を維持し設定変更不要。全コマンドを直列実行し、すべてexit0・失敗やRetryなし。

| 承認済みexact group | files/tests | Vitest時間 | shell時間 |
|---|---:|---:|---:|
| readiness：flow/serverOcr/ocrRoute/webSupplementRoute | 4/16 | 2.83s | 5.689s |
| U2 ui.test.ts | 1/42 | 3.54s | 5.450s |
| U2 candidate/draft/save | 3/22 | 1.23s | 3.251s |
| U2 generationReceipt/providerRequests | 2/20 | 1.75s | 3.968s |
| U2 routes/clients | 2/46 | 1.92s | 3.901s |
| U2 generation.integration | 1/10 | 4.44s | 7.693s |
| U2全9ファイル | 9/140 | 4.23s | 6.336s |
| 既存生成・復習・出力15ファイル | 15/82 | 3.47s | 5.434s |

全exact commandは承認済みunit-test-instructions.mdと一致する。FlowのsaveSessionが表示Panelを越えて保存意図を所有し、既存R1–R8が実親子mount/unmount・POST数・安定ID・凍結body・編集引渡しを確認する。正常unknownは照会済みの本人再試行を許し、照会失敗はerrorを保持して再照会とする。新しい再送許可項目はない。上流NFR文書の軽微な表現指摘を解消済みにはしない。

## Step 3の追加画面観察

既存previewを承認済みコマンド、300000ms寿命、dummy Auth/provider、使い捨てPGのまま使用。通常権限のDocker接続は拒否されたが、同じ承認済みcompose起動を追加権限で実行してexit0、既存テストPG Healthy。テストとpreviewは同時実行していない。

初回preview：helper40860／Next35620、専用schema u1_preview_57a4398c1fa0471597f7673043730054。ダミーログイン・企業登録・保存メモ0件・固定企業の生成入口を確認。標準表示の観測は958×958、DPR1、横overflowなし（ブラウザメニューの100%確認やPC1366条件の合格ではない）。実inputのクリックはfilechooser10000msでtimeout、表示済み「ファイルを選択」はchooser成功、setFilesのtimeoutMs10000で445bytesの非個人PNGを選択し「選択済み画像1枚」を確認した。

OCR操作前にpreviewの既存寿命が終了し、画面はFailed to fetchを表示。helper終了はexit1、dedicatedPreviewStopConfirmed:false、dedicatedSchemaDropped:true。正常な起動条件を失ったため製品Redとはしない。

原因を特定した1回の再確認：port3000のエントリ不在を確認して同じpreviewコマンドを再実行。helper34168／Next32940、schema u1_preview_18dc2a1fa0224e7d9740e3d249c9da88。ログイン時の一度のDetachedは新しいDOMで入力状態を確認してから続行した。新しいダミー企業の保存メモ0件から生成入口へ進み、上記の成功した表示ボタンで同じ非個人PNGを選択。OCR200・架空訂正入力・Web補足なしの構造化生成200を確認。候補の本文と訂正OCRに訂正が保たれ、固定保存先とdummy警告、別正本、日付の明示編集を確認した。

保存操作より前に再び既存寿命が終了した。画面は保存結果不明を表示し、操作照会中→照会不成立後も結果不明と無効な再試行ボタンを保持した。helperログではOCR/structure成功後に終了し、保存APIの成功は観測していない。書込が未実行だったと断定せず、保存成功・memoId・件数1・保存後OCR/復習往復は未確認とする。終了はexit1、dedicatedPreviewStopConfirmed:false、dedicatedSchemaDropped:true。

## Step 4と残る条件

公式Windows Computer Useの接続とapp一覧取得は成功したが、Chromeの状態取得はアプリ操作許可待ちでtimeoutした。入力操作や設定変更は行っていない。実倍率200%・400%、PC1366×768、スマホ/境界幅、キーボード/focusの今回の受入合格は得られていない。viewportやCSS拡大への置換はしていない。今回用タブは閉じ、倍率・viewportは変更していない。

製品不備のRedを得ていないため条件付きStep5–7の修復は開始しない。追加のGUI再試行または本人実操作が必要。300000ms寿命や受入基準を無断変更せず、未確認を残したうえで独立に実行できるStep8の全体品質確認を進める。

両previewの終了後、追加権限の読み取りtasklistがexit0で完了し、既知PID40860／35620／34168／32940はすべて不在。netstatもexit0、port3000のエントリ不在。2回の専用スキーマ削除trueと合わせ、独立したcleanup確認として記録する。終了コマンド自体のexit1／停止確認falseは変更しない。

## Step 8の品質確認と停止

既知Node22のprocess-local PATHとcmd.exeを使い直列実行。npm run lintはexit0、npm run typecheckはexit0（shell9.20s）。npm testはexit1、55ファイル中53成功・2失敗、635件中633成功・2失敗、Vitest47.44s。失敗は既存U1の以下2件で、いずれもError: Test timed out in 5000ms.。原因は未特定であり、環境遅延と断定しない。

- tests/u1-company-notes/ui.test.ts → uiCallbacks.tsx:577：AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する（5033ms）。
- tests/u1-company-notes/restore.integration.test.ts:90：dump時に有効だった別sessionも再開前に拒否（5031ms）。

追加Retry・ソース・期待値・時間制限・設定変更は行っていない。coverage、build、diff check、docs/generated-notes-checks.mdの更新は未着手。Step8は未完了。現在の失敗について本人のRetry判断を待ち、同条件のnpm test成功後に残る品質確認と許可されたGUI再確認を進める。

## 本人のRetry後の再検証

本人が「Retry：同じ条件で検証と画面確認を再開する」と回答。公式UNIT_RESUMEDを2026-10-23T13:17:16Zに記録し、approvedの同じコード計画から再開した。Node22の同じprocess-local PATH、cmd.exeでnpm testを一度だけ実行した。結果はexit1、53 files成功／2失敗、633 tests成功／2失敗、Vitest44.86s。前回と同じU1の2件が再発した：uiCallbacks.tsx:577のAC6.3.2は5056ms、restore.integration.test.ts:90の別session拒否は5041ms。両方とも既存5000ms timeout。原因未特定。

追加Retry・ファイル書込・source・設定・制限・期待値変更はなく、coverage・build・diff checkを始めず停止。既存lint・typecheckとU2単体の成功を今回の全体合格に読み替えない。U1は凍結された依存であり、U2の範囲内で修復しない。修復を選ぶ場合はU1の再計画と実際の再承認が必要。

GUI準備では既存Chrome2のsession名を設定し、タブ一覧が空であることを確認しただけで、previewや作業タブを作っていない。Windows Computer Useは現在のturnで利用不可と応答したため、追加呼出しを行っていない。倍率操作・200%確認・保存後往復の追加成功はなく、未確認を維持する。

## U1追加調査の保留後のU2再開と画面確認

2026-10-24、本人がU1の追加調査を保留して「次に進もう」と指示。公式操作でU1をU2のためset-asideしU2を再開、同じ承認済み10ステップの手順3から継続した。U1の原因未特定・schema cleanup未確認・診断4ファイルは残っており、U1合格や修復済みとは扱わない。

以前のChrome2が明示的にunavailableとなったため一覧を確認し、新しいChrome3（同じプロファイル）へ接続した。Windows Computer Useはnative pipeが存在せず、1回のkernel再初期化後もCreateProcessWithLogonW failed:2で起動できなかった。ネイティブ倍率操作は行っていない。

ポート3000不在と445byteの既存非個人PNGを確認し、承認済みの同じpreviewコマンドで1区間を起動。helper51292／Next9052、schema u1_preview_2e6b1023c3da45459dcd02ec3961afd6、既存300000ms上限。通常tab.gotoはPage.navigate 10000ms timeoutでabout:blankのままだった。空白タブを閉じてURL指定の公式createBrowserTabで一度開き直すと、ローカル画面・本人ログイン入力欄を確認できた。メール欄のdummy入力後、別欄はstale、再取得もprevious page／Detachedとなり、接続しても操作を継続できなかった。ダミーAuthのログイン成功・画像選択以降・保存後の往復・メモID／件数1・実倍率200%の追加成功はない。製品Redとはしない。

今回の所有タブは閉じ、倍率／viewportは変更していない。helperのstdin stopで終了、exit1、dedicatedPreviewStopConfirmed:false、dedicatedSchemaDropped:true。通常tasklistはアクセス拒否で不成立、追加権限の読み取りtasklistはexit0でhelper51292／Next9052不在を独立確認。netstatはexit0でポート3000不在。停止確認falseの結果を成功へ書き換えない。テスト／buildとの同時実行はない。残る全体品質を実測し、GUI未確認は未確認として保持する。

### U2再開後の品質検証（2026-10-24）

同じ既定条件・各1回でlint exit0、typecheck exit0（shell8.493s）、npm test exit0・55files635/635・Vitest23.47s。全体開始04:15:45 JST。U1の計測変更は編集していない。過去の633/635×2と直近U1診断634/635を消さず、今回の成功と区別する。原因の解消やschema cleanupの新しい完了証拠にはしない。成功条件によりcoverage exactと残るbuild/diffへ進む。

coverage exactもexit0、55files635/635、26.59s。lines85.95%（2962/3446）、statements84.33%（3134/3716）、branches76.16%（2106/2765）、functions82.42%（769/933）。build exit0、Next15.5.19、compile13.3s、static18/18。git diff --check exit0、0.16s、既存LF→CRLF予告のみ。各コマンドは1回・直列、source/test/settings/timeout/expectation変更なし。確認資料docs/generated-notes-checks.mdへ今回結果と未確認を追記・再読した。GUIとUnitを完了扱いにせず、Step8のチェックも保留。

## 通知メールの扱い

新しいAGENTSの指示に従いapproval-mail手順を読み、DB追加権限の前に通知送信を試みた。スクリプトのUserProfileパス解決が空で送信は失敗した。設定値・保存パスワードは読んでおらず、通知成功とは記録しない。メール失敗を権限承認の代用にもしていない。追加権限のDocker実行は正式なツール承認経路で成功した。次の人間待ち前に通知を再確認する。

画面操作許可・再開の通知を、同じ既存メールスクリプトの追加権限実行で再試行した。UserProfile解決は進んだがNot configuredでexit1。通知は未送信。メール設定スクリプトはパスワード入力を伴う本人作業のため実行しない。メール失敗でも承認を代行したり既存計画を変更したりせず、必要な人間への依頼はチャットで行う。
