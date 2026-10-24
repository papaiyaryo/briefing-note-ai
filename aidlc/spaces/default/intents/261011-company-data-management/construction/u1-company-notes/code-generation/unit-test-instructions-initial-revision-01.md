# U1：単体・結合・手動試験手順

## Scope and Setup

対象はu1-company-notesのみ。全体コマンドを各Unitで重複実行せず、release全体／checkpointはcode-generation-plan.mdを参照。

Vitest4.1.8、node環境、SSR静的表示・pure関数／API fakeを利用。Node22、exact依存／同版coverage、使い捨てPostgreSQL17・実migration／試験Auth bootstrapを準備してからRed。実Supabase APIキー・本人ユーザー・実接続はローカル・CI試験に不要で後日設定する。

Step2でnpm test scriptの既定--passWithNoTestsを除き、下記exact commandを維持。収集前の引数エラー・Docker／DB不備はRedとせず、DB試験skip／fake置換で合格にしない。Vercelの接続・deploy・公開確認は本人担当で本手順の実行条件にしない。

## Runner Readiness

変更前にも存在するexact fileで確認する：
```text
npm test -- tests/sample.test.ts --passWithNoTests=false
```
この1fileはrunner準備確認専用で、U1受入を証明しない。新規test fileを書いた後は下の該当groupで実行可能性を確認し、その対象振る舞いの失敗をRedとして記録する。import不能が未作成対象の直接原因である場合でも、runner／依存／DBが正常と先に確認し、setup不備と混同しない。

## Exact Unit Commands

以下は全てexact file指定。新規fileの作成後に用い、対象0件は失敗。実DB接続が未設定の場合は明示失敗し、skip／fakeへ切り替えて合格しない。

| Group | Command |
|---|---|
| Model/database | npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/database.integration.test.ts --passWithNoTests=false |
| Repository/session | npm test -- tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts --passWithNoTests=false |
| Business/Auth | npm test -- tests/u1-company-notes/auth.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/board.test.ts --passWithNoTests=false |
| API | npm test -- tests/u1-company-notes/routes.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/existingRoutes.test.ts --passWithNoTests=false |
| Client/UI | npm test -- tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false |
| U1全部 | npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/board.test.ts tests/u1-company-notes/routes.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/existingRoutes.test.ts tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false |

Refactorは対応groupを再実行し、変更が触れた完了U1 groupを必要に応じて組み合わせる。実DBgroupは環境準備ができたローカル／CIで実施する。

## Data and Mock Boundaries

- 架空owner A/B UUID、企業とメモ、dummy Auth getUser／refresh／logout、dummy providers、固定clock／乱数注入を使う。実password・API鍵・個人内容を使わない。
- migrationのauth参照を試験bootstrapで用意する。normal server role／別owner／context未設定／anon／authenticatedの拒否は実PostgreSQLで確認。ORM/fake storeで原子性やRLSを合格としない。
- 同時実行は独立pg接続とbarrierで順序を作り、単なるsleepへの依存や直列mockだけで再送／削除競合を証明しない。refresh／logoutも共有storeを通す。
- 各試験はUUIDと隔離test schemaで独立化しcleanup対象を限定。本番接続・本番schemaを拒否するguardを試験bootstrapへ置く。成功操作記録は本番でTTL消去しない。
- 故障挿入はCOMMIT前、COMMIT応答途絶、lock待ち／deadline、ROLLBACK失敗、取消不能接続を区別。未知を「未保存」とassertしない。
- API fakeは外部Auth/providerだけ、DB結合試験は実adapter＋実migration。ログ取得で画像／本文／Cookie／token／email／SQL引数が入らないこともassert。
- source fixturesは空文字／null／空配列、code point（補助面文字含む）／UTF-8 bytes、最大境界と+1、実在日／不正日、危険URL／HTML、overview500の境界を含む。

## Acceptance Matrix

