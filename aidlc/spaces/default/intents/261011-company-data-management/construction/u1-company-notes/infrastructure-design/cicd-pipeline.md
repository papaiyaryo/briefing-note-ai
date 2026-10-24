# U1：既存CI・単一リリースの手順

## Pipeline & Gates

| 段階 | 実行・確認 | 次へ進む条件 |
|---|---|---|
| 計画 | Inception、U1設計、コード計画と試験手順 | 実際のInception承認・Code Generation Plan Approval。検証コマンド承認を別扱い |
| 着手準備 | 導入Boltの実SHA公開確認、専用DB/Auth／鍵／接続／権限、最新mainを基点にrelease/bolt-002-company-data-management | 未達を成功扱いしない。本人ログインが必要な設定は後で本人が操作 |
| Red→Green→Refactor | runner確認→受入連動失敗試験→最小実装→greenを保った整理 | 実行コマンド・AC・結果を公式Unit記録へ。環境不備はRedではない |
| Local／既存verify CI | lint、typecheck、test、build、全アプリline coverage>=80、実PostgreSQL17結合試験 | 全成功。0件・fake storeだけ・除外追加によるcoverage達成は不可 |
| Unit checkpoint | 人間承認済みnpm test -- --passWithNoTests=false | 現在Unitと完了Unitの試験成功。普通の完了確認は選択済み自動継続、例外は本人確認 |
| Preview | 同候補SHA、隔離試験schema、dummy生成、架空fixture、手動画面・性能／容量／復元 | 機能受入と品質目標を満たす。本人Auth未作成なら未実施として残す |
| Release PR | U1→U2→U3直列で全90 AC、1つの日本語PR | Intent／Inception／AC証拠／検査／対象外／配置確認を記載、CI成功、人間merge |
| Production | main実merge SHAの既存Vercel自動deployment | 該当SHA成功＋ページ／health／承認flow。未確認をrelease完了にしない |

## CI Configuration Design

既存.github/workflows/ci.ymlのverifyを拡張し、第二のdeployment workflowを作らない。Node22と固定lockfileのnpm ciを維持する。PostgreSQL17 serviceをhealth確認して、使い捨て試験DBへ実migration＋試験bootstrapを適用する。dummyユーザーのauth参照表・dummy Auth adapterは試験専用で、本番認証を無効にする設定を公開bundleへ入れない。

ローカルは承認計画のcompose.test.ymlで同major17の使い捨てDBを用意する。17.11は本番の本人申告版、試験imageは取得可能な17系の具体tag/digestと実server_versionをコード計画で固定・記録する。実DBを用いた版競合、同時更新、親／子集合、再送、期限・取消し、RLS、復元を試験する。試験接続がない時にskipして緑へする仕組みは作らない。

承認済みコマンドはnpm run lint、npm run typecheck、npm test、npm run build、npm test -- --passWithNoTests=false --coverage。Vitest4.1.8と同版のcoverage-v8をコード計画承認後に追加し、src／appの全TS/TSXを計測、tests／Next生成物／公式runtime以外を隠さずlines>=80を強制する。Docker変更時はcompose構文・起動・health・実DB試験・終了を確認する。文書／純粋な設定は人工Redを作らず構文・差分・適切な実行確認を計画に示す。

CIは本番DB URL、Supabase service_role、実Auth password、実OpenAI秘密情報を持たない。テストはdummy providersのみ。build中に実DB/Auth接続や認証操作を要求しない。ローカル／CIでTLSなしの隔離DBを使う場合は試験専用境界を明示し、本番TLS設定がそれに追随して緩む実装を禁止する。

## Preview & Promotion

既存Vercelのbranch Previewを用い、ProductionのDBロール／schema・鍵をPreviewに配らない。試験ロールで本番schemaが読めないことを確認してから架空fixtureを入れる。後の本人認証確認は管理側で用意した本人Authで行い、dummy生成は承認済みprovider切替を利用する。実LLMを自動呼出ししない。

100企業／1000メモ／10,000操作、本文配分とWeb各4、1社50メモ、2クライアント、warm-up5回＋各50回でp95／最大／失敗を同SHAの記録へ残す。cold start／初回Auth／休止復旧は別欄。PC・スマホの受入は手動、秘密や個人メモを証拠へ入れない。未達なら承認目標を下げず修正する。

本番DB migrationは本人管理のbackup後に、コード計画に固定した手順で適用する。既存本番との互換を先に確認し、不可逆なschema変更や既存データ移行を自動採用しない。migration資格情報をverify CIや通常アプリへ付与しない。テストschemaを本番へコピーしてリリースする方法は取らない。

## Rollout & Rollback

人間がCI成功後にmainへmergeすると既存Vercel integrationが自動公開する。新blue-green／canary制御・feature flag製品・手動第二deployを増設しない。新migrationと旧アプリの互換を確認し、必要なserver設定が欠けた公開を成功として扱わない。

実merge SHA・deployment URL／状態、ページ、health、本人ログイン→企業→手入力メモ→別端末再取得→状態／社数→編集／競合→比較／出力→確認削除→logoutを架空データで確認する。U2生成／復習はPreview dummyで全導線、公開実providerは実費を伴うため必要な本人許可を確認し、未実施を合格にしない。

失敗時は現在releaseを修正・再検証し、次Boltへ進めない。アプリrollbackは人間が承認するrevert PRと再deployment。データ復元が必要なら本人backup・schema版・所有者と成功operationを含む一貫復元を先に架空DBで検証し、人間が判断する。操作履歴を除いた復元、削除後IDの再利用、Auth UUIDの勝手な付替えは禁止。固定RTOや自動復元成功は約束しない。

## Deferred Human Actions

現在、本人にしかできないログイン・秘密設定とコード計画の人間承認を後回しにして計画を具体化している。これは実装開始条件や承認を代行する意味ではない。導入PR100の実mergeSHA／Vercel成功は確認済みだがページ／health／基本操作は未確認（../../../verification/bolt-001-prerequisites.md）。専用Authは0人、公開登録無効化・DB／鍵／接続・Preview隔離設定は未確認。設定手順と未達条件をコード計画へ引き継ぐ。

## Sources

- ../../../inception/delivery-planning/bolt-plan.md — release番号、承認済み検査・coverage・TDD・公開受入。
- ../../../inception/units-generation/unit-of-work.md、unit-of-work-dependency.md — U1→U2→U3、単一release。
- ../nfr-design/observability-design.md、reliability-design.md、logical-components.md — OD2/RD3と共通配置。
- infrastructure-specification.md、monitoring-design.md、infrastructure-design-questions.md — 接続／準備／計測、本人回答。
- 既存.github/workflows/ci.yml、package.json、vitest.config.ts — 現状のverify、Node22、未追加のcoverage／SQL service（2026-10-15読取）。
- [Supabase backup](https://supabase.com/docs/guides/platform/backups) — Freeの手動backup手順を確認（2026-10-15）。

