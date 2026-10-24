# U2 非機能要件の判断根拠

## 引継いだ決定

新しい本人判断を必要とする未決事項は検出していない。性能・入力上限・認証／所有権・出自・試験方法は既存契約とリリース計画を具体化する。質問／回答を代作せず、新しい実装許可と扱わない。

U2の実回答Request Changesを受けた追加確認であり、機能設計Q1の本人回答「両方確認できる」を準備条件として引き継ぐ。画像選択の追加観察は接続エラーで完了せず、画像以降・保存後往復・実倍率200%の受入成功は未確認。保存意図の保持と検証条件を具体化するが、時間制限・上限・技術選定・既存NFRの数値目標は変更しない。

## 曖昧さと検証の扱い

生成の45秒等は有限待機の上限であり性能保証ではない。新APIのp95は承認済み代表fixture条件で測る。実Supabase、外部providerの費用／保持実設定、公開環境の成立は未確認でありローカルdummy実装を止めない。無料条件を超える課金・新SLA・常時監視基盤を追加しない。Vercelの全作業は本人担当。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

