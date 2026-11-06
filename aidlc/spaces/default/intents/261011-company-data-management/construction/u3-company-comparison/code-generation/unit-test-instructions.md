# U3 — 既存修正の再検証のUnit試験手順（revision 03）

## Scope and Preconditions

[再検証計画](code-generation-plan.md)に対する新しい正式Plan Approval後に実行する。既存Node22系（process-local PATH）、Vitest 4.1.8／node環境、v8・全app/src lines80%以上、既存依存とdummy provider/Auth、localhostの使い捨てPG17を使う。統合試験には`U1_TEST_DATABASE_URL`へダミーのローカル接続先（CIと同じ値）を設定する。新しいrunner/provider/include/exclude/threshold/timeoutの変更は不要。

回帰20件（S-R1〜5、C-R1〜7、U-R1〜6、I-R1〜2）はすでに既存4試験ファイルに存在し、今回は追加せず再実行する。新しい試験は、新たな不具合が再現した場合の最小回帰に限る。U1/U2のhelpers/fixture/hookHarnessは読取再利用のみ。全体baseline/品質・画面手順・cleanupは計画に集約し、この文書のrun commandはすべてU3 exact fileだけに限定する。

## Runner Readiness

```text
npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false
```

収集0件や準備不備はRedではない。PG準備失敗をアプリ不具合と数えない。

## Re-verification — Business Logic and Integration

```text
npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts --passWithNoTests=false
```

```text
npm test -- tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

S-R1〜5／C-R1〜7は参照利用不可の保持・解除、新規保存0、unknown要求の同ID lookup/retry保持を確認する。I-R1／I-R2は実PGでメモ／企業削除→C3 404→新規PATCH0を確認する。結合は既存runtimeFixtureと専用random schemaを使い、finally/afterAllで専用fixture/client/schemaだけを閉じる。

## Re-verification — Frontend Behavior

```text
npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false
```

U-R1〜6は確定outcomeに基づく成功表示、409後のlatest失敗で成功文なし、refresh404後の入力/保存/rebase停止、503/通信失敗との区別を確認する。SSR/callback試験は実DOM・キーボード・倍率の証明ではない。

## U3 All

```text
npm test -- tests/u3-company-comparison/readiness.test.ts tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts tests/u3-company-comparison/legacy.test.ts tests/u3-company-comparison/ui.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

2026-10-26の実行で9ファイル／141件成功、skip 0。最終件数は今回の実行結果で記録する。

## Mocking, Coverage and Evidence

架空データ・dummyのみ、fake fetch/clockと送信spyを使う。latest失敗は404と503/切断を分ける。再試行でID/bodyが同一であること、再表示/lookupだけでwrite増分0であることを確認する。保護内容や完全bodyを証拠/consoleへ出さない。

全app/src line coverage 80%以上とCI条件を維持し、除外追加・assertion緩和・timeout延長で合格させない。新たな不具合を修復した場合だけ、そのRedの実失敗出力、Green/Refactorのexit・件数を公式Unit記録に残す。再現しなければTDD非適用とその理由を記録する。

## Sources

- [再検証計画](code-generation-plan.md)、[旧試験手順revision 02](unit-test-instructions.before-reverify-20261027.md)、[旧Red/Green記録](bugfix-evidence-revision-02.md)。
- [機能設計](../functional-design/functional-spec.md)、[業務ルール](../functional-design/rules.md)、[共有契約](../../../inception/contract-design/contract-summary.md)。
