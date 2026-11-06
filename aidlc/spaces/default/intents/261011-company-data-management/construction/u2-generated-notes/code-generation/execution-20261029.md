# U2 再開実行 2026-10-29

## 対象と保全

HEAD `e22b4d07a6f9b52228f4e7015d378afb529edfb1`、既存dirtyを保全。公式UNIT_STARTEDは2026-10-29T05:44:54Z。`aidlc engine testing-posture brief --unit u2-generated-notes`の現行計画とTesting Contract `sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440`を使用。U1/U3・共有handoff・source・試験・設定・依存・timeout・assertionは変更していない。

Node22.23.3を既存キャッシュからprocess-local PATHで選び、cmd.exe経由で承認済みnpmコマンドを実行した。既定Node24.11.0で最初にreadiness16件が成功した結果は別扱いとし、Node22で同じexact readinessを再実行した。Vitest4.1.8、既存v8のinclude src/app・lines80%を維持。

## 今回の既存回帰

承認済みunit-test-instructions.mdのexact commandsを直列実行。すべてexit0。

| group | files/tests | Vitest秒 |
|---|---|---|
| readiness | 4/16 | 2.46 |
| UI、既存R1–R8を含む | 1/42 | 4.19 |
| candidate/draft/save | 3/22 | 1.62 |
| generationReceipt/providerRequests | 2/20 | 1.55 |
| routes/clients | 2/46 | 2.35 |
| generation.integration、実PG | 1/10 | 4.73 |
| U2全体 | 9/140 | 4.91 |
| 既存生成・復習・出力 | 15/82 | 4.24 |

FlowのsaveSessionが表示Panelを越えて保存意図を保持すること、R1–R8の親子mount/unmount、POST数・安定ID・凍結body・編集引渡しを保全した。正常応答unknownは同じ凍結要求・IDで本人再試行を許し、照会失敗では結果不明と再照会を維持する。新しいフィールドやIDは導入しない。対象内製品不備の再現はなく、条件付きStep5–7は非適用。既存成功や古いRedを新しいRedへ数えない。

Docker composeの通常権限起動はconfig/pipe access deniedでexit1。parentが通知メール送信後に同じ承認済み`docker compose -f compose.test.yml up -d --wait`を追加権限で実行しexit0、既存test PostgreSQL Running/Healthyと報告した。実Supabase・実Auth・実LLM・本番は使っていない。

## CUAによる追加画面観察

computer-use skillとguidance/confirmations/API、およびCUA local-web-development/file-uploads手順を確認。全状態取得は私的タブへ意図せず触れる恐れでautomatic approval reviewに拒否された。その取得は繰り返さず、専用Chrome空白タブの作成へ対象を限定して成功した。私的タブは操作しない。画像は視認済みの既存package favicon PNG、445bytes、非個人の架空fixture。実filechooserを通し、File・アプリ状態注入や独立CDP/browser fetchは使わない。

初回preview：helper42016/Next2292、専用schema `u1_preview_f52fb73d23d04bde966c1be6cdca1469`。ログイン画面でDebugger unattachedが発生。再観察ではフォームを取得できたが、架空メールの入力がLocalIdentityの固定dummy本人と異なりlogin401。製品Redではない。既存300000msの寿命終了後、exit1、dedicatedPreviewStopConfirmed:false、dedicatedSchemaDropped:true。

原因を確認した1回の再確認：helper31308/Next46624、専用schema `u1_preview_96eaeaec5bb244b9b9a31f13149c3e50`。同じ300000ms寿命、dummy本人ログイン200、架空企業登録201。実UIで固定企業の保存メモ0件→生成入口→画像選択1枚→OCR200→訂正入力→Web補足なし→構造化生成200→本文・構造・訂正OCR・固定保存先・dummy警告を確認。構造概要の日付を有効な日付へ本人操作相当の入力で訂正して保存した。

保存POST201、同じmemo GET200。企業ID `7cb15a54-6858-4437-8436-8c99e5c11cb0`、memoId `f31e04f8-cf97-41ee-97e5-52272cb1fff1`。保存確定後、画像・OCR確認へ戻る（画像なし・訂正保持）→最後候補へ戻る→保存確定と保存メモを開く導線が維持→既存復習生成200・表示→閉じる→同じ保存確定→保存メモを開き既存editor本文・dummy表示を確認した。previewログ上、新規メモPOSTは1回であり、往復時の追加POSTは観測しなかった。

最後にeditorを閉じ企業の最新を再取得したが、寿命終了後となり取得エラー。古い0件表示を保存消失と断定せず、再取得一覧での件数1は**未確認**。IDは今回の保存・再取得ログで観測したが、最終一覧の所属件数との突合は未達でありStep3全体を合格にしない。

専用タブのタイトルはbriefing-note-ai。返却されたnative windowからこの専用Chromeウィンドウを選定できず、実倍率200%/400%やPC1366×768、390×844、320/767/768、倍率時の主要操作・キーボード一式は未確認。CSS拡大やviewportで代用せず、倍率・viewportの変更は行わなかった。追加GUI試行は行わず所有タブを閉じた。

再確認previewもexit1、dedicatedPreviewStopConfirmed:false、dedicatedSchemaDropped:true。終了状態を成功へ書き換えない。独立したGet-Processで所有4PIDは出力なし/exit1（不在）。Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinueも出力なし/exit1で待受なし。

## 今回の全体品質

preview終了後、Node22.23.3で承認済みコマンドを各1回直列実行。追加Retryなし。

| exact command | 結果 |
|---|---|
| `npm run lint` | exit0、shell19.04秒 |
| `npm run typecheck` | exit0、shell7.01秒 |
| `npm test` | exit0、56ファイル645/645件、Vitest26.95秒 |
| `npm test -- --passWithNoTests=false --coverage` | exit0、56ファイル645/645件、Vitest28.40秒 |
| `npm run build` | exit0、Next15.5.19、compile5.4秒、static pages18/18 |
| `git diff --check` | docs・本記録・Step1/2更新後にexit1。既存audit/neo-ba01a9a9622f.mdの末尾空白のみを報告。auditは変更しない |

全app/srcのcoverageはlines85.96%（2964/3448）、statements84.34%（3136/3718）、branches76.2%（2111/2770）、functions82.42%（769/933）。既存80%条件を満たす。build全体の所要時間は記録しておらず、compile時間と混同しない。

計画はStep1/2のみ今回の証拠で完了印とし、文面は変更しない。Step3/4は未完了、Step5–7は対象内製品不備なしのため今回は非適用、Step8は既存auditのdiff失敗を残して未完了。Step9/10と公式ライフサイクル更新はparent担当。diff check後はこの結果追記だけを行い、全test・buildを不要に繰り返さない。

## 人間へ引き継ぐ実操作

既存ローカルpreviewの有限寿命内で、標準表示の画像選択→OCR訂正→候補確認→保存→OCR/既存復習往復→同じmemoIdと企業最新一覧の1件を確認する。ブラウザ実UIで200%を表示・確認して画像選択、訂正、生成、保存、再取得を行う。PC1366×768、390×844、幅320/767/768、400%、Tab/ShiftTab・ラベル・通知を確認し、最後に倍率/一時viewportを復元する。今回のcallback成功・部分的GUI成功をその合格へ読み替えない。
