# U3 — 保存企業比較の実装・未完了結果

U3の比較アプリ実装と単体/実PG回帰は存在し、U1改訂2後の全体品質は成功した。ただしStep16の実画面確認がCDP timeoutで未完了のため、Code Generation全体を成功完了とはしない。Step16は未チェックを維持する。前回の失敗/結果は[再開前summary](code-summary-before-post-u1.md)、[検証履歴](verification-results.md)、[手動履歴](manual-evidence.md)に保持し、今回の成功で遡って取り消さない。

## 今回の変更と所有

今回のsource変更は `scripts/check-u3-comparison.mjs` と `docs/company-comparison-local.md` の2file、およびU3記録だけ。比較app/既存4共有接続/単体試験の振る舞いは変更していない。U1の期限試験改訂2は別の正式作業で完了したbaselineであり、U3が変更したとは扱わない。U1 target SHA256 `33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5`、U2 41source aggregate `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8`を保持する。

U3全体の[source-manifest.json](source-manifest.json)は厳密なwrites/path形式の29実fileを保持。6libs/6components/4共有接続/9tests/fixtureとharness2/docsとhelper各1、削除0。開始261file baselineに対する既存4共有差分、root所有handoff、別承認U1 test変更を区別する。他担当/既存dirtyを戻さず、DB/Auth/依存/CI/coverage設定は変更していない。branch `release/bolt-002-company-data-management-local`、HEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。commit/push/mergeなし。

現在29source aggregateは `a56c3783dd915054858aa2f62501da73b82786d01bba63baf6806808a2a69740`。[fingerprints](source-fingerprints.json)に各bytes SHA256を列挙。算式はsorted `path:sha256`をLF結合、末尾LFなし。今回開始値c567f1d4…から変わったのは上記helper/docsだけ。

## 実装判断の維持

保存企業1〜20社・1社1構造化メモ、固定7観点、空は未記載、要確認保持。自由本文から事実を生成せず、紙/採用Web全metadata/出自/dummyを分ける。Versionは非空の不透明値。安全Markdown/URL境界を維持する。

既存C1/C3/C4を構成利用し、新API/DB/DTO再定義を追加しない。Company志望度とMemo理由は別版・別保存・changes限定。同ID/bodyのunknown照会/明示再試行、base/draft/latest分離、committed後GET失敗と保存成功の区別、送信後追加入力を保持する。storeはbrowser app instance内owner別でSSR共有なし。毎出力C3全版/owner・選択・入力世代を確認し、dirty/pendingなしの場合だけ同snapshotから1file。旧比較は明示入口で、正常形式を維持し混在破損を欠落書込/自動移行/送信しない。

## Step16の診断と未達

[今回の詳細証拠](post-u1-resume-evidence.md)に有限実行を記録。前回のreadErrorを狭く診断し、切替後C3実HTTP503/unavailable（browser265ms/server228ms）、直後の同selected直接C3は200/20sourcesを観測した。原因をlock/期限/取消し/実装bugへ飛躍させていない。画面の読取error表示は契約内で、本人の明示再取得で送信済み値/保存成功を保持し追加PATCH0で回復した。

helperは残M専用区間へ分離し、読取失敗による出力阻止と明示再取得/追加write0を別checkにした。候補page完了前の操作というhelper待機不備を局所修正後、入口h1・M2別メモ/同企業志望度・他client構造更新/本文分離・M3独立保存/GET失敗/追加入力保持/出力阻止まで5check成功。その後CDP Runtime.evaluate timeoutでprocess exit1。正確な停止操作/原因は未確定でapp Red扱い/production修正なし。helper反復を止めた。

最後2回はpreview/Edge/profile/schema cleanup全true、preview exit0、errors=[]。別の有限診断1回はpreview exit1/stop報告falseで、終了後の専用PIDなし/schema0/DB clients空/3000・9224応答なしを別途確認した。その履歴を総合cleanup成功へ変更しない。

M4 COMMIT直後途絶/実route remount、M6追加不正/期限/遅延入力/削除/各版変更、M7制御401のDOM復旧と実Bを含むA/B/A、M8正常/混在/読取不能、M10scroll等は未確認。M9全幅での全エラー操作/M12企業詳細の実操作も未確認。実B sessionは現在single-ownerローカル構成では成立しない。実Auth待ちへ戻さず単体/実PG証拠と区別する。以前のnative200/400保存/出力/旧入口やHTTP p95の成功は[手動記録](manual-evidence.md)の実施範囲だけに限定する。

## Step17の今回の実結果

Node22.23.3/npm11.6.1/Vitest4.1.8、dummy Auth/provider、loopback実PG17.6。専用preview終了後、重い検査を順次実施した。

| command | 結果 |
|---|---|
| npm run lint | exit0、warning0 |
| npm run typecheck | exit0 |
| npm test | 54files/587passed、skip0、exit0（29.43秒） |
| npm run build | exit0、全route生成 |
| npm test -- --passWithNoTests=false --coverage | 54files/587passed、skip0、exit0（30.01秒） |
| git diff --check | exit0、既存LF/CRLF警告のみ |

全app/src lines83.50%（2794/3346）、statements81.89%（2944/3595）、branches73.11%（1917/2622）、functions79.09%（719/909）。include/lines80下限/既存assertionは変更していない。U3全119件を含む全体回帰で、実PGはskipなし。旧U1期限失敗は歴史として保持し、今回のU1修正後sourceの結果と区別する。品質成功はStep16合格の代用ではない。

## 追跡と懸念

[traceability.json](traceability.json)に90AC/17BR/30NFRの137IDを保持。35ACのU3実装対応/55AC他Unit境界と手動未達を分け、Deferredを成功へ一括変更しない。[TDD記録](tdd-evidence.md)は以前の受入Red→Green→Refactorを保持。今回のhelper/setup/CDP失敗を新しいapp Redに加算しない。

U1既知3不備（競合draft破棄/復元session復活/lock待ち後削除期限）、U2既知2件（保存後往復の同候補別ID重複/native200入口未確認）、audit high5/critical1は未修正。実Auth/Supabase/秘密/実CI job/公開/merge SHA/Vercelは未確認・本人担当。新依存/有料資源/配置変更なし。
