# U3 — 機能設計の確認根拠

## Scope and Questions

None.

新たな人間回答を必要とする業務条件はない。ここに回答値や承認receiptを作らない。回答方法は既存のファイル方式、summary confirmationはoffという現行設定を維持する。

## Existing Decisions Used

- 1企業1構造化メモ、7観点、企業共通志望度とメモ理由、旧/新の区別はUnit・Domain・C3で確定済み。
- 1要求1〜20社、理由5000 code points、C4の有限期限・版・操作照会は承認済み計画/契約から継承。
- 比較出力前に同選択を再取得して企業版/メモ版を照合し、変更時は再確認を求めることはC3の既定。
- 未保存/不明/競合の保持、PC/スマホ/拡大・キーボードは承認済み画面・受入条件で解決済み。
- 実Supabase/本人Auth/鍵は後日、Vercelの実作業は本人担当という既存の継続条件を保持する。実環境の成功とみなさない。
- Code Generation Plan Approval前にU3アプリを実装しない。

## Corner Sweep

| 適用面 | 設計への反映 |
|---|---|
| 所有者・失効・遅延応答 | BR1.1/1.2、WF1/2/6、本人/世代を越えた表示・書込なし |
| 空/1/多数・同名・重複・所属 | BR2.1/2.2/2.3、0/1/20/21とページ、IDで同一性 |
| 欠損/本文のみ/不正/出典不足 | BR3.1/3.2/3.3、推測で補わず無効を成功にしない |
| 独立正本・部分成功・通信不明 | BR4.1/4.2、各欄だけ更新、凍結/同ID/照会 |
| 競合・再表示・未保存移動 | BR4.3/4.4、保持入力と最新を分離、意図の寿命を保持 |
| 削除・選択変更・版変化 | BR5.1/5.2、旧結果無効、再取得前の出力禁止 |
| 記号/長文/HTML/URL/出力一致 | BR5.3/7.1、安全表示と同じ参照 |
| 旧保存・利用不能・不正レコード | BR6.1、明示入口と既存形式、移行/削除なし |
| 時刻・順序 | 日付を日時へ変換しない、出典取得日時を保持、版は等値比較 |
| 未使用の面 | 入力ファイル取込、バックグラウンドjob、新外部API、課金、同期は追加せず対象外 |

## Remaining Validation

この段階のOKは設計対応のみ。U1/U2の既知不備、native200%未確認、実環境/CI/公開は解消しない。NFRとコード計画で具体的な試験・実画面・Definition of Doneを整え、必要な本人ゲートを別に守る。

## Sources

- [Unit定義](../../../inception/units-generation/unit-of-work.md)、[担当対応](../../../inception/units-generation/unit-of-work-story-map.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [ストーリーと90AC](../../../inception/user-stories/stories.md)、[部品と所有者](../../../inception/domain-design/components.md)。
- [共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[操作仕様](../../../inception/refined-mockups/interaction-spec.md)、[入力上限・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現時点の引継ぎ](../../../../../../../../docs/session-handoff.md)。実装済みの部品があることを全受入・実環境成功の証明にしない。

