# U3 — 比較の状態・障害復旧設計

## State Ownership and Atomic Boundaries

保存正本/版/操作記録の原子性はU1の同一transaction。U3は操作を依頼する側として、表示・入力・要求・確定結果を分離する。詳細な部品責任は[logical-components.md](logical-components.md)。

| NFR | 解決策 | 境界の検証 |
|---|---|---|
| NFR2.2 | LC2がC3の一貫snapshotを全件検証し、LC1が現選択に対応する場合だけreadyへ。LC3はその1結果から派生 | 実PG/APIの一貫読取、欠落/余分/別memo/構造不正は部分成功0 |
| NFR2.3 | LC4はCompany志望度とMemo理由に別draft/baseVersion/保存ボタン/outcomeを持ち、changesを当該欄だけに限定 | 片成功/片拒否/片unknown、他欄・他memo・本文・構造・企業自由メモ不変。commitとGET失敗を分ける |
| NFR2.4 | LC4が要求body/operationIdを送信前に固定し、送信中抑止。unknownは手動照会、committedは既結果を保持し読取、unknownは本人が同body/IDを再送 | COMMIT直後切断・同ID再送・異body拒否。比較読取POSTはLC2のread-errorでありoperation照会0 |
| NFR2.5 | LC1がowner/target/field別のdraftとintent/outcomeを保持。LC4表示mountはその投影であり状態生成の起点にしない | 保存→別表示→復帰、unknown→復帰、commit→GET失敗→復帰で新ID/書込0。送信後追加入力は送信snapshotとの比較で残す |
| NFR2.6 | LC5がowner/selection/input世代と全表示版を固定しC3再読取。全参照company/memo版一致・dirty/pendingなし・現世代時だけLC3の表示snapshotから出力 | changed/404/401/invalid/error/途中入力ならfile0。changedは最新表示→再クリック。snapshotVersionのみ変更では拒否しない |
| NFR2.7 | LC1の結果状態、LC4の欄別状態、LC6の旧読取状態を別に持ち、文字と復旧操作を示す | no-selection/loading/empty/no-structure/stale/error、conflict/unknown/committed/readback-errorを混同せず入力保持 |
| NFR3.1 | LC4はconflict時にbase/draftを保持。latestを別領域に取得し、明示rebaseまでbaseVersionを変えない。新意図には新ID | 2client競合→入力を捨てず最新確認→明示rebase→新保存。latest取得失敗/消失は保存停止 |
| NFR3.2 | LC1の本人/選択/要求世代で遅い応答を棄却。明示再取得と出力前確認で他端末変更を知る | 旧成功/旧401が現ownerを変えない。同本人復帰でも最新確認。無限polling/常時配信なし |
| NFR3.3 | 選択変更/既知の変更・削除/当画面commitで比較をstale化。削除済み参照を黙って選択から除いて出力しない | 別client構造更新/本文更新/理由更新/メモ削除/企業削除→版変化/404で出力停止 |
| NFR4.1 | LC3は固定7観点の保存配列だけを使い、未記載/要確認を維持。本文から導出しない | 7観点順/空/不明/本文のみ、欠損を点数や弱点にしない |
| NFR4.2 | LC3は紙7区分と採用Webを別projectionに持ち、Web全metadataを表示/出力へ引き継ぐ | id/category/content/URL/date/confidence/adoptedの架空値が一致、未採用候補を混ぜない |
| NFR4.3 | LC3は保存Company名とMemo出自を使い、manual/generated・dummy/openai/nullを区別 | 生成名不一致で改名0。dummyの検証用ラベル、出自を事実証明にしない |
| NFR4.4 | LC3は派生のみ、画像契約/保存なし。LC6は旧形式の正常操作を別入口で維持 | 新サーバー比較からlegacy書込0、legacyからserver書込0、正常fallback ID/旧日付維持 |

## Write and Readback Lifecycle

editing→saving→committed/unknown/rejected/conflict。commit後はresultingVersionを現在内容だと決めず、最新を再取得する。GET失敗でもcommit記録を消さない。再表示だけでは新意図を作らず、別途の新しい編集と本人保存操作でのみ新意図を作る。unknown中の新しい入力は別draftとして保持し、送信済みbodyを変更しない。同欄の未確定要求を解決するまで新要求は送らない。

別欄がcommitしても未送信の他欄draft/baseを無言で更新しない。比較全体は無効にして再取得し、変わった基準を確認できるようにする。最新を読む行為と入力破棄を結び付けない。破棄確認を取り消したときは選択・入力・focusを戻す。

## Export Transaction Boundary

出力はDB transactionではなく、最後に照合した保存版に対応するファイル作成。確認後に他端末が変更する可能性は残り、出力後までの排他保証はない。確認中の入力/選択/本人の変化はcancel/世代で止める。前回確認の成功を再利用せず、各クリックで確認する。未保存/未確定欄は明示保存/破棄/照会で解決するまで出力しない。

## Failure Domains and Recovery Limits

C4/API/Auth/DB障害ではread-error/unknownを区別して縮退し、架空データや旧cacheで成功を代用しない。legacy利用不能は新保存正本を変更しない。新backup/replica/failover/circuit breakerは追加しない。U1の既存backup責任と未修正session復元問題を引き継ぎ、U3では安全なrestore完了を称さない。reload/OS終了を越えるdraft復旧、新可用性SLAは保証しない。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
