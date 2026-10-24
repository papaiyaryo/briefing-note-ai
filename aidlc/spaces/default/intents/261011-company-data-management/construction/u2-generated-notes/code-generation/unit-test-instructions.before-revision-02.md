# U2 — 単体・境界・結合試験の手順

## Setup and Scope

本書の実行コマンドはU2新規試験またはU2が引き継ぐ生成回帰のexact fileだけを指定する。Node22／既存依存・既存Vitest node設定を利用し、新依存なし。実PG17の準備はcode-generation-plan.md Step1の試験専用環境だけ。実Supabase・実API鍵・実データは使用しない。現時点は計画であり試験成功や実装許可を意味しない。

## Runner Readiness

新しい失敗試験の前に、既に存在するU2関連回帰でrunnerが動くことを確認する。

```text
npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplementRoute.test.ts --passWithNoTests=false
```

exit0と実テスト件数を記録する。未導入module／環境／fixture／helper不備・0件・collect失敗はapp Redと区別する。新しいgroupは試験ファイルを書いてからRedを実行する。

## Exact Test Groups

| group | 主な対象と最小シナリオ |
|---|---|
| model | 正当C2、出典保持、画像排除、本文／構造別、owner別draft、凍結要求・unknown |
| server | 証明発行→既存verify、改変／別本人／鍵、検証失敗非発行、store:false、deadline・finally、安全log |
| api | guard先行、401/403、no-store、構造成功＋receipt、C5と既存structure例外、45秒・取消し・不正応答 |
| ui | 企業固定、生成名不一致、OCR訂正、別正本、dummy／出典、明示保存・unknown／GET失敗、dirty cancel・stale応答・画像release・出力 |
| sql | 実migration／adapter＋dummy生成の保存再取得、owner／親消失／不正証明・構造、重複・確定直後応答途絶 |

各groupで受入対応の失敗出力をRedとして記録し、最小Green、同じgroupがgreenのままRefactorする。新規対象部品は各5〜8件を基本に正常＋2以上の失敗／境界を含め、UI複数部品と実PG結合を合わせ計80件以上を目安にする。必要な境界追加は同じapproved scope・Node/Vitest/fake方式内で行う。

### model

```text
npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts --passWithNoTests=false
```

### server

```text
npm test -- tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts --passWithNoTests=false
```

### api

```text
npm test -- tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts --passWithNoTests=false
```

### ui

```text
npm test -- tests/u2-generated-notes/ui.test.ts --passWithNoTests=false
```

### sql

```text
npm test -- tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false
```


## Whole Unit and Existing Generation Regression

U2全group:

```text
npm test -- tests/u2-generated-notes/candidate.test.ts tests/u2-generated-notes/draft.test.ts tests/u2-generated-notes/save.test.ts tests/u2-generated-notes/generationReceipt.test.ts tests/u2-generated-notes/providerRequests.test.ts tests/u2-generated-notes/routes.test.ts tests/u2-generated-notes/clients.test.ts tests/u2-generated-notes/ui.test.ts tests/u2-generated-notes/generation.integration.test.ts --passWithNoTests=false
```

既存の生成／復習／出力と認証された生成入口の回帰:

```text
npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplement.test.ts tests/webSupplementRoute.test.ts tests/webSupplementServer.test.ts tests/markdown.test.ts tests/download.test.ts tests/ui-components.test.ts src/lib/structure/dummyStructure.test.ts src/lib/structure/validate.test.ts src/lib/structure/toMarkdown.test.ts src/lib/interviewReview/dummy.test.ts src/lib/interviewReview/toMarkdown.test.ts tests/u1-company-notes/existingRoutes.test.ts --passWithNoTests=false
```

全アプリのlint／typecheck／test／build／coverageと公式checkpointは計画Step19・20の検査として実行し、本書のU2単体commandへ混ぜない。既存scopeを除外して合格にしない。

## Fixtures, Mocks and Coverage

- 架空owner2名・架空企業・64KiB以下画像・訂正OCR・区分別構造・id/sourceUrl/fetchedAt/confidence付き採用Webを使う。画像binaryは一時fixtureだけで、生成保存DTO／DB／localStorageに残さない。
- providerはdummyまたはfake transport。未知の外部fetchは失敗させ、OpenAI等の実呼出しを許可しない。fake clockでprovider30秒／server40秒／browser45秒と取消し・遅延を確認し、無期限待ちを許さない。鍵はdummy、実値を読まない。
- 署名試験は実HMACとU1 verifierで発行／検証の結合を確認する。UIがdummy出自をopenaiへ書換えても保存できない。mapperは既存C2型と全項目を保つ。
- SQL groupはU1の試験bootstrap／実migration／DB adapterと隔離schemaを再利用。fake auth／providerだけでDB自体をfakeにしない。finallyで自分のschema・接続をcleanupし、他者DB／volumeを削除しない。
- SSR／callbackは既存Node戦略を継続し、実DOM／focus／キーボードの成功と称さない。manual flowは計画Step18で実アプリと対応browserにより別確認する。helperの偽陽性・未到達を成功にしない。
- 全app/srcのline coverage80%以上と既存includeを維持。単体groupだけで全体coverage達成を主張しない。足りない場合は意味のある未検証境界を追加し、閾値／assertion／対象範囲を緩めない。

## Evidence and Limits

TDD証拠は受入ID、exact command、Redの実失敗理由、Green／Refactorのexitと件数をUnit記録へ残す。失敗・skip・未実施を隠さない。U1既知の競合draft／復元session／削除期限と既存依存auditは未修正。実外部・実Supabase・CI job・公開は本ローカル試験の証明範囲外。Vercelは本人担当のまま。

