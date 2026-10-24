# U3 手動受入の現在範囲

2026-10-25追記: [追加CUA停止とcleanup](resume-evidence-2026-10-25.md)。ログイン画面後の接続失敗2回により新しいM-R成功0。既存の残条件を維持。schema削除true、helper停止確認false、既知PID消失を別記した。

## revision02 — 現在の範囲と残条件
正本は[manual-revision-02-root.md](manual-revision-02-root.md)、品質は[verification-revision-02.md](verification-revision-02.md)。下記の旧M1〜M12/NFR表はrevision01当時の履歴であり、今回の変更後に再実測した結果ではない。旧Step16は旧計画の番号で、現在11stepのStep9は限定M-R未完のため未チェック。

| 現行M-R | 今回CUAで確認 | 残条件 |
|---|---|---|
| M-R1 | 409/base/draft/latest別領域、成功文なし | 明示rebase後再保存、故障GETのlive DOM |
| M-R2 | メモ削除→C3 404→dirty保持/入力・save・rebase・出力停止。企業だけGET200でcompany欄のみ再開 | 新PATCH0は制御/実PG回帰、企業欄の新保存確定はGUI未実施 |
| M-R3 | 所属メモ含む企業削除→C3 404/企業GET404→両欄と出力停止/dirty保持 | 別企業の確認→保存はGUI未実施 |
| M-R4 | 通常比較理由保存・確定ID/版表示 | 他欄dirty同時、route往復、実download/unknown故障GUI |
| M-R5 | PC実幅1905/横overflowfalse、通知/label、限定Tab/ShiftTab/Enter | viewport override/native拡大で幅変化を確認できずmobile/200/400未確認 |

R-01/R-02の20回帰と局所GUI証拠を保存した。実B/A→B→A/出力中本人変更はR-03として未確認。U1既知3件とU2重複保存は先行修復/checkpoint承認済みだが、U2の画面受入未確認と共同AC全体は持越し。旧表末尾の「U1/U2未修正」は当時の状態であり現在へ読み替えない。audit high5/critical1・実CI/本番/Supabase/Authの受入は別途未確認。

## 以下はrevision01以前の手動受入履歴

[詳細履歴](manual-evidence.md)と[CDP Retry証拠](cdp-retry-evidence.md)の最新結果をまとめる。過去のexit1を取り消さず、実DOM、単体/API fake、実PG、本人担当の実環境を区別する。Step16は全条件確認まで未チェック。以下の「確認」は記した範囲だけで、全Unitや共同ACの合格宣言ではない。

## M1〜M12

