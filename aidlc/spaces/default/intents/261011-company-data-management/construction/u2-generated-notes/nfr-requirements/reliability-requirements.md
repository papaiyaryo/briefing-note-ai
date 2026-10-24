# U2の信頼性要件

## Persistence and Failure Semantics

| ID | 要求 | 検証方法 |
|---|---|---|
| NFR2.3 | 保存はU1の同一トランザクションで所有権・所属・安定memoId・operationId・操作結果を確定。unknown時は操作結果を照会し、再送可能と確認した場合だけ同じ凍結要求・IDで本人再試行。OCR／既存復習への表示往復でも現在の保存意図・ID・結果を保持。別IDの自動再送なし | 実PGで二重送信・応答途絶・保存時親消失・別本人を確認。画面往復後も同じmemoId・メモ1件を確認。fakeだけで原子性合格にしない |
| NFR2.4 | 保存成功と再取得成功を区別。確定後GET失敗でも保存確定を消さない。拒否／不明／生成失敗では訂正入力と有効候補を保持 | 各失敗の状態・通知・再試行、成功後GET失敗、生成検証失敗の非永続化 |
| NFR3.1 | 保存後はU1の同じメモ編集／versionを使用。競合時にdraft／baselineを保持して最新を別に確認し明示再編集。無言上書き・自動mergeなし | 2クライアントの先行保存／旧版拒否と入力保持を現行実装で確認。過去のUI不備記載を現行の未修正・合格の証拠にしない |
| NFR3.2 | 再取得でPC／スマホに同じID・本文・構造・訂正OCR・イベント・出典・出自を返す。古い要求は別作業へ適用しない | 同一本人2クライアント、別owner、遅延／取消し応答。常時sync／offline保存なし |

## Availability and Recovery

| ID | 要求 | 検証方法 |
|---|---|---|
| NFR2.5 | 新しい稼働率SLA・自動failoverを追加しない。障害時は無期限待ち・架空成功・0件断定を避ける。未保存draftは端末一時メモリで、reload後復元を保証しない | 有限期限・手動再試行・認証再開、画面移動cancel。実外部稼働率は未計測 |
| NFR2.6 | 永続メモのbackup／restoreはU1運用境界へ渡す。通常tokenを持ち越さず復元後に本人再認証、失効sessionを復活させない条件を維持 | 共有復元契約と当該Unitの現行検証証拠で確認。バックアップ成功だけで再認証安全性を合格にしない。新U2backup領域なし |
| NFR6.1 | 既存復習入口と対応出力を維持。新DB復習読取／結果永続化・既知不具合の一括修正を追加しない | 既存生成→復習→対応.md、既知範囲外と今回退行の区別 |

Vercel設定・公開確認・実Supabase準備は本人へ引継ぐ。ローカルdummyと実使い捨てDBの結果を外部復旧・本番成功の証明にしない。

同じ候補の保存後編集は同じメモへ渡す。明示的新生成が検証成功したときだけ次候補へ移行し、生成失敗や表示往復では元の確定結果を残す。本人・企業の変更、401、終了で旧作業を無効化する境界は維持する。これらは既存NFR2.3／2.4／3.1／3.2の検証観点であり、新しい永続領域やSLAではない。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

