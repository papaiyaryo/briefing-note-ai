# U2の規模と費用の要件

## Capacity and Concurrency

| ID | 要求 | 確認方法 |
|---|---|---|
| NFR7.3 | 代表量100企業／1000メモ／10000小操作記録、1社50メモ、長文・Web付きのBolt fixtureを引継ぐ。概算DB予算200MiB以内。登録件数制限ではない | 実使い捨てPGの容量測定と保存後再取得。全レコード最大長の場合まで無料と保証しない |
| NFR7.4 | 2クライアント並行、同一意図二重送信・別端末更新を整合させる。新DB／queue／cache／画像storage／常時配信を追加しない | U1保存契約への並行送信、同一操作確定・結果照会、生成作業世代の隔離 |
| NFR7.5 | 無料枠を第一条件に維持し、超過・休止・接続不能は明示失敗で扱う。自動課金・有料autoscale・scope縮小をしない | 条件不成立時は内容保持と再確認。実Supabase設定・提供枠の成立を推定しない |

## Scaling Triggers and Boundaries

p95目標超過、容量予算超過、接続不足は計測記録と修正案を作る契機とする。無料枠や入力制約を黙って緩めず、必要な変更は本人へ確認する。15社警告はU1の利用目安であり、生成保存の登録上限にしない。既存provider／modelを独断変更せず、実OCR費用は保存／Auth無料条件と分ける。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

