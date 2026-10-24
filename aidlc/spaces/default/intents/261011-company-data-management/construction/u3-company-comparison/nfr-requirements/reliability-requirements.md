# U3 — 企業比較の整合性・復旧要件

## Consistency and Mutation Outcomes

| ID | 必須条件 | 検証例 |
|---|---|---|
| NFR2.2 | C3の1つの一貫読取で選択全体のCompany/Memoを取得。順序・全件・所属・構造・版が有効な時だけready。部分参照を完全比較にしない | 複数クライアント変更を挟んだ実PG/API読取、欠落/不正応答、0件/失敗/古い結果の区別 |
| NFR2.3 | 企業志望度とメモ理由は独立した明示保存・版・結果。対象欄以外を変更しない。片成功/片失敗を両成功にしない | 企業志望度保存後も他メモ理由/本文/構造/企業自由メモ不変。理由保存も逆側不変。成功後GET失敗は保存成功と読取失敗を分ける |
| NFR2.4 | 更新前にoperationId/対象/expectedVersion/changesを凍結。連打抑制、通信途絶はunknown、結果照会committed/unknownを区別。unknown手動再試行は同一ID/同一要求、POST/PATCH自動再送0 | COMMIT後応答途絶→照会→再取得、再試行の完全要求一致、同ID別要求拒否。比較参照POST失敗では操作照会0 |
| NFR2.5 | draft/pending/unknown/committedの寿命を一時部品remountから分離。本人/対象に結び、往復/再表示だけで新操作IDや新書込を作らない。送信後に追加した入力は成功通知で消さない | 保存→別表示/選択→復帰、unknown→復帰、確定後GET失敗→復帰で書込回数不変。再保存は新しい明示編集意図だけ。reloadを越える保証は含めない |
| NFR2.6 | 出力クリックごとに同じ参照を再取得し全company.version/memo.versionを表示版と比較。現本人/選択/入力世代一致、未保存/未確定なしの場合だけ同じsnapshotから1ファイル | 版変更/削除/401/不正/取得失敗/確認中の入力変更はファイル0。変更時は最新を表示して再クリック。snapshotVersionだけの差/未選択企業変更は誤拒否しない |
| NFR2.7 | 読込中/保存0/選択0/構造なし/取得失敗/削除/競合/unknown/保存確定後GET失敗を文字で区別。旧比較の利用不可/破損/有効0も区別し、自動修復/削除/移行0 | 故障注入で元の有効値と入力を保持。再取得や照会の入口があり、失敗を成功/空欄に偽装しない |

## Multiple Clients, Versions and Revocation

| ID | 必須条件 | 検証例 |
|---|---|---|
| NFR3.1 | 古いexpectedVersionの変更を409で検出。旧基準/draftを保持し最新値を別領域で読む。本人が最新を基準にすると明示するまで基準版を置換せず、自動mergeしない | PC相当A/スマホ相当Bで同欄変更→A競合→入力を捨てず最新閲覧→明示rebase→新ID保存。最新取得失敗もdraft保持 |
| NFR3.2 | 明示再取得と出力前確認で他クライアントの保存変更を検出。本人/選択世代の違う遅延応答を破棄し、401後の保護表示/出力なし | 遅い旧選択成功、旧本人401、再ログイン後最新取得。常時配信/オフライン同期の保証は追加しない |
| NFR3.3 | 構造更新・選択変更・既知の削除・当画面保存成功で古い比較/出力を無効化。メモ/企業消失は再選択し、残存参照だけへ黙って縮めない | 比較後に別クライアント構造編集/メモ削除/企業削除→再取得/出力で停止。本文だけの変更もmemo版変更として契約どおり扱う |

## Fidelity and Data Durability

| ID | 必須条件 | 検証例 |
|---|---|---|
| NFR4.1 | 7観点のキー/ラベル/順を固定し、空配列は未記載、要確認はそのまま保持。自由本文/会社自由メモを自動構造化せず、未記載を弱点/点数にしない | 全7観点・空・要確認・本文のみメモ・同名企業の表示/出力を照合 |
| NFR4.2 | 紙の区分・印象・HR強調・質問・ES材料と採用Webを分ける。Webのid/category/content/sourceUrl/fetchedAt/confidence/adoptedを保持し、URL/取得日を表示・出力 | distinctな架空値を全項目に置き比較/Markdownで照合。未採用Webや本文から補完しない |
| NFR4.3 | origin/manual/generatedとproviderOrigin/dummy/openai/nullは保存値から表示。dummyは検証用と識別し、生成名で保存企業を改名しない | manual/dummy/openai fixture、保存企業名とoverview不一致。署名/出自を事実性や実provider実行成功の証明にしない |
| NFR4.4 | U3は元画像を取得/保持/保存する契約を作らない。既存本文/OCR/構造正本を改変せず、比較結果は派生値だけ。旧localStorage正本は別入口で有効な旧選択/編集/出力を維持 | HTTP/DTO/保存差分に画像欄なし。旧browser形式のfallback ID/日付を新書込制約で不正化しない。新比較から旧領域への書込0 |

## Availability, Backup and Recovery Boundary

新しい稼働率/RPO/RTOを未承認の数値で定めない。U3は新しい永続表を持たず、保存データのbackup/restoreとセッション失効はU1の責任。U1の復元で失効sessionが戻る既知問題は未修正で、ローカル復元成功を安全な復旧達成に読み替えない。

端末メモリが失われた未保存値の復旧を保証しない。通常の往復・欄切替による破棄はそれと別で、NFR2.5で防ぐ。サーバーへの送信済み変更を画面キャンセルだけで巻き戻したとは表示しない。実Auth/実DB/実CI/公開は未確認として維持する。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
