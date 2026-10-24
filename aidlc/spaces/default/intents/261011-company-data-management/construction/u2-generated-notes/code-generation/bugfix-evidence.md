# U2 revision-02 — 修正実行記録

## Contract and Ownership

現在attemptのapproved testing-posture briefを入力とした。contract_sha256はsha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440。Frontendのみrunner→Red→最小Green→Refactor。U1・API・DB・既存save/draft・config・依存・root手動記録は変更しない。Step5のCUAとStep7最終品質はroot担当。旧DB Step14のRed順序逸脱とnative200%未確認の履歴は変更しない。

## Step 1 — Baseline and Runner

既存Node22.23.3用PATHをprocess内だけ追加し、承認済みcommandをそのまま実行。新wrapper／依存なし。

- npm test：55files／607passed、exit0、Vitest duration27.33s。
- npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplementRoute.test.ts --passWithNoTests=false：4files／16passed、exit0、duration2.56s。
- Vitest4.1.8、node環境、v8、全src/app include、既存lines80を読取確認。変更なし。
- 本体変更前SHA256: BriefingNoteFlow.tsx＝5545a648c6b15904cc2d276311616a7d2ec18d8a3d787b16c35c2e3a404f1fc2、GenerationSavePanel.tsx＝0f5e27322267bcdcada45d7c86d07b5c9256350a205f855f1435806c5929ca1a。
- 既存ui.test.ts＝87468e87415fb02b21d4ab05bdbe3f358a99e2754ded7fdf51f70db60acbde1f、uiHarness.tsx＝100faf5383760c1f168e1babc075e0e10db033584dc7ce3a5596d2ae1077f37c。

## Step 2 — Frontend Red

AC5.1.5／AC6.2.2〜4／AC9.2.1〜3、BR1.2／BR4.1〜3のR1〜R8を先行追加。U2のConditionalChild補助で実Flowに条件表示された実GenerationSavePanelをmount／unmountする。新規8件、全42件。DOM／native zoomの試験ではない。

実行command：

```text
npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false
```

本体変更前の実出力抜粋：

```text
tests/u2-generated-notes/ui.test.ts (42 tests | 6 failed)
R1 keeps one committed memo across actual OCR child remount
AssertionError: expected [ …(2) ] to have a length of 1 but got 2
R2 keeps the committed candidate after actual review and close
AssertionError: expected [ …(2) ] to have a length of 1 but got 2
R3 retains committed status and the same memo retry after GET failure
Expected: "保存は確定しました"
Received: "...この企業へ保存この生成を終了"
R4 retains an in-flight intent through unmount and observes its commit
Expected: "保存は確定しました"
Received: "...保存結果が不明です。..."
R7 allows an explicitly generated new candidate while failed generation retains the old commit
Expected: "保存は確定しました"
Received: "...この企業へ保存この生成を終了"
R8 retains post-commit edits and hands them to the same saved memo after remount
Expected: "送信後の未保存編集"
Received: "...この企業へ保存この生成を終了"
Test Files 1 failed (1)
Tests 6 failed | 36 passed (42)
Duration 4.32s
```

exit1。収集／setup失敗なし。R1／R2はfake HTTPへ新しい保存が実際に2POST送られた受入失敗。R3／R4／R7／R8も同じ候補寿命を失う実失敗。R5／R6と旧34件は成功し、これらを新しいRed根拠にしない。

## Step 3 — Minimal Green and Preservation Red

Flow所有のGenerationSaveSessionへ意図・通知・取得結果を保持し、Panelは購読のみ行う最小変更後、同UI exact commandで42passed／exit0、duration3.92s。本人・企業・新生成・終了／Flow unmountで取消し、Panel単独unmountでは同じ意図を取消さない。新規生成は新しいsessionを持ち、pending復元は既存の明示回復へ残す。

R4の同じ試験内に、送信中にOCRへ戻って訂正しても凍結要求を変えず、現在の作業入力は保持する観測を補った。同commandで42件中1failed／41passed、exit1、duration4.42s。

```text
R4 retains an in-flight intent through unmount and observes its commit
AssertionError: expected undefined to be '送信後に訂正したOCR'
Test Files 1 failed (1)
Tests 1 failed | 41 passed (42)
```

