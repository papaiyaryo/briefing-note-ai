# 既存U1期限試験の読取診断・未適用案

## 観測

凍結U1 `tests/u1-company-notes/routes.test.ts:252〜` のCOMMIT不確実性試験は、実PGのtransactionを要求期限40msで囲み、afterCommitだけを120ms待機させる。`requestScope.ts`は期限時のcommitting>0ならoperation_unknown、それ以前ならunavailable。`database.ts`はpool取得、BEGIN、timeout/role/session設定、bodyの後で初めてcommitStarted/markTransactionCommitを設定する。したがってbefore-COMMITの実時間が40msを超える実行では、afterCommitの待機へ入らずunavailableが返る。現在の失敗出力だけでは実際にどの前段が時間を消費したか確定しない。

前回全suiteは585/586成功、当caseのみunavailableで失敗し、重い検証を別に起動しない順次実行でも再現した。focused19件は成功したが、全体失敗を取消さない。

Retry時のU3 exact9file/119件成功後、内容なしのread-only診断は、隔離u1_test/u1_preview schema0、workspace_testの他接続0、専用port3000/9224応答なし。安全なCIM読取で該当node process0（診断自身のpwshのみ）。U3が試験後もpool/schema/専用previewを残している証拠は得られなかった。全suite内の同時PG/CPU競合やOS schedulingの寄与は未測定で、原因を断定しない。

## 再承認が必要な最小案 — 未実装

対象は凍結 `tests/u1-company-notes/routes.test.ts` の当1caseと必要なimportだけ。U1 production source、40ms値、期待operation_unknown、検証command、Vitest/include/coverage設定は変更しない。

当caseを、既存WorkspaceDatabaseのtransactionとrequestScopeを通す制御可能なPoolClient transportの単体境界へ分離する。pre-COMMIT queryは有限に解決し、COMMIT到達を観測するbarrierを設け、afterCommitは別barrierで保持する。既存Vitestのfake clockで40msをCOMMIT到達後に進め、unknownのassertion、実際のCOMMIT到達、release/後片付けを確認する。fake時計のfinally復元とbarrier解放を必須にする。無期限待ちや新依存は追加しない。

既存実PGの「unknown operation outcome is not uncommitted」、実U3 PGの「COMMIT後応答途絶を同ID照会で解決」、COMMIT前の期限/遅延書込防止の実PG試験は維持する。前段の実PGはそのままでJS時計だけをfakeにする案ではPostgreSQL17のtransaction_timeout自体は実時間のままなので、当境界の安定制御を保証できない。

対応はC4の確定不明を未実行と扱わない契約、U3共同BR4.2/NFR2.1/NFR2.4。期待値をunavailableへ緩めたりdeadlineを延ばす案ではない。一方、この1caseの証明範囲が「実PGのCOMMIT期限」から「制御transportでのCOMMIT期限分類」へ変わるため、TDD/試験戦略の実質的な変更としてrootから必要な承認経路へ戻す。U3担当の現権限では適用しない。

承認後の確認案: unchanged focused exact `npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false`、U3 all exact、登録済み全体`npm test`、既承認の全app/src coverage command。全suiteを順次実行し、実PGの応答途絶・同ID照会の証拠が引き続き成立することと、clock/PoolClient残存がないことを確認する。production変更なし、他のU1既知不備を一括修正しない。
