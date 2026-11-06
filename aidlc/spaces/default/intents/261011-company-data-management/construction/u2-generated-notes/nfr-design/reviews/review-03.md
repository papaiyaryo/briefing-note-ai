## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-25
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-design/reliability-design.md > RD1 — Frozen Intent and Confirmed Outcome、第3段落 | 再試行条件を「照会結果が再送可能と示す場合だけ」としているが、共有契約のOperationLookupにはcommittedとunknownしかなく、再送許可の値はない。機能設計WF3第4項と共有契約C4のAtomic Writes, Versions and Operation Replayは、照会がunknownなら本人が同じ凍結要求・IDを再送できるとしているため、照会成功のunknownと照会自体の失敗を区別して読める記述が必要。 | 操作照会が正常応答でunknownを返した場合は未実行と断定せず同じ要求・operationId・memoIdによる明示再試行を許すこと、照会失敗時は結果不明を保持して再照会することを明記する。新しい応答項目や別IDは導入しない。 | New |
| R-02 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-design/traceability.json > coverage[].target (全31行) | 全31行のOK targetの見出し部分が実在する見出しと一致しない。例: `security-design.md#SD1 — U1本人／Origin検査と世代別応答無効化` に対し、実際の見出しは `## SD1 — Identity Gate and Response Isolation`。SD2、PD1、PD2、RD1、RD2、OD1、SC1、LC1 も同様に日本語の副題が実見出し(英語)と異なる。IDだけは実在するが、見出し一致で解決する検証では全行が解決しない。 | targetの見出し部分を実在する見出しに合わせる(または見出し側を揃える)。IDだけで参照する場合は `#SD1` のように見出しに依存しない形にする。 | New |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-design/security-design.md > SD2 出自証明 | 出自証明は本人・generationId・providerOriginだけを結合する(契約C2と一致)。一方、設計は証明の有効期限、generationIdの単回使用、同一証明での複数メモ保存可否を決めていない。署名鍵の保持・ローテーションも契約で後続送りのままで、NFR1.2の鍵管理が設計上どこにも落ちていない。 | 証明の有効期限と再利用可否(同一証明で何件保存できるか)を設計で決めるか、U1側の検証仕様の責務と明記する。鍵の保持・ローテーションの担当ステージ(インフラ設計)を明記する。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-design/security-design.md > SD1 | NFR1.1の全保護要求(OCR・構造化・Web・復習・保存)に対する認証・Origin検査は設計されている。しかし、認証済みであっても高コストなprovider呼出し(OCR・Web複数候補)の濫用上限(本人単位のレート・同時数)は、SD1にもscalability-design側の費用停止条件との接続にも明記がない。 | 本人単位の同時生成数または頻度の上限を、SD1かSC1に1行で決めるか、意図的に設けないと明記する。 | New |

> R-01 Not re-checked this round

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability.json 機械検査(上流ID網羅) | 上流NFRx.y 31件すべてがcoverageにあり、statusは全件OK | 網羅は取れている。上流security-requirementsのNFR1.1〜1.4、4.2〜4.4、5.1はすべて security-design の SD1/SD2 に割り当て済み。 |
| traceability.json 機械検査(target実在) | 参照先ファイルは全件実在。`#`以降の見出し文字列は全件が実見出しと不一致 | 上記Major。内容上の対応先(SD1/SD2等のID)は正しい。 |

### Summary

セキュリティ設計の内容は、上流のC1/C2/C5契約および `security-requirements.md` と整合し、2026-10-23時点の成果物は現行上流に対しても保たれている。実装可能性を損なう欠陥はない。主な指摘は、traceability.jsonのtarget見出しが実見出しと一致しない点と、出自証明の有効期限・再利用、署名鍵の管理、濫用上限という判断の未記載である。
