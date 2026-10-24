# 訂正OCR・生成候補を企業へ保存する

企業詳細の「画像・OCRからこの企業のメモを作成」から開始する。保存先の企業IDと名前は固定し、生成結果の企業名が異なっても企業を追加・改名しない。単発入口は生成・編集・復習・.md出力を続けられるが、企業保存には企業詳細から開始する。

1. 機微情報を確認して画像を選択し、OCR原文を本人が訂正する。
2. Web補足を紙メモと別に確認し、採用するものだけ選ぶ。出典URL・取得日/日時・id・確度を保持する。日付精度だけの取得日はUTC日付開始へ正規化するが、実際の取得時刻を証明する値ではない。
3. 生成後は本文・構造化項目・訂正OCR・説明会情報・採用Webを確認する。本文と構造は別の正本で、片方の編集を他方へ自動反映しない。日付の「要確認」は本人が確認した日付または空欄へ明示編集する。本文の「要確認」は勝手に削除しない。
4. dummy表示を確認する。dummy候補は実在企業の事実ではない。実providerの出自証明も内容の正確性を保証しない。「この企業へ保存」で初めて保存要求を送る。
5. 保存後は同じ企業・メモIDで再取得する。保存確定後の再取得失敗は保存失敗へ戻さず、再取得ボタンを使う。送信後の未保存編集は保持入力として同じ保存メモへ移す。

同じ生成候補のまま画像・OCR確認や面接前復習を往復しても、元の保存確定とメモIDを保持する。新しいメモを自動作成せず、保存済みメモを開いて編集できる。本人が明示的に新しく生成し、検証に成功した候補は別の保存意図として扱う。保存中に訂正した作業OCRは送信済み内容へ混ぜず、未保存入力として残す。

結果不明では未実行と決めず「操作結果を確認」を行う。確認後の明示再試行は凍結した同じ内容・operationId・memoIdで行い、その後の編集を混ぜない。拒否・生成失敗・不正構造・証明の不整合では成功保存を表示せず、訂正と編集を保持する。必要なら本人が再認証する。再生成・終了・移動の未保存確認は取消で作業を続けられる。

一時画像はOCR処理のため送信される。アプリDB・候補DTO・一時draft vaultへ画像binary、元file名、一時URLを保存しない。画像差替え・除去・保存確定・終了・unmount時に参照を解放する。外部AIの保持条件は提供元に依存し、アプリから外部のゼロ保持を保証しない。単発Responsesにはstore:falseを指定する。本文は自由編集できるため、本人が本文へ書いた文字列を画像名と推測して除去しない。

## ローカル検証

Node22、既存依存、使い捨てPostgreSQL17を使う。実Supabase・実LLMの鍵は不要。専用fixtureだけを利用し、実画像や私的本文を検証記録へ貼らない。runner・exact groupは[Unit試験手順](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/unit-test-instructions.md)、実結果は[Unit TDD記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/tdd-evidence.md)を参照する。

改訂2の自動回帰は[修正実行記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/bugfix-evidence.md)を参照する。実Flowと保存パネルの再マウントを含むcallback／fake HTTP試験で重複POST防止を検証した。これは実DOM・focus・キーボード・native倍率の成功を証明するものではない。

改訂2の[品質確認記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/verification-revision-02.md)には、初回型検査失敗とRetryによる試験1箇所の型参照修正を残す。最終lint・typecheck・615件の全試験・buildは成功し、全app/srcのline coverageは85.12%で既存80%下限を満たした。下記の実画面未確認は残る。

2026-10-23の[再開検証記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/restart-verification-2026-10-23.md)では、既存sourceを変更せずU2全140件・既存生成回帰82件・lint・typecheckを確認した。全suite初回は凍結U1の試験が5000msでtimeoutしたため停止。本人の明示Retry後、同じ条件の全635件、coverage、build、diff checkは成功した。全app/srcのlinesは85.95%（2962/3446）。失敗履歴と80%閾値を維持し、今回の実画面/native200%はrootの確認待ちとして区別する。

現在の実画面確認はcomputer-use／CUAの実UI操作で行う。既存ローカルpreviewのdummy Auth/provider・隔離schemaと有限cleanupを利用し、旧CDP helperによるbrowser操作は使わない。PC1366×768、390×844、幅320/767/768と200/400%拡大、label・通知・キーボード・安全表示・保存と再取得の承認条件を維持する。

