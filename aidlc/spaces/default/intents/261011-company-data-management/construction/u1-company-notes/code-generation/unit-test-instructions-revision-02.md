# U1：COMMIT期限試験の修正手順（改訂2）

## Scope and Preconditions

今回の唯一のコード差分は `tests/u1-company-notes/routes.test.ts` のCOMMIT期限caseと必要なimport。実装コード・他case・DB定義・共有helper・依存/CI/coverage設定・U2/U3 sourceは変更しない。Node22.23.3、既存Vitest4.1.8、dummy認証/provider、localhost/workspace_testの隔離実PostgreSQL17を使用する。

本手順と[計画改訂2](code-generation-plan.md)の新しいPlan Approval前は実行/テスト変更をしない。旧計画の承認や「U1計画へ戻る」回答は今回の実装承認ではない。全体品質/coverage/checkpointのcommandは計画にだけ記載し、本書のUnit commandへ重複させない。

## Runner Readiness — Step 2

```text
npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false
```

既存U1のpure schemaをexact指定し、収集/runner成功・skip0・exit0を確認する。DB health・最小role・隔離cleanupの前提も別に確認する。環境不備や0件をRedとしない。新しいsample/runner/configを作らない。

## Focused Green and Refactor — Steps 4 and 5

```text
npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false
```

現在の19caseを維持する。対象の1caseは制御transport＋本物のWorkspaceDatabase/requestScope、他18caseは実PG。40ms/operation_unknownを維持し、COMMIT到達前にclockを進めない。clock/performance/timerの時間軸、barrierの解放、未処理rejectionなし、release/cleanupをassertする。focused成功は全体成功を代替しない。

修正前のRed確認は計画Step3の全体commandと同一sourceの実失敗記録に従う。focusedが通過したことをRedと書かず、故意のproduction破壊やtimeout緩和をしない。

## Real PostgreSQL Regression — Step 6

```text
npm test -- tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/routes.test.ts --passWithNoTests=false
```

現在のexact3file/39caseを基点に実件数・skip0・exitを記録する。対象1caseのみfake transport、その外のDB境界は実migration/adapterを通す。特に以下の既存caseは削除/弱化せず成功を確認する。

- repositoryの「COMMIT応答途絶はunknown、別接続で確定操作を照合」。
- routesの「unknown operation outcome is not uncommitted」。
- routesのAuth残時間と「deadline destroys an in-flight write and prevents late commit」。
- database/repositoryの原子性・RLS・rollback・接続破棄/返却。

実DBなし・権限不備はsetup失敗。skipやfake置換で合格にしない。隔離schema/clientだけをfinallyで片付け、他の接続・人間のDBを削除しない。

## Mocking and Ownership

当case内だけでPool/PoolClientの応答を制御する。pool max3、role/sessionの最小架空応答を返し、COMMIT呼出しを観測する。withRequestDeadlineやWorkspaceDatabase.transaction/markTransactionCommitをstubして期待エラーだけ返す方法は使わない。

Vitest既存機能でtimerと単調時計を制御し、COMMIT到達後にのみ40msを進める。afterCommit barrierはfinallyで解放して残continuationを回収し、real clock/spyを必ず復元する。無限待ち/任意sleepへ依存せず、runnerの有限上限内で待機失敗が表れるようにする。

架空本人以外の資格情報・画像/本文/鍵・SQL引数を記録しない。書込fixtureの実認証/RLS/原子性は上の実PG試験に委ね、制御transportを実DB証拠へ加算しない。既存のテスト数を減らさず、skip/todoや複数エラー許容にしない。

## Coverage and Evidence

全app/src lines>=80、既存include/thresholdと全体lint/typecheck/test/buildは計画Step7を参照する。本書のexact groupだけのcoverageや旧82.48%を今回の全体合格へ流用しない。DockerやCI定義は今回変更しない。

deadline-repair-baseline.jsonとdeadline-repair-evidence.mdへ現在source hash、Redの元command/exit/期待/実際と現在source一致、Green/Refactorのcommand/exit/count/cleanupを記録する。過去結果・今回実行・fake分類・実PG結果を別欄にする。Step5は今回の1case修正と旧U1実装を区別し、既存source claimsと未解決所見を保持する。本人の新承認前にはこれらの試験結果を作らない。

## Sources

- [修正計画](code-generation-plan.md)、[初回の全Unit試験手順](unit-test-instructions-initial-revision-01.md)。
- [元診断](../../u3-company-comparison/code-generation/u1-deadline-diagnosis.md)、[元の全体失敗](../../u3-company-comparison/code-generation/verification-results.md)。
- [期限/結果不明の設計](../nfr-design/reliability-design.md)、[PD2](../nfr-design/performance-design.md)、[共有契約C4](../../../inception/contract-design/contract-summary.md)。


