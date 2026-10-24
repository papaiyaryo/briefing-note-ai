# U3 — 保存企業比較の実装引継ぎ

保存企業から各1構造化メモを選ぶ比較、7観点と採用Web/出自表示、志望度とメモ理由の独立保存、全版を再確認する比較.md、明示した旧比較入口を実装した。全体suite失敗と手動未確認variantが残るため、Unitは未合格のまま書き止めた。

## 成果物

- [検証結果と未実施項目](verification-results.md)、[TDD記録](tdd-evidence.md)、[実画面・HTTP記録](manual-evidence.md)。
- [全90AC/17BR/30NFR対応](traceability.json)。Deferredは未達/他Unit範囲を含み、実装の存在を全体受入成功へ読み替えない。
- [厳密source manifest](source-manifest.json)、[source fingerprints](source-fingerprints.json)、[着手時working-tree baseline](source-baseline.json)。
- [ローカル利用・検証手順](../../../../../../../../docs/company-comparison-local.md)。

## 実装境界と判断

モデルは既存7キー/schemaを再利用し、自由本文や理由から企業事実を補わない。0社は未選択、1〜20社、各企業1メモ。空は未記載、要確認は保持する。採用Webの全metadataとdummy/openai/manual出自は紙と別区分。Versionは非空の不透明値として等値比較し、U3でUUID限定しない。安全URLを正規化してMarkdown構文へraw改行を持ち込まない。

既存WorkspaceClient/C1/C3/C4・実PGを構成利用する。比較POSTは読取失敗として扱い、操作照会をしない。欄更新はCompany志望度/Memo理由だけのchanges、別版/別draft/別保存結果。同ID/bodyのunknown照会/本人再試行、明示rebaseまでbase/draft保持、latest別領域、committedとGET失敗の区別を実装した。

app instance内owner別storeをroute mountより上に置きSSR singletonを作らない。owner/login/selection/input/requestの世代を照合し、再表示だけで新しい保存意図を生成しない。選択外や削除済み対象の保持操作も同IDで照会できる。最後の自己点検では旧loginの成功だけでなく拒否応答もunknown保持する実回帰をRed→Greenで修正した。

毎出力C3を再読取し、全Company/Memo版・本人/選択/入力世代とdirty/pendingを照合する。変化はfile0で最新を表示し、再クリック時に表示と同snapshotから1file。旧比較は別入口・既存正常形式を維持し、破損混在では欠落させる書込を止める。移行/削除/サーバー送信は追加していない。

## 実変更の所有

sourceは29file、削除0。新6libs `src/lib/companyComparison/`、新6components `src/components/compare/ComparisonHome.tsx`、`ServerCompanyComparison.tsx`、`ComparisonTable.tsx`、`ComparisonFieldEditor.tsx`、`ComparisonSessionProvider.tsx`、`LegacyComparisonBoundary.tsx`、新9test＋fixture/harness2、docs/helper各1。共有変更は`app/layout.tsx`、`app/compare/page.tsx`、`src/components/workspace/WorkspaceShell.tsx`、`src/components/compare/CompanyComparePage.tsx`の4fileだけ。各実fileはmanifestに列挙した。

baseline261既存fileとのhash照合で変化は承認4共有fileとroot所有`docs/session-handoff.md`だけ、削除0。後者は自分のsource claimsに含めない。U1/U2の他source・成果物、既存comparison.ts、DB/Auth/migration、package/lock/CI/Vitest/coverage/Dockerは変更していない。他担当/以前からのdirtyを戻していない。branchは`release/bolt-002-company-data-management-local`、HEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`を継続した。

29source aggregate SHA256: `c567f1d4ff8637a9e10d97f133d679aa46eb97801cbe0752c048a3a3c777d5ae`。算出規則は各pathのbytes SHA256から`path:sha256`をsortしてLF結合、末尾LFなし。記録文書はaggregate対象外、source baselineはHEADのみでなく開始時dirtyのbytesを使う。Retry前のaggregate `8a3e4f2bf79bd56c7550a411b29eb224882f17a8e93dab899213f04ace3f6109`からの変更は試験の整形とU3 helperだけで、production sourceの振る舞いを変更していない。

## 検証と制限

RetryでU3 all9files/119件は成功、整形後のstate48件Refactor、typecheck/lintともexit0。lint後に追加変更したのはhelperだけで、その最新lintは未再実施。buildはexit0、git diff --checkはexit0（既存LF/CRLF警告のみ）。coverage付き全suiteは587件中586passed/1failed・exit1、凍結U1の40ms COMMIT期限試験でexpected operation_unknown/actual unavailableを再現。coverage集計は取得できず80%達成を主張しない。全体再試行やU1変更は行わず、[未適用の最小案](u1-deadline-diagnosis.md)を残した。

Retryのcleanup診断でowned-edge-stop/code128を確認。所有childの終了を有限待機し、実終了なしなら失敗を維持する最小helper修正と両境界の自己検査後、実Edge29check成功・process exit0、preview/Edge/profile/schema cleanup全true・errors=[]を確認した。native200/400の保存/出力/旧入口と本文/復習.mdも再確認。実TCP参考p95 616.30ms・失敗0、DB15,617,171bytes。

追加M補完では25checkまで成功し、M2メモ切替/別client構造・本文更新、M3独立保存/GET失敗/追加入力、M10 Tab/ShiftTabが実操作で増えた。その後、追加入力破棄→旧/新比較切替のready待機が失敗。最小診断では旧入口到達後に新server表示へ戻り、loading=false/readError=trueになった。原因は未確定でapp Red認定/修正なし。双方の実行は専用cleanup全true。未到達M条件、固定allowedUser Aのため実B sessionが成立しない条件、制御401と実認証の区別はmanual-evidence.mdへ残した。一時診断分岐を解除し通常helper構文exit0を確認後、追加実行を停止した。

残るU1/U2既知5件、audit high5/critical1、実Auth/Supabase/CI/公開は未修正/未確認。新依存・有料資源・Vercel作業なし。停止指示を受け新しいhelper/修正/重い検証を開始せず、実結果と残作業を固定した。正式な受入成功を示す文書ではない。

