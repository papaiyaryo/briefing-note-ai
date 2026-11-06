# U2：保存意図の既存修正と追加画面確認

## 現在の結果（2026-10-29 本人確認後）

[Node22実行証跡](execution-20261029.md)と[本人手動確認の追補](human-acceptance-20261029.md)を現在の正本とする。同日Node24と以下の2026-10-26以前の記録は履歴。source・tests・設定は変更せず、今回の変更はdocs/generated-notes-checks.mdとU2記録のみ。Node22.23.3でreadiness16、UI42、model22、証明20、API/client46、実PG10、U2全140、生成回帰82件が各exit0。lint・typecheck・全645件・coverage645件・buildもexit0。全app/srcのlines85.96%（2964/3448）、80%条件を維持した。

CUAでは保存201・同一メモ取得200とOCR／復習往復後の確定維持まで確認した。有限preview終了で最終一覧1件は観測未了だった。その後、本人へrootでの企業登録から保存後往復・一覧1件と実倍率200%の手順を案内し、「全部確認できた」と回答を得た。標準保存往復・一覧1件と200%主要操作は本人報告として確認済み。新しいmemoId・CSS幅・DPR等は未提供であり、AIが測定したとはしない。

Step3を本人報告でチェックする。Step4の400%・指定幅・キーボード等は追加証拠なしで未完了、NFR5.2 Deferred維持。条件付きStep5–7は不具合なしのため非適用。Step8は既存audit末尾空白によるgit diff --check exit1を残す。正式レビュー／checkpointは未実施であり、全Unitの完了を宣言しない。累積source-manifest41claims、traceability135IDs（71 OK／64 Deferred）を維持。unit-test-instructionsは承認済み手順のため書き換えない。

## 2026-10-26 attempt（履歴）

本人のU2 checkpointでのRequest Changes後、新しく承認された[10ステップ計画](code-generation-plan.md)と[試験手順](unit-test-instructions.md)で再検証した。対象はHEAD `46d6b2ec901d04c78d090a1455f5ab3c048c782f`。既存のFlowが保存意図を所有する修正と8回帰を維持する。今回もアプリ・試験・API・DB・設定・依存は変更せず、変更したのは`docs/generated-notes-checks.md`の追記と本Unit記録（本書・traceability注記・計画のチェック）だけ。

| 検査 | 今回の実結果 |
|---|---|
| Step1 readiness | Node v22.20.0、4files/16件、exit0、shell6.2s |
| Step2 UI（R1〜R8含む） | 42/42、exit0 |
| Step2 model | 3files/22件、exit0 |
| Step2 provider/API | 20件、46件、exit0 |
| Step2 実PG | 10/10、exit0 |
| Step2 U2全体 | 9files/140件、exit0 |
| Step2 既存生成・復習・出力 | 15files/82件、exit0 |
| Step8 lint/typecheck | exit0（17.2s）/ exit0（7.1s） |
| Step8 npm test | 56files/645件すべて成功、exit0、Vitest22.32s |
| Step8 coverage exact | exit0、lines85.96%（2964/3448）、statements84.34%、branches76.2%、functions82.42%。件数行は出力抽出外で未記録 |
| Step8 build/diff | build exit0（Next15.5.19、compile5.3s、static18/18）、diff exit0（LF→CRLF予告のみ） |

各コマンドは1回ずつ直列、Retryなし。skipは0件（全件passed表示）。v8・全app/src計測・lines80閾値・既存制限と期待値は変更していない。`git diff --check`は文書へ結果表を追記する前に実行した。

対象内の製品不備は再現しなかったため、Step5–7（Frontend Red/Green/Refactor）は非適用。既存成功試験の複製や人工Redは作っていない。C4照合：正常unknown照会後のみ同一凍結要求の再試行が有効（UI R5ほか）、照会失敗はmodelで結果不明を保持し（save試験）、Panelは`!current.error`の場合だけ再試行を有効化する。照会失敗後に再試行が無効のままであることをUIで直接assertする試験はなく、観察事項として残す（不備の再現ではないため追加していない）。

Step3–4（標準表示の画像選択以降・保存後OCR/復習往復とmemoId/件数1、実倍率200%と承認済み表示条件）は、委任先にブラウザ操作手段がないため実施しておらず未確認。preview・ブラウザは起動していない。Step3・4・10は完了チェックしない。全体リリースや実環境の受入完了ではない。

## 前回attempt（2026-10-24）の結果（履歴）

2026-10-24のlint/typecheck、全体635/635、coverage635/635、build18/18、diffは成功した。一方、標準画面の保存後OCR/復習往復・同じmemoId/件数1と、実倍率200%などの画面受入は未確認だった。以下の「このattemptの検証」以降の節は当時の記録であり、今回の実行証拠ではない。

## 実装判断と所有範囲

BriefingNoteFlowのGenerationSaveSessionが同じ本人・企業・候補の保存意図、安定ID、凍結要求、確定結果を表示パネルの再マウントを越えて保持する。確定後の取得失敗では同じmemoIdを再取得し、新しい作成へ戻さない。送信後の本文・構造・OCR編集は未保存の差分として元の保存メモへの編集導線へ渡す。

操作照会の正常応答unknownは未実行の断定ではないが、本人が同じ凍結要求・operationId・memoIdを再試行できる。照会自体の失敗は結果不明を保って再照会する。新しい再送許可フィールドや新IDを作らない。本人・企業変更と明示的新生成成功は旧候補を無効化し、生成失敗は旧候補の確定を消さない。NFR設計レビューの軽微な表現指摘を解消済みとはしない。

