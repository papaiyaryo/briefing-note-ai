# U3 — 企業比較の観測・検証要件

## Diagnostics and Evidence

| ID | 条件 | 確認方法 |
|---|---|---|
| NFR6.1 | 診断に必要なrequestId/code/routeの固定名/経過時間/失敗数を使い、本文/理由/OCR/画像/認証値/完全要求を記録しない。保護IDを不要にログ複写しない | 架空の固有文字列とdummy秘密を使ったログ捕捉。browser console/HTTP errorと開発記録も確認。新外部analytics/trace製品を追加しない |
| NFR6.2 | 各変更レイヤーでrunner成立を確認し、受入に対応する実失敗Red→最小Green→Refactorを記録。setup失敗・既存不備・人工破壊を新Redとしない | コード計画でAC/BR/NFRと試験group・実行順を確定し本人承認。commands/exit/件数/失敗理由を公式U3記録へ残す。初回Greenの既存結合は新Redと称さず先行境界との対応を記す |
| NFR6.3 | lint/typecheck/npm test/buildを通し、全app/srcを隠さずlines80%以上。既存dummy/実PG試験を維持し、閾値/assertionを弱めない。新browser自動試験依存なし | 既存coverage設定/CI接続を保持し、変更後の最終結果を記録。source manifest/fingerprint/自己review/正式reviewを用意。CI未実行をlocal passで代用しない |
| NFR6.4 | 自動試験・実PG/API・実DOM/実ブラウザ・native zoom・性能・実環境の証拠を区別。未実施/失敗/既知不備/環境とcleanupを記す | PC/スマホ条件と出力.mdを実アプリで確認。callback/SSRのみで画面受入としない。対象SHA/OS/browser/fixture/結果を残し、本人担当のVercel/公開と実Authの未確認を分離 |

## SLIs, SLOs and Failure Signals

既承認のAPI p95/失敗数/最大、有限期限、DB容量を観測対象とする。p95測定条件は[性能](performance-requirements.md)、容量は[規模](scalability-requirements.md)が正本。新しい可用性率やalert thresholdを作らない。成功HTTP/health/buildだけでは比較の受入完了としない。

ユーザーには未保存/送信中/確定/結果不明/競合/削除/取得失敗を文字と対応操作で示す。通知は読み上げ可能な状態領域を使い、入力中のfocusを奪わない。結果不明は同ID確認、読取失敗は再取得、競合は保持入力と最新確認を案内する。内容を含むdebug画面や無限pollingを追加しない。

## Verification Separation and Carried Findings

U3の設計対応は30詳細NFRで上流7NFRを覆うという意味であり、まだ実装/試験の成功ではない。U1/U2既知不備とnative200%未確認は別の未達として維持する。実Supabase・Auth・実CI・公開は未確認。本人担当の配置作業を先に依頼せず、ローカルdummy/PGで進める。最終コマンドと具体操作の確定はCode Generation Plan Approvalで行う。

純粋な設計文書には人工Redを作らず、JSON/ID/参照/リンク/空白/文字/公式traceabilityを検査する。文書内に実装TS/JS sampleは含めないため、アプリlint/typecheckを文書検査のためだけに反復しない。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
