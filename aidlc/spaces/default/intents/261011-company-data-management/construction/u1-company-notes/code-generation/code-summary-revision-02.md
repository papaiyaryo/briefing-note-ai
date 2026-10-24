# U1：COMMIT期限試験の改訂2実装結果

承認済み改訂2の8StepとTesting Contract `a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440`に従い、期限試験1件を制御transportへ分離し、今回のローカル検証を完了した。旧U1の実装・画面・復元・性能・audit実績は[初回summary](code-summary-initial-revision-01.md)、[初回trace](traceability-initial-revision-01.json)、[従来TDD記録](tdd-evidence.md)に履歴として保持する。旧336tests/82.48%を今回の実行証拠へ流用しない。

## 今回の変更と所有

唯一のアプリ側変更は `tests/u1-company-notes/routes.test.ts` の期限case1件と必要なimport/説明。元の先行18caseはimportを除きLF正規化後全文一致。production、DB/Auth、他test/共通helper、依存、CI、coverage、U2/U3は変更していない。ignoredのloopback PG health scriptは一時診断でsource claimに含めない。

branch `release/bolt-002-company-data-management-local`、HEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。既存release/worktreeとdirtyを保全し、commit/push/mergeなし。[開始baseline](deadline-repair-baseline.json)の204fileに対する差分は今回targetとroot所有handoffだけ。後続Unitによる共有file変更は開始baselineであって今回の変更ではない。

[source-manifest.json](source-manifest.json)は既存91claims（展開94file）を維持し、当1fileだけへ縮小していない。新しいアプリfileの追加/削除なし。現在94fileのbytes aggregateは `4f419fdb5da964d28f61d712638557e56a497cf780389c508ea47578e293510c`。算式はsorted `path + NUL + SHA256(bytes) + LF`のSHA256で、commit SHAではない。[source-fingerprints.json](source-fingerprints.json)に全94fileのhashと今回1file差分を分けて記録する。旧reviewed TSVと旧aggregate5d814912…は履歴として変更していない。

凍結U2の41source NUL/LF aggregate `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8`、U3の29source colon/LF aggregate `c567f1d4ff8637a9e10d97f133d679aa46eb97801cbe0752c048a3a3c777d5ae`を保持する。

## 試験判断と証拠

修正前bytes hash `93a94a79166eea5e8bb594b812cb00d8c721aa575cf78f4d9f9ad933c9dc6989`の全suiteを1回実行し、586passed/対象1failed・exit1を確認した。40ms以内の実PG前段完了を暗黙条件にした旧試験がCOMMIT前にunavailableへ到達する問題で、OS/PGのどの前段に時間がかかったかまでは断定していない。

新caseは本物のWorkspaceDatabase/withRequestDeadlineを通すcase内Pool/PoolClientを用い、実COMMIT呼出しとafterCommit到達をbarrierで確認してから元request AsyncLocalStorage内のafterCommit continuationで単調時計40msを進める。operation_unknown期待・COMMIT一回・拒否観測先行を維持し、classificationをstubしない。finallyでbarrier/continuation/接続/timer/時計を回収・復元する。有限watchdogはbarrierの終了確認だけで40ms契約を延ばさない。

最初の新focusedは18/19（外側contextでfake timerを進めた試験制御不整合）、同case内の時計進行contextを補正後19/19成功。これを新production Redには数えない。Green後は既存Prettierで当fileを整形し同exact19件のRefactorを実行した。

この1caseは制御transport上のCOMMIT後分類の証明で、実DBの原子性/RLS/応答途絶の証明ではない。残18routes caseと既存実PG群は維持し、COMMIT前取消・実COMMIT応答途絶後の別接続同ID照会・HTTP unknownを別に検証した。詳細は[改訂2 evidence](deadline-repair-evidence.md)、修正前全文は[target-before](deadline-repair-target-before.json)。

## 今回の検証結果

Node22.23.3/npm11.6.1、既存Vitest4.1.8、dummy Auth/provider、loopback PostgreSQL17.6。重い検査は順次実行し、実外部API秘密なし。

| command | 実結果 |
|---|---|
| readiness schema exact | 1file/24passed、skip0、exit0 |
| focused routes exact Green / Refactor | 各1file/19passed、skip0、exit0 |
| database/repository/routes exact | 3files/40passed、skip0、exit0 |
| npm run lint | exit0、warning0 |
| npm run typecheck | exit0 |
| npm test | 54files/587passed、skip0、exit0 |
| npm run build | exit0、全route生成 |
| npm test -- --passWithNoTests=false --coverage | 54files/587passed、exit0、全app/src lines83.50%（2794/3346） |
| git diff --check | exit0、既存LF/CRLF警告のみ |

実PG groupは計画の39件見込に対し40件（database10＋既存import operational1＋repository10＋routes19）。今回のcase追加ではない。制御1件と実PG側39件を区別する。全suiteの実PG結合もskipなし。

coverage include/lines80下限を維持。statements81.89%（2944/3595）、branches73.11%（1917/2622）、functions79.09%（719/909）。他指標を80達成とはしない。終了後read-only診断は専用schema0・DB clients空・preview3000/CDP9224応答なし。今回画面helper/復元を再実行したとは主張しない。

## 受入範囲と未達

[traceability.json](traceability.json)の90AC/23BR/33NFRを保持。今回直接強化したのはBR6.5/BR10.1・NFR2.1/2.4等の期限分類根拠であり、全受入やリリース完了ではない。AC6.3.2（競合latest時draft破棄）、BR6.6（親lock待ち後の削除期限）、NFR2.6（復元で失効session復活）はDeferredとして既知未解消を明記した。従来OKは対応するローカル実装/試験の根拠で、本番保証ではない。

U2の保存→OCR/復習往復後の別ID重複保存とnative200%入口未確認、U3旧新切替後readErrorの原因未確定と未到達Manual条件は本変更で解消していない。U2完成記録を取り消さずU3はpausedのまま。既存audit high5/critical1は未対処（初回summaryに対象/版/限界）。依存upgradeは行っていない。

実CI job、実Supabase/本人Auth/秘密、外部p95/Free枠、公開受入、実merge SHA、Vercel作業は未実施。設定parseやローカル全suite成功をこれらの成功へ読み替えない。