| 行 | 実確認済み | 未確認・証拠の限界 |
|---|---|---|
| M1 | 本人A、0/1/20/21社、同名別ID・終了企業、50メモの追加page、本文のみ候補、保存100社不変 | 実Bは未成立。別ownerの権限はfake認証/実PGで別確認 |
| M2 | 同社別メモの理由と共通志望度、他client構造更新→再取得、本文だけ更新しても7観点を補完しない | 実providerの実行証拠ではない |
| M3 | 志望度/理由の欄限定保存、拒否入力保持、確定後GET失敗と保存成功の区別、送信後追加入力/出力阻止 | U1/U2の既知問題の修正証拠ではない |
| M4 | dispatch前unknownの同ID/body照会/再試行、COMMIT直後応答途絶、custom guard→実route remount→同IDcommitted/追加PATCH0 | helper非cancelable clickによる過去timeoutは履歴保持。native dialog自動承認なし |
| M5 | 他client理由更新→409、base/draft/latest分離、明示rebase→保存 | 実Bログインとは別の同owner別HTTP client |
| M6 | 対応.md/全metadata、企業版/構造/理由の変更とメモ/企業削除でfile0、不正/実15秒期限/途中入力でfile0、読取POST失敗でoperations照会0 | 出力中401/file0/保護欄非表示も実DOMで確認。確認中の各版/削除はC3保留→実HTTP成功→当C3完了/200・404→file0を別区間で6check/exit0 |
| M7 | 未保存取消の入力/起動元focus、unknown出力阻止・route往復、制御401で保護欄非表示、同A再認証→最新確認→明示復旧/draft保持/追加write0 | 実session A→B→Aはsingle-owner previewでは未成立。Auth設定を変更せず保留 |
| M8 | 旧正常編集/出力/fallback ID・日付保持/送信0、破損混在非破壊、読取不能≠0件、0件と未選択復帰 | 初回の旧3条件成功後に誤ったready待ちでexit1、補正後限定実行5check/exit0を区別 |
| M9 | 5幅で主要操作/可視layout7観点順。native200/400の不足操作は各6check/exit0、実CSS671/DPR2・335/DPR4。危険文字/URL配送拒否は安全区間6check/exit0 | 以前のfake配送未証明/全体外部count falseは履歴保持。対象操作外部増分0とlogin時既存Analytics baseline1を区別。全異常×全幅という追加直積は課さない |
| M10 | 入口h1、入力focus、ダイアログTab/ShiftTab wrap・Escape取消/起動元復帰、20社のaria-label付きscroll領域へ実ArrowRight | 主要操作19対象へ実Tab/Enter/Space等を11check/exit0で補完。503回復helper clickをその回の完全keyboard-onlyとせず、button自体のkeyboard成功は別場面で確認 |
| M11 | 100企業/1000メモ/10000操作、warmup5→2client×50の実TCP HTTP。最新成功回p95 616.30ms/最大929.48ms/失敗0、DB15,617,171bytes、idle2秒追加API0 | ローカル参考値。実Supabase/公開/cold認証・休止復旧は未確認 |
| M12 | 単発dummy OCR→訂正→生成→本文編集→対応本文.md→復習.md。企業詳細の本文保存/構造不変と、独立した構造保存/本文不変→対応.md | 初回の本文→構造連続実行は構造期待未到達exit1、原因未確定。別限定構造4check/exit0で初回成功と読み替えない |

## 30詳細NFRの実証と限界

正本は当Unitの[nfr-requirements](../nfr-requirements/tech-stack-decisions.md)。IDはU3内の意味で記す。設計対応/対象fileは[traceability](traceability.json)に維持し、未確認をCoveredへ一括変更しない。

