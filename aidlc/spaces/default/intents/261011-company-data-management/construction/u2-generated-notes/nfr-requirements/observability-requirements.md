# U2の観測と診断の要件

## Signals and Data Minimization

| ID | 要求 | 確認方法 |
|---|---|---|
| NFR1.5 | 診断は不透明requestId、処理種別、結果code、経過時間等の最小限に限定。画像／OCR／本文／完全要求／出自証明／token／キー／個人情報を不要に記録しない | fake logger・エラー応答を検査。内部例外内容・SQL・provider全文を利用者へ出さない |
| NFR2.7 | 読込／生成／保存／拒否／不明／結果確認／保存確定後再取得失敗を別状態として観測。requestIdで本人が問い合わせ可能 | UI状態と安全なエラーcode、未確定を成功／未実行確定にしない |
| NFR7.6 | 代表負荷のp95・最大・失敗数、対象版／ブラウザ／fixture bytes／測定境界を記録。生成待機上限と保存API性能を分ける | warmup5＋各50回×2クライアントの記録。ローカルadapter値と実HTTP／実外部の区別 |

## Monitoring and Escalation

新しい常駐監視・分散trace基盤・alert配送・外部dashboardは追加しない。同一アプリ内の安全な診断と手動検証記録を使う。期限超過・エラー・容量／p95未達は入力を保ち、既存の確認手順へ繋げる。稼働率の新SLOや未承認のalert閾値を作らない。health成功だけで生成・保存の受入成功にしない。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

