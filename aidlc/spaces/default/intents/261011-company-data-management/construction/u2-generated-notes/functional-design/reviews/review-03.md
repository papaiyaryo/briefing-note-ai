## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-25T01:59:24Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/functional-design/entities.md > Entity Model / AdoptedWebSource.attributes.url | データ形の正本では出典URLを必須属性 `url` としている一方、共有C2の AdoptedWebSource は既存 WebSupplementItem を継承し、その属性は `sourceUrl` である。両者の対応が明記されておらず、WF3で候補をそのまま渡す実装では採用出典の検証・保存に失敗し得る。既存型宣言の形は、共有契約の参照先 src/lib/types.ts:25–33 をrootが読み取り確認した結果と照合した。 | 正本の属性名を C2 の `sourceUrl` に合わせるか、論理属性 `url` から `sourceUrl` への変換を明記する。既存型の id・confidence を含む採用項目を維持することも、その対応の中で明確にする。 | Accepted risk |
| R-02 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/functional-design/functional-spec.md > WF3 and State Machines (保存 unknown) | 保存が unknown の間に本人が候補を編集した場合の扱いが未定義。WF3.3 は「要求を変更したら新しい保存意図（新しい operationId／memoId）」と書き、WF3.4 は unknown 中は「同じ要求・ID で再試行」と書く。最初の保存が実はコミット済みだった場合、編集後に新 memoId で保存すると同じ候補から重複メモができる。WF5.5 の「同候補の保存に対応するメモは1件」とも矛盾しうる。 | unknown／verifying 中の候補・訂正入力の編集を、(a) 禁止する、(b) 照会で結果確定するまで保存を止める、のどちらかで定める。状態遷移表に unknown かつ編集ありの行を加える。 | New |
| R-03 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/functional-design/functional-spec.md > WF2-WF3 のエラー処理 と rules.md > BR5.2 | 契約のエラー体系への写像がどの成果物にもない。functional-spec.md、rules.md、entities.md、frontend-components.md のいずれにも origin_forbidden(403)、rate_limited(429)、payload_too_large(413)、operation_reused(409)、unavailable(503)、confirmation_*、生成側の ApiErrorBody 504/422/502 は出てこない。契約では 503 は結果不明、operation_reused は別 ID で自動再送しない、生成 POST は自動再送なしで 45秒の上限案があるが、spec は「拒否」「応答途絶」「期限切れ」としか書かない。BR5.2 の「structure例外は承認済みリリース計画の写像を優先」は、この Unit が読む範囲の外を指す。 | HTTP／コード別の画面状態への写像表を加える。保存系は rejected／unknown／再取得の区別、生成系は ApiErrorBody と ContractError の両形式の判別、生成のタイムアウト、書込の自動再送なしを含める。BR5.2 の参照先は具体的な項目として spec 内に転記する。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/functional-design/rules.md > BR3.1 | 「新保存全体1MiB、本文/OCR各50000、構造256KiB、配列100」を「既存計画を適用」としているが、contract-summary.md はこれらの上限を Delivery Planning で確定する未決事項とし、確定するまで実装を許可しないとしている。entities.md の max 値（画像20枚、Web出典50件など）の根拠もこの Unit の範囲では確認できない。 | 値の根拠（承認済みの計画項目）を明記する。確定していなければ暫定値として扱い、実装前の承認対象にする。 | New |
| R-05 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/functional-design/traceability.json > AC1.1.4 / AC1.2.3 / AC6.3.x | 対応先が粗い。AC1.1.4（認証失敗を保存0件と混同しない）と AC1.2.3（取得失敗を空と確定しない）は BR1.1／BR1.2／BR4.1 に対応づけられているが、spec 本文に認証失敗や取得失敗を空状態と区別する記述が明示されていない（WF3.5 の再取得失敗のみ）。AC6.3.x は BR4.2 だけで、競合後の再保存の成功確定（AC6.3.3）は spec に明示がない。 | 認証失敗・取得失敗と 0 件の区別、競合後の再保存を WF に一文ずつ加える。または共同条件として U1 側に委ね、その旨を note に書く。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability 網羅 | PASS: upstream_ids は AC1.1〜AC9.2 の 90 件で、coverage は同数。U2 主担当の AC5.1.1-5、AC5.2.1-5、AC9.2.1-4 はすべて OK | story-map の U2 主担当・共同確認に対応する。Deferred は U1／U3 担当 |
| BR ID 解決 | PASS: OK の target が使う BR1.1〜BR5.2 の 14 件は rules.md にすべて存在 | 参照切れなし |
| 上流整合 | 手動照合: C2 の GeneratedCandidate／generationReceipt、C4 の createMemo と operations 照会、unit-of-work の U2 境界（U1 契約経由・独自ストアなし）と一致 | 2026-10-23 の成果物は現行の上流契約と矛盾しない |

### Summary

境界、依存方向（U2 から U1 のみ）、保存意図の冪等性、追跡表は現行の上流契約と整合し、設計の骨格は成立している。ただし unknown 中の編集による重複メモの経路と、契約のエラー体系への写像の欠落は実装者が推測で埋める部分になるため、承認前に検討するのが望ましい。
