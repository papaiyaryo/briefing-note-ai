# U2 — 訂正OCR・生成候補の企業保存 実装結果

企業詳細から開始したOCR訂正・生成候補を、固定した同じ企業へ明示保存する。本文・構造・訂正OCR・イベント・採用Web・dummy/openai出自を既存C2/C4で保存し、同じmemoIdで再取得する。単発生成・復習・対応する.md出力も維持した。自動試験468件と全アプリline coverage84.07%は成功。実画面は34確認中33成功/exit1で、native200%の生成入口操作が未確認のため手動受入全体は未達。

## Source baseline and ownership

- branch: release/bolt-002-company-data-management-local、開始HEAD: df63c09be502bf5c9e50b58a69e2bacea5c39bc5。同じBolt002の既存専用branchを継続し、U2用の別release/PRは作っていない。
- HEADだけをU1実装内容とみなさず、U1実装済みworking treeの156file hashを[baseline.json](baseline.json)へ記録した。そのsnapshotとの差分は41source（新規19、変更22）。
- [source-manifest.json](source-manifest.json)はstage/unit/version/writes[{path}]だけの厳密形式。41の実変更を列挙し、記録文書はこのUnit内へ置いた。[source-fingerprints.json](source-fingerprints.json)は各sourceのhashと算出方法を保持する。
- 41source fingerprint: `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8`。並べたpath + NUL + sha256 + LFのSHA256。baselineの他fileに想定外の変更は0。
- package/lock、vitestのinclude/80%閾値、CI、migration/repository、Auth/session規則、Vercel設定はU2で変更していない。既存dirtyやroot所有handoff/verification、U1文書・承認記録はU2の変更へ混ぜていない。生成対象候補にあったWorkspaceHome/OcrReviewStep/MarkdownEditStep等は既存propsを再利用し、不要な変更を作っていない。

## Components and behavior

| 対象 | 実装と根拠 |
|---|---|
| src/lib/generation/{candidate,draft,save}.ts | 既存C2型/上限でallowlist、本文をtrimせず画像metadataを排除。owner別の一時DraftVault、画像を含まない入力回復、送信snapshotと現在編集の分離、同じoperation/memo IDでunknown照会・明示再試行。model22件。 |
| GenerationCandidateFields / GenerationSavePanel | 本文/11構造区分/OCR/event/Webを別正本で編集し、選択企業固定・生成名不一致・dummy表示。明示保存だけでPOST。確定とGET失敗を分け、unknownは同じ凍結要求を使う。候補出力は表示本文と一致。 |
| BriefingNoteFlow / CompanyDetail / UploadStep | 企業詳細の生成入口と単発入口を両立。本人・作業世代で古い応答を拒否し、未保存取消を保持。画像差替え/除去/commit/終了/unmountで参照解放。企業保存MarkdownへimageFileNamesを渡さない。外部保持の短い案内。UI34件と実Edge確認。 |
| server/workspace generationReceipt/runtime/http | 検証済み本人・実provider・generation UUID・active keyを既存memo-generation:v1 HMAC形式へ結合。既存verifierを利用し秘密鍵は返さない。guardExisting callbackの任意contextを後方互換で接続。既存保存HTTP/sessionの意味は不変。 |
| server/generation/request と4provider | provider30秒cap/server40秒、取消し伝播、abortを無視する依存でも有限終了、finally解放。単発Responses store:false。既存provider/model・JSON検証を保持。server20件。 |
| 4生成API/contracts/clients | browser45秒はJSON body読取まで含む。取消後late結果拒否、実行時応答検証、private,no-store、safe requestId/code/duration。structureの400/500/422/429/502例外と共通401/403を維持。API/client46件。 |
| 実PG保存境界 | 既存U1 bootstrap/migration/HTTP/service/adapterを再利用。dummy署名候補の全項目再取得、別owner/親消失/署名・provider改変/構造拒否、同一操作再送、commit後応答途絶照会。実PG10件。新DB/repository層なし。 |
| 手順/実画面helper | 既存Edge/CDP・専用preview/schema、有限watchdog/finallyのみ。各documentで計測初期化し、helper false/未到達をexit1にする。新依存/新browser runnerなし。 |

C5生成の「要確認」は保持し、C2日付制約を緩めない。保存前に本人がYYYY-MM-DDまたは空欄へ明示編集する。Webの元データが日付精度ならUTC日付開始へ正規化するが実取得時刻を証明しない。有効datetime、id/sourceUrl/confidence/採用状態を保持する。独自DTO、画像欄、urlという別保存キーは追加していない。

## TDD and self-review

[実TDD記録](tdd-evidence.md)にexact command・失敗理由・exit・件数を記録。model/server/API/frontendの実Red→Green→Refactorを実施した。収集失敗・helper設定不備・未到達をapp Redへ数えていない。