保存開始時の古いFlow callbackが、送信後の作業OCRとの差を見落としてdraftを破棄する実失敗。失敗観測を先に追加し、修正前に実行した。試験追加数は8件のまま、scope拡張やassertion緩和なし。

完了callbackはFlowのrefを通じて現在の作業入力を参照する最小修正へ変更。同UI exact commandで42passed／exit0、duration3.74s。凍結要求のOCRは元のまま、現在draftのOCRは新しい訂正を保持するassertionが両方成功した。

## Step 4 — Refactor

状態の所有・購読・取消しはGenerationSaveSession／Flow／Panelの境界へ整理。busy解放後も購読先へ通知し、再マウント時の表示更新を同じsessionに閉じる。

所有4source/testだけを既存Prettierで整形しexit0。uiHarnessは整形変更なし。本体2ファイル・試験2ファイル以外のsourceは編集していない。

```text
npx --no-install prettier --write src/components/BriefingNoteFlow.tsx src/components/generation/GenerationSavePanel.tsx tests/u2-generated-notes/ui.test.ts tests/u2-generated-notes/uiHarness.tsx
npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false
npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts --passWithNoTests=false
```

- Refactor後UI: 1file／42passed、exit0、duration4.73s。
- Refactor後model: 3files／22passed、exit0、duration1.73s。
- UIとmodelは互いに独立したVitest processで同時実行。両方の結果を回収した。モデル本体・設定・閾値・timeout・既存assertionを変更していない。
- 新規試験8件。旧34件を保持し合計42件。R4の追加観測も同じ1件内であり件数の水増しなし。

## Handoff and Remaining Verification

Step1〜4を完了。実Flow／実Panelの条件mountを通るcallbackとfake HTTPで、OCR／復習往復、確定GET失敗、保存中、unknown同一要求、対象切替、新候補、後続編集を検証した。現在callback結合の成功は実DOM／native200%／実DBの新しい証明ではない。

Step5のCUA実操作、必要ならStep6の修復、Step7の全U2／実PG・既存生成回帰と全体lint／typecheck／test／coverage／buildは未実施でrootへ引継ぐ。rootのmanual記録、共有handoff、docs、公式Step5成果物、review／lifecycleは書き込んでいない。再マウント後の見えるfocus／キーボード／native倍率は手動確認が必要。実Auth／Supabase／外部API／CI job／Vercel成功を主張しない。

## Step 7 — Initial Quality Run Stopped

上の引継ぎ後、rootのCUA記録を全文読みStep7の実行依頼を受けた。U2全9files140件（実PG10件を含む）、既存生成回帰15files82件、lintは成功。typecheckはui.test.ts(925,7)のunknown値への.markdown参照でTS2571／exit1となり、rootへ報告して停止した。source修正・再実行は行っていない。full test／coverage／build／diffは未実行でStep7 checkboxを付けていない。exact commands／実出力／手動未確認は[改訂2品質記録](verification-revision-02.md)へ記録した。

docs/generated-notes-checks.mdだけ今回の修正・CUA手動未確認・U1の現在状態を更新した。root手動記録、旧証拠、Step8成果物、U1・config・本体sourceはこのStep7で編集していない。

## Step 7 — Explicit Retry Completed

本人のRetry選択をrootから受領後、R8のunknown参照1箇所だけをexpect(recoveredValue).toEqual(expect.objectContaining({ markdown: edited.markdown }))へ修正。本文一致期待を維持し、as anyや期待・期限・設定変更なし。修正後typecheck exit0、UI42/42 exit0（3.68s）、lint exit0、full55files615/615 exit0（25.06s）、coverage615/615 exit0（26.87s）・lines85.12%（2896/3402）、build exit0、diff check exit0。初回TS2571と停止の履歴は前段に維持した。

全exact commandと最終品質は[改訂2品質記録](verification-revision-02.md)を参照。Step7完了とし、Step5未完了／Step6製品不備未確定を維持する。CUA／native200%・画像入力後の実DOMの未確認を成功へ昇格しない。application/test sourceの書込を終了してrootへ返す。Step8成果物／正式review／lifecycleは未操作。
