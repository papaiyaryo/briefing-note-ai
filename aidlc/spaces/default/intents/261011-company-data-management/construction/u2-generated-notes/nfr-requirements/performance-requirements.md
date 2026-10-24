# U2の性能要件

## Latency and Retry Budgets

| ID | 測定可能な条件 | 確認方法 |
|---|---|---|
| NFR2.1 | 生成系はprovider30秒／サーバー40秒／ブラウザ45秒で有限終了。POSTの自動再送なし。取消し後の応答を新作業へ適用しない | dummy／fake clockで各期限直前・期限・遅延応答と中止を確認。実provider速度の保証にしない |
| NFR2.2 | U1保存／読取はブラウザ15秒・サーバー10秒・DB全体8秒。GETのみネットワーク／503に500ms後1回。保存POSTは自動再送なし | U1契約へ接続する境界試験。timeoutは保存結果不明として操作照会し、無限pollingなし |
| NFR7.1 | 保存／読取／一覧APIはp95 2秒以内、50メモ企業削除p95 3秒以内というBolt目標を維持。生成処理を2秒目標へ混ぜない | 100企業／1000メモ／10000操作、warmup5回、2クライアント、各50回、p95・最大・失敗数・対象版・環境を記録 |

## Input and Resource Bounds

| ID | 条件 | 確認方法 |
|---|---|---|
| NFR7.2 | 既存20画像／1枚10MiBを維持。受入画像は架空1枚64KiB以下。新保存JSON1MiB、本文／訂正OCR各50000 code points、構造256KiB、配列100、文字5000、Web50件と既存個別上限を両方検証。無断切詰めなし | 境界値・超過拒否・入力保持。大画像の既知hosting制約を今回解消したとは扱わない |
| NFR4.1 | 画像は一時メモリ参照のみ。差替え・除去・保存確定・終了で不要参照を解放。保存DTOと永続領域へ画像を含めない | file／object参照のrelease、DTO検査、実PG保存後の画像なし再取得。任意のメモリbytesの新SLAは追加しない |

API目標の実Supabase／実ネットワーク達成は未確認。ローカルDB adapter参考値をHTTP目標達成に代用しない。実公開測定・Vercel設定は本人へ引継ぐ。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