保存結合は先行API/UI接続後のため、初回9成功/1fixture失敗、その修正後10成功だった。新たなDB/repository実装や未接続app失敗はなく、Step14の新Redは未実施。人工的破壊をせず、先行するAPI/UIの実Red対応と計画/実順序の差を記録し、Step14 checkboxは未チェックのまま。

自己点検で、別項目編集による新OCR/event巻戻り2件、旧候補commitによる新しい作業OCRの消失1件、callbackのPromise返却退行を実Redで確認して最小修正した。作業入力と送信候補を混ぜず、commit後も新入力をdirtyで保持し、保存メモへ移る際は破棄確認/取消を使う。実DOMで入口focusのRedも確認し、入口/本人・会社切替だけfocusする最小修正でGreen。入力中にfocusを奪わない。U1既知競合処理は変更していない。

## Verification and limits

詳細は[verification-results.md](verification-results.md)、実DOMは[manual-evidence.md](manual-evidence.md)。

- U2全9file exact groupは最終132件成功、既存15file生成回帰82件成功。全suiteは45files/468件成功、すべてexit0。
- 全app/src line coverage84.07%（2328/2769）、除外や閾値変更なし。lint/typecheck/test/build/diff-checkはexit0。warning2件の非動作整理後はlint警告0・typecheck・実PG10件もexit0。
- 実Edgeでは固定企業/出自/別正本/出典/HTML/出力/取消/キーボード/狭幅/画像解放/unknown/実保存再取得/単発復習が成功。idle2秒の追加API0。
- native400%では生成入口labelへ到達。native200%は実倍率671CSSpx/DPR2まで測定したが入口label未到達、原因未確定。視覚拡大やCSS viewportリフローをnative受入へ読み替えず、NFR5.2/Step18は未達のまま。別owner/late応答のNode/API/実PG証拠を実ブラウザの本人切替成功とは称さない。
- 全画面runで専用Next/Edge/schemaのcleanupを確認した。実外部API/実Supabase/Auth/本番/実CI jobは未確認。Vercelの実作業は本人担当。

## Requirement mapping

[traceability.json](traceability.json)は90AC（U2担当34、うちAC6.3.2は既知U1問題でDeferred）と追加14BR/31詳細NFR、計135IDを別々に列挙する。OKは実装・ローカル根拠の対応であり、外部未確認や全体受入の達成宣言ではない。

| ID群 | source / evidence |
|---|---|
| AC1.1/1.2、BR1.1/1.2、NFR1.1〜1.5 | guardExisting/runtime/receipt、routes/server/UI、dummy本人・Origin・owner/late隔離。実Authは別。 |
| AC5.1/5.2、BR2.1〜2.3/3.1〜3.4、NFR4.1〜4.4 | candidate/Flow/Fields/SavePanel・provider transport、出自/出典/画像なし/別正本の単体・実PG・実Edge。 |
| AC6.2/6.3、BR4.1〜4.3、NFR2.2〜2.5/2.7/3.1/3.2 | draft/save/既存WorkspaceClient/保存HTTP、unknown/replay/入力保持/再取得。AC6.3.2・BR4.2・NFR3.1のU1競合部分は保留。 |
| AC9.1.1/3/5・9.2、BR5.1/5.2、NFR6.1 | 既存単発Flow/Review/Markdown出力、既存生成82件回帰と実Edge。比較AC9.1.2/4はU3。 |
| NFR2.1 | server/generation/request・4provider・4client、30/40/45秒・取消し・finally。 |
| NFR2.6 | U1復元session問題が未修正、Deferred。新U2復元領域なし。 |
| NFR5.1/5.2 | safe Markdown/URL・label/focus/通知・実Edge。native200%操作は未確認。 |
| NFR6.2〜6.4/7.7 | 既存stack・dummy/実PG・TDD・固定include80%・最終検査。新依存/infraなし、実CI job別。 |
| NFR7.1〜7.6 | 既存U1代表量/2clientの容量・p95参考を全suite再実行。U2入力境界と操作再送、期限を検証。外部HTTP p95/Free枠は未確認。 |

## Residual issues

U1の競合後draft破棄、復元による失効app_sessions復活、削除確認期限を親lock待機後に再検査しない問題は未修正。生成draftの今回修正でこれらを解消済みとしない。

U1監査記録の既存high5/critical1は未解消。Next15.5.19、sharp0.34.5、postcss8.4.31、nanoid3.3.12、source-map-js1.2.1、@vercel/analytics2.0.1は同じ固定依存を継続した。Windows server/Image Optimization等の既存Next重大advisoryを含む。U2は新規依存追加・forced fix・承認外upgrade・リスク受容を行っておらず、これは新たなaudit scanの結果ではない。

[設定手順](../../../../../../../../docs/company-data-setup.md)と[生成保存手順](../../../../../../../../docs/generated-notes-checks.md)へ実設定の空欄・外部保持・本人作業境界を引き継いだ。実環境の成功や公開受入は推定しない。