[改訂2の手動確認記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/manual-revision-02-root.md)では、架空本人ログイン・企業登録・企業詳細から正しい生成入口まで到達した。基準の実測は1920×957／DPR1で、native拡大のキー操作は反映されなかった。通常filechooserは10秒でtimeoutし、画像選択・OCR・生成・保存・保存後往復は実DOM未確認。倍率未反映やchooser未到達を製品の失敗と断定せず、native200%受入も未確認のままとする。専用タブ閉鎖とpreview停止・隔離schema削除は確認済み。

[過去の画面確認記録](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/manual-evidence.md)は履歴として保持する。視覚viewport拡大やCSS viewportのリフロー、callback成功をnative200%操作の成功へ読み替えない。

## 設定と未解消事項

追加依存・migration・table・設定キーはない。実設定値は[既存setup](company-data-setup.md)の空欄を本人がGit管理外へ記入する。秘密値はserver内だけで扱い、Vercel設定・deploy・公開確認は本人担当。実外部API・実Supabase/Auth・実CI job・本番の成功をローカル結果から推定しない。

U1の既知3不備は修正後の正式レビューとcheckpointを完了しており、旧記録の「未修正」は当時の履歴として区別する。今回U2の実画面受入や実Auth・native200%の成功を意味しない。既存依存auditの指摘は今回再調査していない。比較UIと比較出力の受入はU3であり、既存単発の復習・出力と区別する。

## 2026-10-24の品質再確認と画面の未確認

U1追加調査を本人の指示で保留し、公式にU2へ再開した後の結果。対象はHEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`と既存dirty、`release/bolt-002-company-data-management-local`。Node22・Vitest4.1.8、dummy providersと実使い捨てPG、既存の既定並列・5000ms等の制限・期待値・v8対象とline80%閾値を維持した。previewを終了してから各コマンドを1回ずつ直列実行し、今回の追加Retryはない。

| コマンド | 今回の結果 |
|---|---|
| `npm run lint` | exit0 |
| `npm run typecheck` | exit0、shell8.49秒 |
| `npm test` | exit0、55ファイル・635/635件、Vitest23.47秒 |
| `npm test -- --passWithNoTests=false --coverage` | exit0、55ファイル・635/635件、Vitest26.59秒 |
| `npm run build` | exit0、Next15.5.19、compile13.3秒、static pages18/18 |
| `git diff --check` | exit0、shell0.16秒。LF→CRLF予告警告のみ |

全app/srcのcoverageはlines85.95%（2962/3446）、statements84.33%（3134/3716）、branches76.16%（2106/2765）、functions82.42%（769/933）。line80%条件を満たした。lintとbuildの実行総時間は未計測であり、compile時間をbuild全体の所要時間にはしない。

前回の全試験633/635件成功・2件5000ms timeoutと、本人の公式Retry後も同じ2件がtimeoutした履歴は残す。U1追加診断の634/635件とcleanup中timeoutも今回の成功とは別記録で、原因因果と当該schema cleanupの確認は保留。U1担当の4ファイルの計測変更は残っており、U2の新規実装変更に数えない。今回全試験が通ったことを、過去のtimeout原因の解消やU1追加調査の完了へ読み替えない。U2側でsource・試験・設定は変更していない。

画面の実観察は[承認後の追加画面確認](../aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/code-generation/gui-recheck-after-approval-20261023.md)を参照する。前回は表示ボタンから445bytesの架空画像を選択し、OCR200・訂正入力・構造化生成200まで確認したが、保存前に既存300000msのpreview寿命が終了した。保存成功・memoId・件数1・保存後OCR／復習往復は未確認。照会不成立時の結果不明と再試行無効表示を、未実行確定や保存成功と扱わない。

今回の再確認はnative接続とブラウザのstale／Detached等でログイン操作から完了できず、保存後往復・native200%／400%・承認済み表示幅・キーボード／focusの新しい合格証拠は得ていない。製品Redは得られず条件付き修復は未実施。preview終了はexit1・stopConfirmed:false・schemaDropped:trueで、独立確認では所有PIDとport3000は不在、所有タブ閉鎖、倍率／viewport変更なし。品質検証の成功だけでStep8・GUI・Unitの完了とはしない。
