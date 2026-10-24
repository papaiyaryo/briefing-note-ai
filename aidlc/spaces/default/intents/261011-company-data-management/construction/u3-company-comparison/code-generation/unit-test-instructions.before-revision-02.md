# U3 — 比較のUnit試験手順

## Scope and Preconditions

本Unitだけのexact commandsを記載する。Node22.23.3、既存npm依存/Vitest4.1.8、node環境、dummy providers/Auth、使い捨てlocalhost PG17を使用。実キー/実Supabase不要。環境の具体的な準備、全体品質検査、実画面確認は[承認対象コード計画](code-generation-plan.md)のStep1/2/15〜18を参照する。

初回Red前にreadiness.test.tsを作り、下のrunner確認を成功させる。ファイルがまだない段階の0件/収集不能/DB setup失敗をRedとしない。code-generationの承認前にはテストを作らず、今は全コマンド未実行。既存Vitest設定/include/lines>=80をそのまま使い、runnerや新依存を追加しない。

## Test Files and Minimum Cases

| Exact file | 最低件数 | 主な受入境界 |
|---|---:|---|
| tests/u3-company-comparison/readiness.test.ts | 1 | 既存7キーの読み込み・runner成立。app Redではない |
| tests/u3-company-comparison/model.test.ts | 12 | 1社1メモ/順序/0〜21、7観点/未記載/要確認、同名別ID、Web全metadata/出自/安全Markdown/表示対応 |
| tests/u3-company-comparison/session.test.ts | 12 | owner/選択/input/要求世代、browser instance隔離/SSR非共有、dirty/取消、route/remountでもdraft/pending/commit保持、別owner遅延拒否 |
| tests/u3-company-comparison/client.test.ts | 16 | C4要求/応答runtime検証、全selected整合、no-store/401/Origin/404、期限とGET限定再試行、readPOST失敗はunknownでなくread-error |
| tests/u3-company-comparison/edits.test.ts | 16 | 別欄/別版/changes限定、連打/同body-ID、commit後GET失敗、unknown照会/再試行、latest別保持/明示rebase、追加入力と往復保持 |
| tests/u3-company-comparison/export.test.ts | 12 | 毎クリック全版/全世代確認、同snapshot出力、dirty/pending阻止、版変更/削除/401/不正/timeout/途中入力でfile0、無関係snapshot差の誤拒否なし |
| tests/u3-company-comparison/legacy.test.ts | 8 | 正常形式/fallback ID/旧日付/既存編集/出力、明示読取、不正混在/読取不能/0、非破壊/非移行/非送信 |
| tests/u3-company-comparison/ui.test.ts | 16 | 新/旧入口・候補page・構造なし・選択/7観点、独立保存/復旧/失効/dirty取消、remount契約、PC/mobile・label/status/focus契約 |
| tests/u3-company-comparison/comparison.integration.test.ts | 10 | U3 client→既存U1 C4 handler/service/実PG adapter、本人分離/所属/一貫参照、欄限定更新/再取得、旧版拒否、COMMIT応答途絶/同要求照会、変更/削除の出力阻止 |

合計最低103件。Standardの部品ごとの基礎正常/少なくとも2異常境界を含み、不足なら既基準を維持して増やす。UI callback/SSRはDOM/実browser合格の代用ではない。integrationのhandler呼出しは実TCPを通るHTTP計測と分け、後者は手順helperで実施する。

## Exact Unit Commands

### Runner readiness — Step 2

```text
npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false
```

1file/1test成功・skip0・exit0を確認してから最初のRedへ進む。依存やDB準備が失敗なら準備失敗として記録する。

### Model / legacy — Steps 3〜5

```text
npm test -- tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/legacy.test.ts --passWithNoTests=false
```

### C4 consumer / real PG — Steps 6〜8

```text
npm test -- tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

U1 helpers/fixturesを再利用し、専用random schema・架空本人2名・既存migration/権限を用意する。localhost/workspace_test以外へ接続しない。finallyで専用schema/clientだけをcleanup。別owner fixtureに同じsession hashを流用しない。U3未実装によるRedと既存APIの初回Greenを分ける。

### State / edits / export — Steps 9〜11

```text
npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts --passWithNoTests=false
```

### UI — Steps 12〜14

```text
npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false
```

既存hookHarnessを再利用してよいが、本Unit fixture/contextを用意し、既存U1/U2 helperは変更しない。実ブラウザ/keyboard/native zoomはコード計画M9/10で別に確認する。

### U3 all

```text
npm test -- tests/u3-company-comparison/readiness.test.ts tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts tests/u3-company-comparison/legacy.test.ts tests/u3-company-comparison/ui.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

全体品質・既存回帰・coverageのコマンドはコード計画Step17にだけ記載する。上記はU3の各exact fileだけを指定し、広いglobやプロジェクト全体をUnit検査へ重ねない。

## Mocking and Data

fake fetch/clock、Fileやdownload spy、既存hookHarnessを使い、private contentをログしない。fixtureは本文/構造/OCR/イベント/Webに別の架空値を置く。origin/providerと企業名が異なる例、null/undecided、supplement全metadata、危険HTML/URL、補助文字code points/UTF-8 bytes、20選択/21拒否、50メモを含める。生成・外部Webを実行しない。

状態試験は実体storeを再利用して画面を再mountし、リクエスト回数/operationId/body/結果/draftを観察する。見た目が同じというassertionだけで往復重複を見逃さない。競合はbase/draft/latestを別々に確認する。snapshotVersionだけとselected全company/memo版を区別する。

## Coverage and Evidence

既存全app/src lines80%以上、include/threshold不変。fakeだけでDB原子性・実画面・性能/本番を認定しない。実行したcommand/exit/件数・AC/BR/NFR・Red原因/Green/Refactor・実fixture/cleanupをcode-generationのtdd-evidence.mdとverification-results.mdへ残す。手動結果はmanual-evidence.mdに種類と未達を分ける。

assertionを弱めず、期待未達をskipやtodoで成功化しない。無関係なsetup failureはRedから除外する。U1/U2既知不備を本Unitで解消したと書かず、実Auth/CI/公開未実施を保持する。

## Sources

- [コード計画](code-generation-plan.md)、[機能設計のAC対応](../functional-design/traceability.json)、[NFR要件対応](../nfr-requirements/traceability.json)、[NFR具体策](../nfr-design/traceability.json)。
- [共有契約](../../../inception/contract-design/contract-summary.md)、[承認済み検証条件](../../../inception/delivery-planning/bolt-plan.md)。