| Story / BR | 主な試験と期待結果 |
|---|---|
| US1 / BR1 | 401/403/404、owner分離、Auth検証、7日／24h期限、同時refresh・logout、token非公開、遅い応答破棄 |
| US2 / BR2 | 名前のみ／同名別ID、安定ID二重送信、任意null、項目限界と日付、企業志望度の独立保存 |
| US3 / BR3 | 8状態／6通常／終了再表示、保存0件／表示0件／失敗、選考日独立強調、明示状態変更とunknown |
| US4 / BR4 | active applied/screening/interviewだけ、0/4/5/14/15/16、toggle不変、16社目許可、複数memoでも1企業1社 |
| US5提供 / BR5 | 構造全項目・出典・dummy由来／署名、画像保持キー拒否、選択企業を生成名で変更しない |
| US6/US7 / BR6 | manual本文と別構造、構造追加明示、欄別保存、draft保持、旧版409、同ID異内容409、成功削除再送200、確認変更409／期限410、部分削除なし |
| US8提供 / BR8 | 1〜20社・重複なし・所属／owner一致・有効構造、一つの読取snapshot、志望度と理由別 |
| US9提供 / BR9 | 本文とDL一致、安全preview、既存認証済みprovider写像維持、health公開、U2/U3本来のUI受入はDeferred |
| BR10 / NFR | 1MiB／256KiB、pool3、15/10/8秒、有限GET retry、POST自動再送なし、容量・性能・復元 |

U1のfunctional traceabilityにある66 OK／24 Deferredを基点として実AC別証拠へ展開する。DeferredをU1の成功数へ含めず、契約供給だけを記録する。

## Manual Checks

同候補SHAのローカル開発環境、使い捨てPostgreSQL、dummy認証／生成・架空データで確認。PC／スマホ幅・keyboardを確認し、実端末の確認も実施できた範囲を記録。実Supabase・公開環境の2端末確認は本人へ後日引継ぎ、未実施を合格にしない。ローカル画面用dummy認証は明示的な開発専用設定＋loopback限定、production／非loopbackで拒否する。

| 操作 | 期待結果 |
|---|---|
| ローカルdummy本人→名前のみ登録→手入力保存→別クライアント再取得 | 同じcompanyId／memoIdと内容。実Supabase Authの本人ログイン成功とは区別 |
| 8状態を明示変更、終了表示切替、複数memo／15・16社 | 6通常列と終了再表示、文字警告、正確な社数、登録非制限 |
| 次の選考日あり／なし／締切を入力、長い名前・本文 | 選考日を独立強調、未設定と締切別、折返し、全列・詳細に到達 |
| 登録／編集dialog、Tab／Shift+Tab／Escape、dirty移動／戻る | label・focus循環／元controlへ復帰、破棄取消で入力保持 |
| 本文だけ／構造だけ／理由だけ保存、manual構造追加 | 指定正本だけ更新、本人記入・明示保存、origin維持 |
| 別端末で編集後に旧版保存、commit応答途絶 | 409と入力保持、unknown結果照合、同じ固定要求の明示再送、成功は確定後 |
| メモ単体／全企業削除確認、確認後メモ編集・追加 | 正確な対象・件数、変更後は再確認、取消無変更、部分削除なし |
| 危険文字／URL、本文preview／DL、既存生成／旧比較入口 | HTML実行なし、本文とDL一致、旧保存を変更しない、認証後に既存導線維持 |
| logout後の戻る／旧応答／直接API | 保護内容非表示・401、別端末sessionを勝手に終了しない |

## Quality and Completion

計画80件以上、各対象happy path＋2エラー／端条件。全アプリline coverage>=80はrelease全suiteで強制し、U1だけの計測や除外拡大で合格にしない。ここに全体coverageコマンドは重複記載しない。

性能・容量は既存fixture／同SHA／2クライアント／warm-up5＋各50でローカル実DBの参考値を記録。外部p95目標達成をローカル値から推定せず本人の後日確認へ引き継ぐ。backup復元は使い捨て実DBで内容・owner・ID・版・成功operation・schema版を照合。実接続・公開確認は未実施なら合格にせず、ローカル実装・試験の待機条件にもしない。

各Red／Green／Refactorのexact command、exit、原因／結果、対象AC、対象SHAを公式Unit記録へ残す。テスト出力へ本文・token・鍵を不必要に転載しない。Build and Testで既存＋全Unit・公開前の品質を確認する。

## Sources

code-generation-plan.md、../functional-design/traceability.jsonとrules.md、../nfr-design/observability-design.md、../infrastructure-design/cicd-pipeline.md、../../../inception/delivery-planning/bolt-plan.md、../../../inception/user-stories/stories.md。


