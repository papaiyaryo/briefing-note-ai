# U2 revision-02 — 修正単体・境界・結合試験の手順

## Setup and Scope

本書は新しい実際のPlan Approval後に実行する手順。現時点でrunner／Red／Green／Refactor／画面確認の成功を主張しない。既存Node22、固定依存、Vitest node環境、v8、全app/srcのline coverage80%以上を維持し、依存・設定・閾値を変更しない。

準備・全体lint／型／coverage／build・preview・公式checkpointのコマンドはcode-generation-plan.mdに記載し、ここにはU2に関係するexact test fileだけを指定する。ローカルdummy Auth／providerと実使い捨てPostgreSQL17を使い、実Auth／Bsession／Supabase／外部API／Vercelや実秘密値を前提としない。U1 source／produces／helper、U3、共有handoffは変更しない。

## Runner Readiness and TDD

旧手順と同じU2関連生成回帰のexact commandでrunnerを確認する。新しいUI補助や新しい試験を書き込む前に実行し、exit・実収集数・所要時間を記録する。

```text
npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplementRoute.test.ts --passWithNoTests=false
```

準備・collect・module・fixture・helperの失敗と0件はアプリRedではない。既存runnerの成立を確認してからR1〜R8を書き、Frontendの受入失敗を次のexact UI commandで実行する。同じcommandで最小Green、greenを保つRefactorを確認する。変更可能な本体はFlow／Panelだけ。DB／Repository／API／既存SaveIntentは振る舞いを変更しないため人工的なRedを作らない。

### Frontend — Red / Green / Refactor

```text
npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false
```

tests/u2-generated-notes/ui.test.tsへ新規8件を追加し、uiHarness.tsxはU2限定の親子mount／unmount補助だけを変更する。既存U1 hookHarnessを編集しない。新規8件は以下の表の1行1テストを予定する。既存34件＋8件で42件、既存U2全132件＋8件で140件を目安とし、実収集数は実行結果で確定する。Standardの既存各部品5〜8件相当と正常＋2以上の境界を維持する。

| ID | 操作と観測 | 対応受入 |
|---|---|---|
| R1 | 保存→OCR→同候補。元memoId／saved、新規作成なし、POST1／distinctMemoIds1 | AC5.1.5／AC6.2.2、BR4.1 |
| R2 | 保存→既存復習生成／表示→閉じる。同候補の確定保持、追加POSTなし、復習対応出力の既存assertion保持 | AC9.2.1〜3、BR5.2 |
| R3 | commit後GET失敗→往復→再取得。同じIDでGETだけ、保存確定保持 | AC6.2.2〜3、NFR2.4 |
| R4 | 保存応答保留→往復→応答完了。同意図保持、二重POSTなし | AC5.1.5、BR1.2／4.1 |
| R5 | unknown→往復→照会unknown→本人retry。同body／operationId／memoId、照会前retry不可、自動POSTなし | AC5.1.5／AC6.2.3、NFR2.3 |
| R6 | 同一テスト内で本人切替と企業切替を別々に観測し旧応答を返す。旧候補／確定／通知を別対象へ適用しない | US1.1共同、NFR1.4 |
| R7 | 明示的な再生成の検証成功後に新候補保存。新意図の別IDを許可。生成失敗は旧候補の確定を消さない | AC5.1.1／3、BR3.1／4.1 |
| R8 | 保存後編集→往復→同保存メモへ。未保存差分／別正本／既存draft引渡し保持、勝手な新規POSTなし | AC6.2.2／4、BR4.2〜3 |

R1／R2は実Flowの候補と実Panelのmount／unmountを組み合わせて観測する。Panelだけのrerender、onCommittedの直呼び、親propsのassertionだけでは再現成功にしない。fake WorkspaceClient transportから実際のPOST数とCreateMemoの全要求を確認する。旧callback再現POST2は参考であり、今回のRed証拠は実際のfailing command出力にする。

既存でも成功する保全ケースをRedと称さず、少なくとも同候補往復の新規保存再提示／POST増加が失敗理由であることを記録する。補助のmount手順が誤る場合はその不備を直して再実行し、製品の失敗と区別する。新しい期待を実装へ合わせて弱めない。

### Unchanged Model Preservation

```text
npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts --passWithNoTests=false
```

既存save8件、draft6件、candidateの検証を維持する。凍結要求の独立性、double click、unknown照会、同要求再試行、committedと拒否、owner／company隔離を新しいFrontendの保持へ接続する。モデル本体を変更する予定はない。

## Exact Existing Boundary and Whole Unit Commands

### Server Provenance / Provider

```text
npm test -- tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts --passWithNoTests=false
```

### API / Client

```text
npm test -- tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts --passWithNoTests=false
```

### Real PostgreSQL Integration

```text
npm test -- tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false
```

