# U3 — 既知2不具合修正のUnit試験手順（revision 02）

## Scope and Preconditions

[修正計画](code-generation-plan.md)に対する新しい正式Plan Approval後に実行する。現在は計画のみで、新規テスト追加・実行・Red/Greenの主張はない。既存Node22系、Vitest4.1.8/node環境、v8・全app/src lines80%以上、既存依存とdummy provider/Auth、localhostの使い捨てPG17を使う。新しいrunner/provider/include/exclude/threshold/timeout変更は不要。

U1/U2 helpers/fixture/hookHarnessは読取再利用のみ。既存4試験を更新し、他のU3試験・fixture/uiHarnessは維持する。実B認証・Supabase・実外部API・Vercelは不要で、実B未確認をfixture OWNER_Bの成功で置換しない。全体baseline/品質・画面手順・cleanupは計画に集約し、この文書のrun commandはすべてU3 exact fileだけに限定する。

## Runner Readiness — Step 1

既存readinessを最初に実行し、その後変更前U3全9ファイルを実行する。新テストを書く前に成功・実件数・skip・exitを記録する。収集0件/準備不備はRedではない。PG準備失敗をアプリ不具合と数えない。

```text
npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false
```

U3全9ファイルのexact commandは末尾に示す。同じcommandを変更前確認と最終回帰で使う。

## New Regression Cases

予定20件。既存正常/異常テストを残したうえで、修正対象に意味のある差分だけを追加する。既存ケースを削除して件数を合わせない。正常対照が初回Greenならそれを記録し、すべてをRedと偽らない。

| ID | Exact file | 受入に結び付く観測 |
|---|---|---|
| S-R1 | tests/u3-company-comparison/session.test.ts | C3全選択404で参照ガード、選択/snapshot/draft/base/intent/outcomeを保持し、原因列を推測しない |
| S-R2 | tests/u3-company-comparison/session.test.ts | 旧選択/旧owner/旧要求世代の404で現参照を停止しない |
| S-R3 | tests/u3-company-comparison/session.test.ts | 同本人・同対象の有効snapshotだけが対応ガードを解除、別対象を勝手に有効化しない |
| S-R4 | tests/u3-company-comparison/session.test.ts | 選択外の保持field/無関係な有効fieldに404を波及させない |
| S-R5 | tests/u3-company-comparison/session.test.ts | 一時往復/owner別退避で利用不可とdraft/送信済みintentを失わず、復旧を自動保存へ変えない |
| C-R1 | tests/u3-company-comparison/edits.test.ts | メモ参照404後、dirtyでもsaveを直接呼んで新operation/new PATCH0、base/draft保持 |
| C-R2 | tests/u3-company-comparison/edits.test.ts | 企業404後はその企業志望度/所属メモ理由の新規保存0、他企業へ波及なし |
| C-R3 | tests/u3-company-comparison/edits.test.ts | 409→latest503等でconflict/base/draft/凍結要求を維持、outcomeなし、成功を通知しない |
| C-R4 | tests/u3-company-comparison/edits.test.ts | commit→対象GET404でもcommitted/outcome保持、参照利用不可と確定を分離、新規保存0 |
| C-R5 | tests/u3-company-comparison/edits.test.ts | unknown＋404でも同ID lookup可能。lookup committedは元確定、lookup unknown→明示retryは既存同body/同IDだけ。自動再送/新ID0 |
| C-R6 | tests/u3-company-comparison/edits.test.ts | 正しく対象/版を検証した有効な他欄は新規保存可能。部分GETでは全体ready/exportにしない |
| C-R7 | tests/u3-company-comparison/edits.test.ts | 旧世代latest成功/404が現ガードを解除/停止しない。現対象の一時通信失敗を恒久消失へ変換しない |
| U-R1 | tests/u3-company-comparison/ui.test.ts | 実409 callback→latest失敗後、FieldEditor/保持操作欄の双方に保存成功文なし。競合・入力保持・取得失敗を表示 |
| U-R2 | tests/u3-company-comparison/ui.test.ts | 当該committed outcome＋readback失敗だけ成功と取得失敗を表示。outcome欠落/他意図の確定を成功根拠にしない |
| U-R3 | tests/u3-company-comparison/ui.test.ts | 実refresh callback404後、入力/新規保存/rebaseが利用不可。実controllerを直接呼んでも新PATCH0、dirty保持・file0 |
| U-R4 | tests/u3-company-comparison/ui.test.ts | refreshの503/通信失敗は取得失敗として表示し404と区別。古い比較から出力なし |
| U-R5 | tests/u3-company-comparison/ui.test.ts | 削除/選択外unknownの保持欄から同ID lookupへ到達し、確定/不明を正直に表示。新ID発行なし |
| U-R6 | tests/u3-company-comparison/ui.test.ts | 有効な別対象の明示latest確認→欄保存継続、消失欄は停止。label/statusと全体export停止を維持 |
| I-R1 | tests/u3-company-comparison/comparison.integration.test.ts | 実PGでメモ削除確定→U3 C3 404→同じ状態境界へ反映→controller新規save→new PATCH0 |
| I-R2 | tests/u3-company-comparison/comparison.integration.test.ts | 実PGで企業/所属削除確定→同経路→志望度/理由new PATCH0、送信済み操作の同ID照会は維持 |