| ID | 必須条件の要点 | 現在の実証・未達 |
|---|---|---|
| NFR1.1 | 全C4経路で本人/owner/所属検査、401/404形を維持 | client/実PG/既存API回帰。実B browser sessionは未確認 |
| NFR1.2 | 失効/本人変更で非表示、旧応答無効化、本人別明示復旧 | state/edits/UI単体、M7制御401と同A復帰。実A/B/A・出力中本人変更のDOM未確認 |
| NFR1.3 | 鍵/tokenはserver、保護内容を新storage/URL/logへ複写しない | source/試験、内容なしhelper診断。実Auth秘密は未使用 |
| NFR1.4 | 全選択の順/所属/構造/版/出典をruntime検証 | model/client/実PG、不正C3のM6 file0。不正URL3種の実配送/契約拒否/file0を最新限定区間で確認。以前のfake診断未到達は失敗履歴として保持 |
| NFR1.5 | private,no-store/HttpOnly/同一Origin継承、legacy送信0 | 既存C4回帰とM8送信0。公開Cookie/実Authは未確認 |
| NFR2.1 | browser15秒/server10秒/DB8秒、GET有限retry、POST/PATCH自動再送0 | client fake clock/実PG/既存期限回帰、M6実15秒file0。503は原因未確定の実失敗として保存 |
| NFR2.2 | C3一貫全件snapshotのみready、部分参照不可 | model/実PG/M1/M2。不正/503の出力阻止と明示回復を区別 |
| NFR2.3 | Company志望度とMemo理由は別版/別保存/欄限定 | edits/実PG/M3。他Unitの既知draft不備は未修正 |
| NFR2.4 | frozen operation/対象/版/changes、unknown同ID、比較POST失敗は照会0 | edits/実PG/M4/M6。新ID自動再送なし |
| NFR2.5 | 状態寿命をmountと分離、往復で追加write0、追加入力保持 | session/editsとM3/M4実route。reload/OS終了を越える保証なし |
| NFR2.6 | 出力毎に全company/memo版・本人/選択/入力世代を照合し1file | export/実PG/M6版変更・削除・不正・遅延・途中入力。M6確認中401/file0/非表示も実証 |
| NFR2.7 | loading/0/構造なし/error/deleted/conflict/unknown/commit後GET失敗を区別 | UI単体/M1〜M8の実範囲。全状態を各幅で反復する追加直積は要求しない |
| NFR3.1 | 409時base/draft保持、latest別領域、明示rebase | session/edits/M5とM9の確認幅 |
| NFR3.2 | 明示再取得/出力で別client変更検出、世代違い棄却 | session/edits/export単体とM2/M6/M7。実A/B/A DOMは未確認 |
| NFR3.3 | 構造/選択/削除/commitでstale、消失を黙って縮小しない | state/export/実PG、M6各版・削除file0 |
| NFR4.1 | 固定7観点、未記載/要確認、本文から補完なし | model/M1/M2。可視layoutの幅別7観点順はM9確認分だけ |
| NFR4.2 | 紙区分と採用Web全metadataを表示/出力へ保持 | model/M6対応.md。未採用/本文から補完なし |
| NFR4.3 | manual/generated・dummy/openai/nullは保存値、保存企業名を維持 | model/fixture/M1。openai保存値を実API成功と扱わない |
| NFR4.4 | 新画像契約なし、原正本不変、旧形式/有効操作を維持 | source/実PG/M8/M12。legacy元データの移行/削除/送信なし |
| NFR5.1 | HTML実行0、安全URLだけリンク、Markdown区切り/改行安全化 | model単体、危険HTML textと実.md/M9長文の確認範囲。img/script/pipe/実改行のtext/.md安全化と不正URL3種の実配送/拒否/file0/非リンク/実行0/対象操作外部要求0を実証 |
| NFR5.2 | 各列挙幅/倍率で主要操作、PC表/mobile同順、可視到達 | 5幅/2native倍率の主要操作・CSS可視側/7観点順を実証。全異常×全幅という追加基準なし。viewportとnativeは分離 |
| NFR5.3 | label/status、Tab/ShiftTab、取消focus、入口h1、処理でfocusを奪わない | UI単体/M10実key/scrollと、配送プローブ後の19主要対象への実Tab到達/activation。連続全操作keyboard-onlyという追加条件は課さず、503回復helper clickは区別 |
| NFR6.1 | 固定route名/code/時間等だけ診断、保護内容/完全body/秘密を記録しない | helperはbool/code/件数/時間/固定action名のみ。架空本文/Cookie/鍵を結果へ貼らない |
| NFR6.2 | runner→受入Red→Green→Refactor、setupをRedにしない | TDD履歴と119件exact成功。今回はhelper診断だけで新app Redなし |
| NFR6.3 | lint/type/test/build・全app/src lines80%維持、既存assertion保持 | 全587pass/lines83.50%/4check成功のapp bytesを維持。実CI job未実施、最新helper関連検査は別記 |
| NFR6.4 | fake/実PG/実DOM/native/性能/実環境を区別し未達/cleanup記録 | 本表と証拠履歴。実環境をlocal成功で代用しない |
| NFR7.1 | 指定量/2client×各50、APIp95≤2秒目標、環境/bytes/失敗別記 | M11ローカル比較HTTP参考成功。全関連API/実Supabase/公開性能保証ではない |
| NFR7.2 | 1〜20社、5000codepoints/1MiB等の既存上限と拒否保持 | model/client/実PGの境界試験、M1/M9。閾値/切詰め変更なし |
| NFR7.3 | 100企業/1000メモ/10000操作/50メモ、DB200MiB、ページ本文なし | M1/M11の実fixture/DB量。全1000件を最大長にした容量保証ではない |
| NFR7.4 | 比較上限を登録上限にしない、新infra/常時通信/有料枠なし | 保存100社/M1とidle追加0/M11、manifest差分確認。無料枠の現在値再調査なし |

## 本人担当の実環境と持越し

実Auth/Supabase秘密・本番DB・実CI job・Vercel設定/deploy・公開/merge SHAは未確認で本人担当。実B sessionを成立させるためにAuth構成を拡張しない。U1既知3不備、U2既知2件とaudit high5/critical1も未修正。これらをU3の局所成功へ含めない。

