# U2 verification results

Node22.23.3、既存Vitest4.1.8/v8、PostgreSQL17.6の隔離schema、dummy Auth/providerで実行。Node22 wrapperはpreflightに記録し、以下の承認済みnpm commandを変更しない。実秘密・実LLM・実Supabase・Vercel操作なし。

## Final application checks

| command | 実結果 |
|---|---|
| npm run lint | exit0。初回warning2件を非動作整理し、限定再確認は警告0・exit0。 |
| npm run typecheck | exit0。warning整理後の再確認もexit0。 |
| npm test | 45files / 468tests passed、exit0。 |
| npm test -- --passWithNoTests=false --coverage | 45files / 468tests passed、exit0。全app/src lines84.07%（2328/2769）、statements82.53%、branches73.36%、functions80.72%。 |
| npm run build | Next15.5.19、compile・型・18静的page・build traceまで成功、exit0。実秘密不要。preview停止後に実行。 |
| git diff --check | exit0。LF→CRLF予定のGit warningのみ、空白エラーなし。他者差分の改行変更はしない。 |

全体coverageのinclude/exclude/80%下限は変更しない。coverage後のsource整理はhelperのif/elseと試験の未使用変数除去だけで、app/src動作の変更なし。影響するlint/型/実PG10件を限定再確認し、10passed/exit0。新app変更がないため全体coverage/buildを不要に繰り返さない。

## Unit and inherited regression

承認済みexact file commandは[単体手順](unit-test-instructions.md)のまま。

- readiness: 既存4files/16tests passed、exit0。準備wrapper失敗はRedへ数えない。
- model: 3files/22tests passed、exit0。
- server: 2files/20tests passed、exit0。
- API/client: 2files/46tests passed、exit0。
- UI: 1file/34tests passed、exit0。既存U1 UI exact38testsもpassed/exit0。
- SQL: 実PG1file/10tests passed、exit0。warning整理後も同10件成功。
- U2全9files: 前回131tests passed/exit0。その後追加1件を含む現在132件のexact最終結果も132passed/exit0。
- 既存15file生成/復習/出力回帰: 前回82passed/exit0。現在sourceでのexact最終結果も15files/82passed/exit0。全suite468件にも当該試験を含む。

実Red/Green/Refactor、helper失敗との区別は[tdd-evidence.md](tdd-evidence.md)。独立したDB/repository変更はなく、Step14の新app Redは未実施。初回9passed/1fixture失敗→fixture修正後10passedを、Red達成へ読み替えない。

## Local capacity and adapter reference

既存U1 operationalCasesを最終全suiteで再実行。代表量100企業/1000メモ/10000操作、warmup5、2client各50回。ローカルadapterの参考値であり、実HTTP/ネットワーク/実Supabase p95目標達成の代用ではない。targetは同じbranchのU2アプリ本体、開始HEADはbaseline記録、実source hashはsource-fingerprintsを参照する。

| 操作 | p95 ms | 最大 ms | 失敗 |
|---|---:|---:|---:|
| board | 96.38 | 184.79 | 0 |
| detail | 25.32 | 34.83 | 0 |
| memo page | 28.52 | 39.34 | 0 |
| operation lookup | 22.73 | 31.57 | 0 |
| 50 memo deletion including preparation | 163.72 | 214.98 | 0 |

専用schema 3,317,760bytes、ローカルDB全体15,502,483bytes。代表fixtureは200MiB予算内だが、全データ最大長・本番Free枠・他processを含む容量保証ではない。登録件数の新上限にはしない。新U2 backup/restore領域はなく、U1復元sessionの未修正問題を成功扱いしない。

## Real browser acceptance remains partial

既存Edge155.0.4283.45/CDP1.3、Windows、架空2x2 PNG（64KiB未満）、dummy・実PGで実施。helper偽陽性確認はfalse→exit1、構文確認exit0。最後の `node scripts/generated-notes-browser-check.mjs` は**34確認中33成功、exit1**。

native200%はCSS幅671/DPR2まで実測したが生成入口label未到達、原因未確定。native400%はCSS335/DPR4で入口到達。候補の視覚拡大やCSS viewportリフローは別に成功しており、それをnative操作受入へ読み替えない。NFR5.2/Step18全体は未達で、追加試行を無期限に続けない。

固定企業・署名改変拒否・不正構造拒否・別正本・全項目実PG再取得・unknown/同一要求/commit後応答途絶・GET失敗後成功維持・PCキーボード/通知/label/取消・狭幅・画像解放・単発生成/復習/対応出力は成功。詳細・各回のhelper不備・限定再確認の経緯は[manual-evidence.md](manual-evidence.md)へ分離。SSR/callbackを実DOM・本人切替の成功へ読み替えない。

全runで自身のpreview停止/schema削除/Edge停止はtrue、最後のprocess exit1まで回収。試験PG serviceは後続検証用に保持し、他者process/schema/volumeは終了・削除していない。

## Deferred

- native200%での生成入口操作、実ブラウザの別本人切替と遅延応答の受入は未確認。
- U1競合draft破棄、復元session復活、親lock待機後の削除期限再検査は未修正。共同受入は保留。
- 実Supabase/Auth/role/TLS/pooler/Free枠、実LLMの保持設定・速度、外部API p95、実CI job、実merge/deploy/公開受入は未確認。Vercel実作業は本人担当。
- 依存audit high5/critical1の既存baselineは未解消。新依存・forced fix・承認外upgrade・リスク受容を行っていない。
