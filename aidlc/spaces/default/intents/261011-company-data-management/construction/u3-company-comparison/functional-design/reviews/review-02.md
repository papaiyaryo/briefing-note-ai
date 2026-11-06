## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-26T09:10:49Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/functional-design/functional-spec.md > WF1 step 2 | 「終了状態も候補から勝手に除外しない」とあるが、候補の取得元となる共有ルートが書かれていない。共有契約では GET /api/v1/board の showEnded 初期値は false で、終了2状態を隠す。何も指定せずに実装すると終了企業が候補から漏れる。 | 候補の取得元を明記する。例: showEnded=true で board を読む。あわせて、この読取が通常ボードの表示条件・社数に影響しないことを書く。 | New |
| R-02 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/functional-design/functional-spec.md > WF1 step 4 / frontend-components.md > ComparisonPicker | 共有契約の MemoSummary は memoId、origin、providerOrigin、version、日時、hasStructuredContent だけで、イベント名や本文の見出しを含まない。各社の複数メモから1つ選ぶ際に「識別情報」として使えるのは出自と日時に限られる。設計はこの前提を明示せず、WF3 のイベント表示は選択後の全体取得でしか得られない。 | 選択前に見せる識別情報を MemoSummary の項目に限ると明記する。または、イベント名などが必要なら共有契約側への追加依頼として記録する。 | New |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/functional-design/functional-spec.md > Scope Exclusions and Carried Limitations | 「U1/U2の競合draft破棄・復元session・削除期限の不備は未解消」という記述は 2026-10-17 時点の状況である。その後 U1/U2 のコード生成記録が更新されており、現状と一致するか確認できていない。U3 は欄別競合とメモ・企業削除参照を U1 の C3/C4 実装に依存している。 | 現行の U1/U2 の状態と照合してこの節を更新するか、日付付きの過去時点の記述だと書く。U3 の設計判断はこの記述に依存しないことも確認する。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/functional-design/functional-spec.md > WF2 step 4 / State Machines and Invariants | 比較参照は最大20社分の構造化メモと採用Webを1回の POST で受け取る。共有契約の上限案はブラウザ15秒/サーバー10秒/DB8秒で、応答の大きさの上限は未決のまま。設計はこれを NFR/コード計画へ委ねているが、20社時の失敗扱いや、ゆるい上限を超えた場合の画面表示が定義されていない。 | NFR 設計で、同時選択数と応答サイズの上限、20社時のタイムアウト時の扱いを決める。設計側には「タイムアウト時は結果なしとして再取得へ」を既存ルールに沿って一文足す。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability.json の機械照合 | PASS: upstream_ids 90件、coverage 90件、欠落0・余剰0。OK 35件と Deferred 55件。OK の target はすべて rules.md に存在する BR ID。rules.md の全17ルールが少なくとも1件の AC から参照されている。 | U3 主担当の AC8.1.1〜AC8.1.5 はすべて OK。AC9.1 の比較部分に当たる AC9.1.2、AC9.1.4、AC9.1.5 も OK。他 Unit 主担当分は Deferred で、担当対応表と整合する。reverse は空だが任意項目で、孤立ルールはない。 |
| 共有契約との参照照合 | PASS: C3 の readComparison、updateCompany、updateMemo と、C4 の comparison-sources、companies PATCH、memos PATCH、operations GET が契約に存在する。7観点、1〜20社、5000 code points、版の等値比較、GET 再試行1回、POST/PATCH 自動再送なしは契約と一致する。 | 設計が前提とする契約と形が合っている。矛盾は見つからなかった。 |

### Summary

2026-10-17 の成果物は現行の共有 C1/C3/C4 とユニット定義に対して矛盾なく成立し、トレーサビリティも機械的に完全で、致命的・重大な指摘はない。残るのは候補取得ルートの明記、メモ識別情報の前提、過去時点の記述の見直し、20社時の応答上限の4点で、いずれも軽微。
