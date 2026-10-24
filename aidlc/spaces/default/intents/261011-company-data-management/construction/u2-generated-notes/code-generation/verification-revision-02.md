# U2改訂2 — Step7品質確認

## Initial Execution Results

root所有のmanual-revision-02-root.mdを全文読取り、専用preview終了・schema削除済みで他の重い処理がない条件で開始した。既存Node22用PATHをprocess内だけ追加。設定・依存・期待値・期限・U1・application sourceは変更せず、下記を直列実行した。

| 順 | exact command | 結果 | 観測 |
|---|---|---|---|
| 1 | `npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts tests/u2-generated-notes/ui.test.ts tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false` | PASS／exit0 | 9files／140passed、duration5.26s。実PG結合10件を含む |
| 2 | `npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplement.test.ts tests/webSupplementRoute.test.ts tests/webSupplementServer.test.ts tests/markdown.test.ts tests/download.test.ts tests/ui-components.test.ts src/lib/structure/dummyStructure.test.ts src/lib/structure/validate.test.ts src/lib/structure/toMarkdown.test.ts src/lib/interviewReview/dummy.test.ts src/lib/interviewReview/toMarkdown.test.ts tests/u1-company-notes/existingRoutes.test.ts --passWithNoTests=false` | PASS／exit0 | 15files／82passed、duration3.92s |
| 3 | `npm run lint` | PASS／exit0 | ESLint、警告・エラー出力なし |
| 4 | `npm run typecheck` | FAIL／exit1 | TS2571、ui.test.ts(925,7) |

typecheckの実出力：

```text
> briefing-note-ai@0.1.0 typecheck
> tsc --noEmit

tests/u2-generated-notes/ui.test.ts(925,7): error TS2571: Object is of type 'unknown'.
```

対象はR8のworkspaceDrafts.recover(...).value.markdownの直接参照。DraftVaultのvalueはunknownであり、実行時の本文保持assertionは成功するがTypeScriptがこの参照を認めない。所有U2試験内の型付きassertionの問題で、U1や設定変更を要しない。rootへ実結果と位置を報告し、指示どおり修正・再実行せず停止した。

## Not Executed After Initial Failure

次の所定最終commandは今回未実行。前回の成功を今回の代用にしない。

- npm test
- npm test -- --passWithNoTests=false --coverage
- npm run build
- git diff --check

U2全9files commandが実PG結合を含み全140件成功したため、同じ実PG groupの重複再実行はしていない。Step7の全条件は未完了でcheckboxを付けていない。Step8成果物・source manifest／hash・正式review／lifecycleは作成・操作していない。

## Manual Acceptance and Documentation

根拠は[rootのCUA記録](manual-revision-02-root.md)。架空本人ログイン・企業登録201・企業詳細・正しい生成入口までは成功。基準1920×957／DPR1からnativeキー操作の倍率は反映せず、200%は観測できなかった。通常filechooserが10000msでtimeoutしsetFiles未到達。画像選択・OCR・生成・保存・保存後OCR／復習往復は実DOM未確認。

これらは製品Redと確定しておらず、追加アプリ修正をしない。Step5未完了、Step6で製品修復の根拠なし。専用タブ閉鎖、preview exit0、停止確認と専用schema削除trueのroot記録を引き継ぐ。callback42件の成功をnative200%／実DOM成功へ読み替えない。

docs/generated-notes-checks.mdは今回の同候補保存状態保持、CUAでの確認方法と手動未確認、U1修正後の正式review／checkpoint済み状態へ限定更新した。旧証拠、root手動記録、共有handoffは変更していない。実Auth／Supabase／外部API／CI job／Vercel成功を主張しない。

## Retry — Completed Local Quality

本人の明示Retryをrootから受領し、同じ承認計画で継続した。R8の1箇所だけを、unknown値への直接.markdown参照から、復元value全体に対するexpect.objectContaining({ markdown: edited.markdown })へ変更した。本文の完全一致期待とundefined時の失敗は保持し、as any・assertion緩和・期限／設定変更は使用していない。

型検査失敗は前段の実結果として残す。修正後の結果は以下。重い処理は直列実行し、別の失敗はなかった。

| exact command | 結果 | 観測 |
|---|---|---|
| `npm run typecheck` | exit0 | tsc --noEmit成功 |
| `npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false` | exit0 | 1file／42passed、duration3.68s |
| `npm run lint` | exit0 | ESLint成功、警告なし |
| `npm test` | exit0 | 55files／615passed、duration25.06s |
| `npm test -- --passWithNoTests=false --coverage` | exit0 | 55files／615passed、duration26.87s、lines85.12%（2896/3402） |
| `npm run build` | exit0 | Next.js15.5.19、18pages生成成功 |
| `git diff --check` | exit0 | 空白エラーなし。LF／CRLF変換の案内のみ |

直前のU2全140件／既存生成82件は成功済みで、同じtargeted commandは無意味に繰り返さなかった。変更した試験のUI42件と、所定の全suite／coverageで変更後の回帰を確認した。全体line85.12%は既存v8、src/app全体include、lines80の閾値をそのまま使用した結果。coverage/coverage-summary.jsonとcoverage/index.htmlは通常の生成レポート。

docsを現結果へ更新してStep7を完了する。Step5はnative200%／画像選択後の導線が未確認で全条件未完了、Step6は製品不備未確定のまま追加修正なし。実DOMの保存・往復、実Auth・Supabase・外部API・実CI job・本番は合格としない。root手動記録と旧失敗証拠を維持し、正式review／Step8成果物／lifecycleはrootへ返す。application/test sourceの書込は終了。


