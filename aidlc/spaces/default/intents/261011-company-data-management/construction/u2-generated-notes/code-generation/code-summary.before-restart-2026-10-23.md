# U2：同じ生成候補の重複保存を防ぐ修正結果

承認済み[改訂2計画](code-generation-plan.md)と[試験手順](unit-test-instructions.md)に従い、OCR確認・復習への往復で保存パネルが再マウントされても、同じ候補の保存意図と確定結果を保持する。ローカル品質検証は成功したが、今回の実DOMでの画像入力以降とnative200%操作は未確認であり、全体受入の完了ではない。

## 変更と所有

- BriefingNoteFlowが一時メモリのGenerationSaveSessionを所有し、GenerationSavePanelへ渡す。同じ本人・企業・候補のOCR/復習往復で意図・安定ID・保存状態・通知・保存メモを引き継ぐ。
- 確定後GET失敗では同じmemoIdを再取得し、新規作成へ戻さない。saving/unknownでは元の凍結要求・operationIdを維持し、自動POSTを増やさない。
- 本人/企業変更・新しい明示生成成功・終了では古い状態を流用しない。新候補の保存を一律禁止せず、送信後のOCR・本文・構造の未保存編集を凍結要求と分けて保持する。
- 変更はFlow・保存パネル・U2 UI試験/補助・docs/generated-notes-checks.mdの承認済み5ファイル。新しいDTO・DB・API・一意制約・依存・設定は追加しない。U1 source/produces・U3・共有handoffは変更していない。
- branch release/bolt-002-company-data-management-localの既存dirty/worktreeを保持。commit/push/merge/deployや実Auth/Supabase/外部API/Vercel操作は行っていない。

## TDDと今回の検証

詳細は[bugfix-evidence](bugfix-evidence.md)と[今回の品質記録](verification-revision-02.md)。旧結果は[過去summary](code-summary.before-revision-02.md)、tdd-evidence.md、verification-results.md、manual-evidence.mdへ履歴として保持する。

| 検証 | 実結果 |
|---|---|
| 変更前baseline | 55files607/607、exit0、27.33s |
| runner readiness exact4files | 16/16、exit0、2.56s |
| 新規8回帰のRed | UI42中6失敗/36成功、exit1、4.32s。同候補のOCR/復習往復でPOST2を観測 |
| 最小Green | UI42/42、exit0、3.92s |
| 保存中OCR編集の保全Red | UI42中1失敗/41成功。凍結要求と現在編集の分離を修復 |
| Refactor | UI42/42、exit0、4.73s、model3files22/22、exit0、1.73s |
| U2全9files・実PG含む | 140/140、exit0、5.26s |
| 既存生成回帰15files | 82/82、exit0、3.92s |
| Retry後typecheck/UI/lint | 全てexit0、UI42/42、3.68s |
| 最終全体test | 55files615/615、exit0、25.06s |
| 最終coverage | 615/615、exit0、全app/src lines85.12%（2896/3402） |
| build / git diff --check | exit0、18pages生成。既存LF/CRLF案内のみ |

Step7初回typecheckは新規UI試験のunknown値への直接プロパティ参照（TS2571）でexit1となり停止した。本人のRetry後、同じ本文一致をobjectContainingで検査する書き方へ1箇所だけ修正し、型検査とUIを再確認した。型の強制変換や期待値・期限の緩和をしていない。失敗を製品Redや成功へ読み替えず履歴に残した。include/exclude/v8/lines80%閾値は維持する。旧DB Step14のRed順序逸脱も今回の成功で取り消さない。

## 実画面の確認と限界

[rootのCUA実操作記録](manual-revision-02-root.md)でdummy本人ログイン、架空企業作成201、正しい企業詳細の生成入口と固定保存先・upload画面までを確認。初回のdummyメール指定誤り401は訂正して200となり、製品Redではない。

実測基準はCSS1920×957/DPR1。native拡大キー2表記は反映されず、200%表示を観測できていない。通常filechooserも10秒でtimeoutし、setFiles・画像選択・OCR・生成・保存・保存後往復へ到達していない。権限設定をこちらで変更せず、利用者へ公式の拡張設定案内を提示した。原因を権限不足と確定したものではない。callbackやviewport emulationを実DOM/native操作の成功にしない。

専用タブclose、preview exit0、StopConfirmed=true/schemaDropped=trueを回収済み。通常のテストDBは維持。計画Step5/6の未確認を保持し、未成立を理由に別sourceや設定を修正しない。ブラウザの入力・倍率操作が利用可能になった後に有限手順で確認する。

## 追跡と残る受入

[traceability](traceability.json)の90AC/14BR/31NFR、135IDsを保持。U1修正済み事項を未修正と呼ぶ古い説明は履歴と分け、U2実DOM未確認・共同受入の保留を正しく記す。OKは実装とローカル証拠の対応であり、全受入の宣言ではない。NFR5.2はDeferredを維持する。

[source-manifest](source-manifest.json)は従来の厳密41claimsを保持。[source-fingerprints](source-fingerprints.json)を最終bytesへ更新し、旧指紋は[source-fingerprints.before-revision-02](source-fingerprints.before-revision-02.json)へ保存する。旧指紋との差は今回の5ファイルと、先行U1で更新されたdocs/company-data-setup.md・CompanyDetail.tsxの2ファイル、計7pathである。先行U1の2ファイルは今回のU2実装では編集していない。

実Auth/Bセッション/実Supabase/PostgreSQL17.11/実外部API/実CI job/公開受入/merge SHAは未確認。Vercelは本人担当。U3既知不具合は後続の新計画と本人承認の対象であり、このU2修正で解消したとしない。既存dependency audit high5/critical1も未対処で、リスク受容・依存更新をしていない。
