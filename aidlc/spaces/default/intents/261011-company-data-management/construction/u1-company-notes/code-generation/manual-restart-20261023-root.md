# U1 再実施の画面確認（2026-10-23・Asia/Tokyo）

## 方法と対象

承認済みのlocal-workspace-previewを変更せず使用した。既存Node22、dummy本人、隔離された使い捨てPostgreSQL schema、実Chromeの2タブを利用。入力は架空データのみ。ブラウザ操作はcomputer-use/CUA。APIやReact内部状態を直接書き換えず、画面の明示操作・DOM表示と既存server logで確認した。新しいブラウザ試験依存は追加していない。

## 今回確認できた経路

| 対象 | 操作・実際の結果 |
|---|---|
| 企業の競合 | Aの個人メモ入力を保持した状態で、Bが先に保存200。Aの旧版保存は409となり、競合通知とAの入力が残った |
| 企業の最新取得 | 明示GET後、保持欄にはA、disabledの保存済み欄にはBを別表示。再編集を選ぶまで保存disabled |
| 企業の明示再保存 | 保持入力で再編集をEnterで実行。Aを保存200し、Bの明示再取得でも同じAの最終値を確認 |
| メモの競合 | Aの本文を保持し、Bが先に本文保存200。Aの旧版保存は409。保持本文は消えない |
| メモの最新取得 | 保持欄にA、disabledの本文欄に最新B。本文保存・本文出力は再編集前disabled |
| メモの明示再保存 | 保持入力で再編集をEnterで実行してAを保存200。Bの明示再取得後もAの最終本文に一致 |
| 限定キーボード | 本文欄からShift+Tabでプレビューボタンへ、その後3回のShift+Tabで「保存済みの最新を再取得」に実focus到達。再編集ボタンのEnter操作も確認 |
| PC | 実測2560×1261、document横overflowなし。表示・編集・保存入口を確認 |

企業・メモとも、server logはB保存200→A競合409→明示の最新GET群→A再編集保存200→別タブの最新GETの順だった。最新取得と再編集の間の追加PATCHは0。ブラウザ表示だけからHTTP成功を推定せず、両方を確認した。操作時の元draftと最新表示の分離は確認したが、ブラウザから内部baseVersionを直接読んだ証拠とはしない。内部版と未承認送信の拒否は別のcallback/実PG回帰に対応する。

## 未確認・限定事項

- viewportを390×844に設定したが、既存タブも新規タブも実測2560×1261だった。設定成功をスマホ確認へ読み替えず、今回のスマホ幅は未確認。設定はresetした。
- 今回のキーボード確認は上記の限定区間。全フローkeyboard-onlyではない。
- 今回、最新GETの失敗を制御してからの入力保持・追加PATCHゼロという一連のGUI故障注入は未実施。期限終了後に入力が保持されて汎用取得エラーとなる表示は観測したが、制御された503確認や根本原因の証明とはしない。
- 2026-10-21の390×844等の[旧手動証拠](manual-revision-03-root.md)は履歴として保持する。現行ソースの同一性は確認したが、今回同じ画面確認を実施したとは呼ばない。
- 実本人Auth、実B利用者切替、実Supabase、外部API、本番・Vercelは未実施。
- Step10はスマホ等の残条件があるため未チェックを維持する。

## 中断・操作上の失敗の保存

先行2回は、5分で終了するpreviewの寿命や中断により企業側の最後の保存へ未到達だった。次の限定区間で企業側の全連続経路を確認した。その後のメモ区間もpreview寿命後に継続できなくなり、別の専用区間でメモ側だけを完了した。寿命・cleanup方法・アプリの制限時間は変更していない。

初回タブの一時的なDetached/Debugger unattached、ログイン入力後のstale AX、初回に別の旧React画面が見えてreload後に対象アプリを確認したこと、保存後の一時status/heading待機が期限を返したことも未成功の操作として保持する。新しいDOMで入力済み/画面遷移済みを確認してから続け、同じ保存を無条件に再送していない。これらをアプリ不具合のRed、実Auth成功、待機時間内の性能達成と扱わない。

## 専用資源の片付け

| 区間 | helper/Next PID | 専用schema末尾 | 実結果 |
|---|---|---|---|
| 先行企業 | 29952 / 44400 | 6730fc91cd0644a5b6cd03594f082eeb | exit0、stopConfirmed=true、schemaDropped=true |
| 中断された企業 | 48232 / 32428 | 20dc7bc37e9b4b73be4a5f9ff302dceb | exit0、stopConfirmed=true、schemaDropped=true |
| 企業の完了・メモ途中 | 37288 / 40016 | 4c9371a8efba4947a32429ac103e7e4f | exit0、stopConfirmed=true、schemaDropped=true |
| メモの完了・限定キー | 8704 / 47088 | 0b8ee71bf1614499ad893a68fa964d75 | exit0、stopConfirmed=true、schemaDropped=true |

専用タブは全てcloseし、viewportもreset済み。既存の通常テストDBは維持した。他のタブやDB/schemaは操作していない。アプリ・試験・helperのソース変更なし。

## Sources

- [承認済み計画](code-generation-plan.md)、[試験手順](unit-test-instructions.md)
- [今回の再検証](restart-verification-20261022.md)、[ソース照合](restart-source-check.md)