累積[source-manifest](source-manifest.json)の41claimsを保全する。今回の新規変更数とは区別し、5ファイルの許可範囲を拡大しない。歴史的source-fingerprintsは再構築せず保持する。比較ではdocs/generated-notes-checks.mdの追記と、U1が承認済み調査で加えた共有runtimeFixtureの計測を既知の差として区別し、U2のアプリ変更と数えない。U1には計測4ファイルが残るがU2から編集しない。U3とdirty/worktree/共有handoffを保全し、commit/push/merge/deployなし。

## 2026-10-24 attemptの検証（履歴）

[追加確認・品質記録](gui-recheck-after-approval-20261023.md)を正本とし、過去の[再開記録](restart-verification-2026-10-23.md)は履歴として区別する。以前のsummaryとtraceはbefore-gui-recheck-20261024の複製に保存した。

| 検査 | 実結果 |
|---|---|
| Step1 readiness | 4files/16件、exit0、2.83s |
| Step2 UI/model | UI42件3.54s、model22件1.23s、exit0 |
| Step2 provider/API | 20件1.75s、46件1.92s、exit0 |
| Step2実PG/U2全体 | 実PG10件4.44s、U2全140件4.23s、exit0 |
| Step2既存生成・復習・出力 | 15files/82件、3.47s、exit0 |
| Step8初回と本人Retry | 両方633/635・exit1、既存U1の2件が5000ms timeout |
| U1調査中の無変更全体/計測付き全体 | 635/635成功と634/635失敗を別に保持。U2の新しい成功として数え直さない |
| 2026-10-24 lint/typecheck | exit0 / exit0（typecheck shell8.493s） |
| 同日npm test | 55files/635件すべて成功、exit0、23.47s |
| 同日coverage exact | 55files/635件すべて成功、exit0、26.59s |
| 同日build/diff | build exit0、Next15.5.19 compile13.3s、static18/18。diff exit0 |

Node22.23.3、Vitest4.1.8、v8、node環境、全app/src計測、lines80下限、既定並列、元の40ms/4000ms/5000ms・全期待値を維持。今回coverageはlines85.95%（2962/3446）、statements84.33%（3134/3716）、branches76.16%（2106/2765）、functions82.42%（769/933）。過去の同じ85.95%の転記ではなく新測定。

## 画面確認とTDDの適用

今回の追加画面観察では、初回2プレビュー区間で画像選択・OCR訂正・構造化生成まで確認したが、既存300000ms寿命が保存前に終了し、保存成功・memoId・件数1・保存後往復は確認できなかった。正常な前提を失った失敗を製品Redにしない。

U1調査保留後の2026-10-24再開では、Chromeの切断を受け正規一覧から接続を復旧し、ログイン画面まで開いた。入力後のstale/previous-page/Detachedで継続できず追加成功なし。Windows操作はnative pipe不存在、1回再初期化後もCreateProcessWithLogonW failed:2で、native200%を操作していない。PC1366x768、390x844、境界320/767/768、400%、keyboard/label/focus等の今回合格も得られていない。callback/SSRやCSS/viewportを実倍率の代用にしない。

元8回帰のgenuine Red/Green/Refactorは[修正証拠](bugfix-evidence.md)の履歴に維持する。新たな対象内の製品不備が再現していないためStep5–7の条件付き修復は実施せず、既存成功試験を複製して人工Redを作っていない。環境上の未確認を不具合なしの全受入へ昇格しない。Step3–4とGUIを含むStep8は完了チェックしない。

## 後始末と依存の未解決

追加の3プレビュー区間は各専用schema削除true。終了exit1/stopConfirmed falseをそのまま保持し、既知PIDとport3000の不在を独立照会して確認した。最後はhelper51292/Next9052の不在を追加権限の読み取りtasklistで確認、netstatで3000不在。作業tabs閉鎖、倍率/viewport変更なし、テスト/buildとの同時実行なし。

U1の最新診断では入力保持の元assertionが4710msに成立後、pool close完了4713ms、schema cleanup開始4714msで5000msへ達した。bootstrap区間2427msの理由と専用schema cleanup完了は未確認。本人は追加調査の保留と次へ進むことを選び、U1をset-asideしてU2へ戻した。これはU1修復・全体合格・Unit完了の承認ではなく、今回U2全体成功も原因解消を証明しない。U1側の未確認と今回previewの専用schema削除を混同しない。

## 追跡と残る受入

traceabilityの135IDs（90AC/14BR/31NFR）と71 OK/64 Deferredを維持する（2026-10-26に件数とOK対象ファイルの実在を再確認し、今回結果に関わる注記だけ更新）。source-manifestの41claimsは今回触れた`docs/generated-notes-checks.md`を既に含むため変更していない。OKは既存の実装/試験対応であり、実画面合格ではない。NFR5.2・共同編集・実CI・実外部のDeferredを維持し、現在の証拠とU1保留状態へ注記を更新した。GUIの2つの主要な未確認（保存後往復/1件保持、実倍率200%）は本人判断に明示する。

実Auth/Bsession/Supabase17.11/外部provider/CI job/merge SHA/Vercel/本番の達成は未確認。既存dependency audit high5/critical1も今回解消・受容していない。旧DB Step14のRed順序逸脱、過去の型エラーとtimeoutの履歴も取り消さない。今回品質成功だけで全Unit・release完成を宣言しない。
