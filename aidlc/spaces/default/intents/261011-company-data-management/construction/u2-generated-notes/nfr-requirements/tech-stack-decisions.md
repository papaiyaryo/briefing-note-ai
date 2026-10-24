# U2の技術選定と品質条件

## Inherited Decisions

| ID | 選定・条件 | 理由と範囲 |
|---|---|---|
| NFR6.2 | 既存Next.js／React／TypeScript／TailwindとNext.js API Routes、Node22を継続。新Express・ORM・サービス・browser test製品なし | 同じアプリ内のC1／C2／C4／C5を接続し、保存の所有者はU1のまま |
| NFR6.3 | Vitestの既存Node／純粋関数／fake API／静的SSRと実使い捨てPostgreSQL17、dummy Auth／providersを使用 | 受入に対応したRed→Green→Refactorを各対象で実行。環境不備をRedに数えない。SSRをDOM／focusの実証にしない |
| NFR6.4 | lint／typecheck／test／buildを通し、全app／srcのline coverage>=80%を維持。CI実行成功は実際のjobで別確認 | 未計測sourceや失敗を隠す除外・閾値緩和なし。新ブラウザ依存を勝手に追加しない |
| NFR5.2 | PC1366×768、スマホ390×844、幅320／767／768、200%／400%拡大、PCキーボード、通知／label／focusを承認済み条件で確認 | 架空画像／dummyのみ。画像とOCR訂正・生成確認・保存・既存復習・対応出力へ到達できる |
| NFR7.7 | U1で選定済みSupabase Auth／PostgreSQLのサーバー境界を使用し、実設定は後回し。新しい依存・有料plan・実provider呼出しなし | local dummy＋PGで先行。Vercelの設定／deploy／公開確認は本人担当 |

NFR5.2の表示確認は、画像選択→OCR訂正→生成→保存→OCR往復→候補へ戻る→既存復習往復→保存メモ再取得を実画面で行い、同じmemoIdと件数1を確認する。ブラウザ実倍率200%での主要操作を、標準表示の成功やCSS拡大・viewport変更で代用しない。400%等の既存条件も維持する。本人の環境準備回答と受入成功は別記録とし、filechooser失敗・接続切断は未確認として残す。画面確認の前提不成立を製品のTDD Redには数えない。

## Compatibility and Verification Basis

技術棚卸しは調査時点の入力であり、coverage未設定／DB依存なし等の記載はU1実装前の履歴。現在のU1で固定した依存とcoverage設定を継続し、再選定しない。外部API SDKを新規追加せず既存server fetchを継続する。

/api/structureはリリース計画の明示例外を維持: 不正要求invalid_input400、openaiキー未設定not_configured500、StructureErrorは当該code422、provider429はrate_limited429、その他provider／現在abort経路provider_error502。共通認証／Originは401／403。生成と新保存のエラーを一つへ統一しない。

採用Webは共有型のsourceUrlを正本とし、論理URLとの対応を後続設計／実装計画で明示する。実際の型宣言のid・confidenceも失わない。新規キー登録UIは作らず、server用環境設定の空欄と手順を引継ぐ。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