既存実migration／U1 HTTP・service・adapter／隔離schemaの10件を維持する。dummy生成からC2保存・再取得、親消失・別owner・不正証明／構造・同一操作再送・確定直後応答途絶を実PGで確認する。本修正はDBの新しい振る舞いを作らず、fixture失敗や過去Step14の結果を新しいDB Redへ読み替えない。fake-onlyの成功を原子性の証拠にしない。

### Whole U2

```text
npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts tests/u2-generated-notes/ui.test.ts tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false
```

### Existing Generation / Review / Export Regression

```text
npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplement.test.ts tests/webSupplementRoute.test.ts tests/webSupplementServer.test.ts tests/markdown.test.ts tests/download.test.ts tests/ui-components.test.ts src/lib/structure/dummyStructure.test.ts src/lib/structure/validate.test.ts src/lib/structure/toMarkdown.test.ts src/lib/interviewReview/dummy.test.ts src/lib/interviewReview/toMarkdown.test.ts tests/u1-company-notes/existingRoutes.test.ts --passWithNoTests=false
```

最後の既存exact groupは旧手順から維持するU2の生成・復習・認証入口回帰であり、U1ファイルの編集許可を意味しない。全アプリの所定検査は計画Step7に従い別実行する。単体groupの成功だけで全体coverage／release受入を達成したとしない。

## Fixtures, Mocks and Isolation

- 架空owner2名・架空企業2つ、既存candidate factory、dummy署名、64KiB以下架空画像を使用する。本文・構造・訂正OCR・event・Webのid／sourceUrl／fetchedAt／confidence／statusとproviderOriginを完全照合する。事実・印象・HR・質問・ES・Webと要確認を維持する。
- 候補identityは明示生成成功の世代と本人／企業へ結び付け、編集objectの参照変化や同じ本文による推測にしない。新しいAPI項目やserver全体generationId一意制約を導入しない。
- fake transportは想定外の外部fetchを失敗させる。POST応答の保留／失敗とGETの成功・失敗を別々に制御し、bodyをparseした全値と再試行時のbody文字列の一致をassertする。IDを試験都合で新規作成のたび同一値へ固定し、重複を隠さない。
- pending／current draftと確定済みsnapshotを区別し、unknown時の編集を元要求へ混ぜない。current targetへの古いcallback適用を禁止し、test cleanupでownerごとの一時状態・vi stub／spyを戻す。
- 画像binary・元file名・object URLをDTO／DB／localStorage／記録へ入れない。自身の実PG schema・接続だけをfinallyでcleanupし、他者DB／volumeを削除しない。
- SSR／callbackは実DOM／キーボード／focus／native zoomの証明ではない。実画面は次節で別に観測する。

## CUA Manual Acceptance

code-generation-plan.mdの「Native Zoom and Manual Acceptance」を正本とする。ブラウザ操作はcomputer-use／CUA実UIだけを使い、旧CDP helper／Playwright／browser fetch／アプリstate注入を使わない。既存previewの非browser準備・5分上限・cleanupを再利用し、新しいブラウザ依存を追加しない。

100%の表示・CSS幅・DPRを測り、実UIで200%にして倍率表示と相対CSS幅／DPRを確認する。同じウィンドウで値が反映されない場合は未確認。実倍率を確認後、企業詳細→生成入口→架空画像／OCR訂正→生成確認→保存→同IDメモ、保存済み候補のOCR／復習往復とメモ1件を実操作する。各待機最大30秒、生成は既存45秒上限、初回＋原因を特定した1回の再確認までとする。

正しい条件で製品操作が失敗した時だけ受入対応Redとして記録し、対象2部品内の最小修正へ進む。native倍率未反映・fixture・ログイン／対象間違い・待機未到達はapp Redに数えない。5対象ファイル外が必要ならrootへ返して計画変更を先に行う。成功時は実倍率・到達操作・同企業／同メモ・cleanupを記録する。未確認のままならNFR5.2未達を維持する。

PC1366×768、390×844、幅320／767／768、200／400%とキーボード・label／通知・安全表示の承認条件を維持し、過去の視覚viewport／CSS scale成功をnative200%の代用にしない。最後に作業タブ・倍率を戻し、自身のpreview／Next／隔離schema cleanupを確認する。他者資源は停止しない。

## Coverage, Evidence and Limits

全app/srcのline>=80、既存v8／include／exclude／thresholdと全suiteのgreenを維持する。除外追加・assertion緩和・timeout延長・coverage pragma追加で合格させない。実行証拠は受入ID、exact command、Redの実失敗出力、Green／Refactorのexit／件数と対象版をrootへ返し、rootが公式Unit記録へ残す。

旧TDDのDB Step14はfixture不備で新しいapp Redがなく、Red順序の逸脱だった事実を保持する。旧native200%は34中33成功／exit1で未確認。今回証拠と履歴を区別し、旧計画の完了印・過去の試験成功数を今回の成功にしない。

U1の現在の修正完了・凍結状態を前提とし、旧記録の未修正表記を現在状態へ転記しない。実Auth／Bsession／Supabase／外部provider／実CI job／本番、既存dependency audit等は今回のローカル検査で成功／解消を主張しない。



