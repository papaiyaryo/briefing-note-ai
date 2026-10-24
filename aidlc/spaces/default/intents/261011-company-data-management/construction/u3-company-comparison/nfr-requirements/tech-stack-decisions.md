# U3 — 既存技術の利用と画面品質

## Technology Decisions

| 項目 | 採用する既存境界 | 判断理由 |
|---|---|---|
| UI | 既存Next.js/React/TypeScript/Tailwind | 新比較と明示legacy入口を既存アプリへ収める。既存の画面操作/データ契約を具体化し、版更新を追加採用しない |
| 保存/本人 | U1のC1/C3/C4、サーバー側Supabase Auth/PostgreSQL adapter、ローカルdummy Auth/使い捨てPG17 | U3からDB/認証鍵へ接続せず、独立した比較DB/APIを作らない |
| 検証/出力 | 既存schemaと安全表示、選択snapshotから比較Markdown導出 | 既存7観点/区分/URL/出自を保ち、LLM再生成/新しいWeb取得を行わない |
| 一時状態 | 本人/対象別メモリ、世代・欄別draft・frozen intent | component remountと状態寿命を分ける。新比較の永続localStorageは作らず、reload越えの復旧は約束しない |
| 旧比較 | 従来のSavedCompanyMemo/端末保存と有効な旧操作 | 明示旧入口、非移行、非関連付け。新Company/Memoへ変換しない |
| 検証手段 | 既存Vitest、API fake、実PG、既存手動画面確認 | 新しいE2E製品/依存は追加しない。既存全体coverage80%とCI条件を保つ |

CodeKBはInception調査時点の記録で、現在のrunner/設定はU1/U2で変化している。旧記録の「coverageなし」「DB/Auth依存なし」「passWithNoTestsあり」を今の設定へ戻さない。実装時の対象ソースと承認計画を使い、最新提供版/安全性の新たな主張はしない。

## PC, Mobile and Accessibility Requirements

| ID | 条件 | 実画面確認 |
|---|---|---|
| NFR5.2 | 日本語の候補選択/比較/独立保存/競合・unknown復旧/出力/旧比較入口をPC1366×768、スマホ390×844、幅320/767/768、native200%/400%で利用可能にする。同じ観点順・参照順・区分を保ち、色だけやドラッグだけに依存しない | 実アプリで各主要操作へ到達。PC tableはcaptionと行列見出し・到達可能な横scroll領域、mobileは観点ごと縦表示。長文/記号でボタンや結果が隠れない。viewport emulationとnative browser zoomを別記 |
| NFR5.3 | label/見出し/状態通知・Tab/ShiftTab・未保存取消しfocus復帰を用意。画面入口はh1へ、入力/再取得/保存通知だけでfocusを奪わない | keyboardで全操作、取消し後に元の入力と起動元を保持。状態は読み上げ可能な領域、フォーカスの移動と結果表示を実DOM/実browserで確認 |

既存U2 native200%の入口到達は未確認のまま。U3の画面確認を代替証拠として流用せず、本人担当の本番/Vercel作業とは分ける。具体的手順・コマンド・所有sourceはコード計画で本人承認後に確定した順で実装する。

## Scope and Dependency Stability

U3→U1だけの依存を維持。U2が保存したメモも同じU1正本から読むため、U2内部へ依存しない。別サービス/Express/ORM/browser Auth SDK/外部analytics/新DB migrationを追加しない。実装承認前にはアプリsourceを変更しない。既存の重大な不具合を直したものと扱わない。

## Assumptions & Open Questions

None.

既承認のC1/C3/C4・Bolt上限/性能/画面条件・U3機能設計から具体化しており、新しい費用・機能・数値SLA・本人回答は作っていない。実装の詳細と検証コマンドは後続コード計画で審査し、必要な本当の判断点はそこで確認する。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
