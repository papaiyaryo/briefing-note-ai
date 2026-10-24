# U3 — U1改訂2後の再開証拠

公式fresh briefのtarget U3、Testing Contract a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440、18Step（15完了・16再開）とrules全文を読了。省略表示された初回読取を分割して全文回収した。既存29sourceは欠落0/変更0、開始aggregate c567f1d4ff8637a9e10d97f133d679aa46eb97801cbe0752c048a3a3c777d5ae。U1修正後target SHA33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5を保持する。

## Step16：切替の有限診断

helper構文確認exit0後、`node scripts/check-u3-comparison.mjs --diagnose-switch`で20社選択・別メモ・commit後GET失敗・送信後追加入力・破棄・旧/新切替だけを実行。既知の全flow/100回性能検査/native操作を反復しない。診断は残る受入を意図的に実行せずexit1にする。

初回の比較応答は直前3回200/20sources、切替後503/code unavailable/client-side aborted=false、画面server=true/loading=false/readError=true/login=false。直後の同selected直接C3は200/20sources。原因を取消し/世代/production bugとは断定しない。読取失敗を画面がerrorにするのは契約の範囲で、helperの必ずreadyになる前提と区別する。app Red認定/production修正なし。

専用preview/Edge/profile/schema cleanupは全true、errors=[]、preview exit0。第二の有限診断では安全なstatus/code/所要時間と、明示再取得で回復した際の確定値/重複writeなしを確認する。秘密・本文・画像内容は診断出力に含めない。

第二診断も切替C3は503/unavailable（browser265ms、server log228ms）、直後直接C3は200/20sources。明示した比較参照再取得で、送信済み理由/保存成功表示を保持し追加PATCH0でreadyへ回復した。実行時間だけでlock/期限/abort等の原因を断定しない。診断は残る受入未実行の意図的exit1で、app Redではない。

この回のpreviewはexit1・stop報告false、schema/Edge/profileはcleanup trueだった。終了後read-only確認で当回の既知専用PID3件は存在せず、schema0/DB clients空/3000・9224応答なしを確認した。preview exit0や総合cleanup成功へ遡って読み替えず、資源残存なしを別の観測として残す。U1 preview helper自体は変更しない。

以後は未到達Mだけを独立区間として実行する。読取errorを観測した場合は出力阻止をassertし、本人の明示再取得1回による回復と追加write0を別checkにする。503が発生した事実を隠す成功扱いにしない。

## 残M区間と停止点

helperを`--remaining`の独立区間へ整理し、構文exit0・自己検査exit0/意図的失敗exit1を確認。初回はメモ候補reload前の次page操作で有限待機失敗、app Redではない。候補取得loading解除と次page enabledを有限待機する局所修正後、構文exit0で1回だけ再実行した。

再実行では入口h1に加えM2の別メモ理由/同企業志望度、別client構造変更と本文分離、M3の志望度単独保存とcommit後GET失敗、送信後追加入力保持/出力阻止の5checkが成功。その後CDP Runtime.evaluateが15秒timeoutで停止しexit1。正確な停止操作/原因は未確定でapp Red認定/production修正なし。M4以降の未到達条件を成功にしない。両回とも専用preview/Edge/profile/schema cleanup全true、preview exit0、errors=[]。helper反復を停止しStep17/18へ進む。

M4のCOMMIT直後途絶/実route remount、M6の追加不正/期限/遅延入力/削除/各版変更、M7制御401の実DOM復旧と実Bを含むA/B/A、M8正常/混在/読取不能、M10scroll等は今回も未確認。以前のunit/実PGの成功やnative200/400実操作をこれらの代用にしない。Step16は未チェックを維持する。

## Step17/18の確定と書止め

専用preview終了後の順次品質検査はlint（warning0）/typecheck/test/build/coverage/diffすべてexit0。全体testは54files/587passed（29.43秒）、coverageも同587passed（30.01秒）、全app/src lines83.50%（2794/3346）。statements81.89%/branches73.11%/functions79.09%。既存include/lines80下限/assertion不変、実PGskipなし。最後のread-only診断もschema0/DB clients空/3000・9224応答なし。

最終構造・リンク・所有・hash validatorはexit0/errors0。strict manifest29file、trace90AC/17BR/30NFR、全source bytes hash一致、文書リンク欠落0。現在aggregate a56c3783dd915054858aa2f62501da73b82786d01bba63baf6806808a2a69740。今回resume差分はhelper/docsのみ、app/test不変。U1 aggregate4f419fdb5da964d28f61d712638557e56a497cf780389c508ea47578e293510cとU2 aggregate53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8も不変。元baselineからの既存4共有変更/root handoff/別承認U1 test変更を今回変更と混同しない。

自己reviewで未到達M・CDP timeout・原因未確定503・過去の失敗/cleanup限界と品質成功を分離した。文書patchにcontext不一致があった箇所は現内容を読取後に記録だけ補正し、アプリ/実検証結果は変更していない。Step17/18の実施内容を完了checkboxへ反映、Step16は未チェック/受入未完了を維持し、source/producesを書き止める。全体Code Generation成功や公式Unit完了を宣言しない。