S/Cのbusiness logicとIの結合をStep3 Red→Step4 Green→Step5 Refactorで実行し、UのfrontendをStep6 Red→Step7 Green→Step8 Refactorで実行する。C-R5の明示同ID再試行とC-R1/Iの「新規PATCH0」は別計数にする。request/body/operationId/対象/版を照合し、disabled属性だけや「エラーが出た」だけのassertionにしない。

主追跡はUS8.1/US9.1、共同US6.3/US6.4/US6.5、AC6.3.1〜4/AC6.4.3/AC6.5.4/AC8.1.4/AC9.1.4、BR4.1〜4.4/BR5.1/BR5.2、NFR2.3〜2.7/3.1〜3.3。S-R2/C-R7はBR1.2/NFR1.2、UI通知はBR7.1/NFR5.3にも対応する。

## Exact Commands — Business Logic and Integration

```text
npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts --passWithNoTests=false
```

```text
npm test -- tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

結合は既存runtimeFixture、C4 handler/service/実PG adapterを再利用し、専用random schemaで架空企業/構造化メモを作る。削除確認ID→削除確定→C3 not_found/404を実行し、以後のcontroller送信spyを確認する。U3状態境界との接続はU-R3実refresh callback試験と対にする。handler経由のResponseを実TCP HTTPや実ブラウザ通信と称さない。finally/afterAllで専用fixture/client/schemaだけを閉じる。新migration/APIテストRedは作らない。

## Exact Command — Frontend Behavior

```text
npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false
```

既存HookHarness/SSR/実callbackを使用。可能な限り実ComparisonSession/ComparisonEditsと制御portを組み合わせる。表示を再投影して成功文の不在/存在、値・ガード・送信数・確定IDを確認する。fixtureへのstatus直接代入だけで404の実配線確認を済ませない。Live DOM/keyboard/zoomの証明ではなく、実GUIは計画M-R1〜5に分ける。

## Exact U3 All — Before Changes and After Refactor

```text
npm test -- tests/u3-company-comparison/readiness.test.ts tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts tests/u3-company-comparison/legacy.test.ts tests/u3-company-comparison/ui.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

未変更model/client/export/legacyも維持する。既存7観点/出典/owner/未知結果/有限期限・GET最大再試行1回/非GET自動再送0/毎クリック全版確認を落とさない。旧119件や先行全体615件は今回の実実行数ではない。最終総数は変更前baselineと実際の追加差分から記録する。

## Mocking, Coverage and Evidence

架空データ・dummyのみ、fake fetch/clockと送信spyを使用。latest失敗は404と503/切断を分ける。送信済みrequestはclone/比較し、再試行でID/bodyが同一、再表示/lookupだけでwrite増分0であることを確認する。古いoutcome、別field、別ownerの結果を当該成功へ誤適用しない。保護内容や完全bodyを証拠/consoleへ出さない。

全app/src line coverage80%以上とCI条件は維持し、Unit別coverageの新閾値や除外を作らない。全体計測コマンドは計画Step2/10を参照する。Red原因、command/exit/件数/skip、AC/BR/NFR対応、Green/Refactor、PG cleanupを承認後の公式Unit記録に残す。未実行・準備失敗・既存不備は区別する。今回の計画段階でStep5/trace/source-manifest/承認/state/auditを書き換えない。

## Sources

- [修正計画](code-generation-plan.md)、[旧試験手順](unit-test-instructions.before-revision-02.md)、[正式レビューR-01/R-02/R-03](reviews/review-01.md)。
- [機能設計](../functional-design/functional-spec.md)、[業務ルール](../functional-design/rules.md)、[整合性設計](../nfr-design/reliability-design.md)、[共有契約](../../../inception/contract-design/contract-summary.md)。
