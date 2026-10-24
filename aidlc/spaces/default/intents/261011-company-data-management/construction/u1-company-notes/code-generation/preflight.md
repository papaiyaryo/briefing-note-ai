# U1：実装開始前の確認記録

## Revision 1 Continuation

以下の初版記録は当時の結果として残す。本人の方針変更と改訂1の公式承認により、実Supabase/Auth/鍵/Preview隔離および前Bolt公開受入はローカル実装の待機条件ではなくなった。Vercelは本人担当。改訂1の公式brief全文とTDD Testing Contractに従う。

2026-10-15、Dockerの昇格read-only照会でclient/server接続成功、作業領域内のnpm cacheを用いてNode22.23.3を準備した。global設定は変更していない。git fetch成功後、origin/main=df63c09be502bf5c9e50b58a69e2bacea5c39bc5を基点にrelease/bolt-002-company-data-management-localを作成・checkoutした。既存のrelease/bolt-002-company-data-managementは別clean worktreeで使用中のため保持し、同じBolt002の専用作業branchとして末尾localを使用する。dirty/untrackedを維持し、既存worktreeは変更していない。rootが公式nextで同じU1・20ステップ・approvedの継続を確認後、実装準備を開始した。

## Result

2026-10-15確認。公式directiveはCode Generation Plan Approvalを`approved`としている。承認済み計画と試験手順の本文は変更していない。計画にあるStart Conditionsは未達のため、U1のアプリ実装・SQL・依存追加には進んでいない。Step 1は着手条件照合まで、Step 2は既存runnerの読取・実行確認までで、いずれも完了チェックを付けていない。

本書は準備確認の証拠であり、コード生成完了、TDDのRed、Unit受入、公開受入の証拠ではない。code-summary.md、traceability.json、source-manifest.jsonを完成品として作成していない。

## Start Conditions

| 条件 | 確認結果 | 再開に必要なこと |
|---|---|---|
| 計画承認 | 現行directiveに実承認済みと明記。計画内の提示前の現状説明を承認記録の代替にしない | 同一計画・同一attemptの公式directiveに従う |
| 導入Boltの公開受入 | rootによる最新確認では公開ページとhealthともHTTP 429、Vercel Security CheckpointのHTML。期待health JSONと既存基本操作は未確認 | 正規のアクセス方法で対象merge SHAのページ・health・承認済み基本操作を確認。保護を迂回・無効化しない |
| 専用Supabase | 東京・PostgreSQL17.11・作成済みは本人回答。実接続によるDB版・Free利用枠・pooler/TLS/権限は未確認 | 本人の管理画面確認、承認済み接続・最小権限・隔離条件の実検証 |
| 本人Auth・公開登録 | 本人Authユーザー0人、公開登録停止・匿名ログイン停止は未確認という既存回答を維持 | 管理側で本人ユーザーを作成・確認し、公開登録と匿名ログインを停止。本人ログインと登録拒否を確認 |
| 環境設定・Preview隔離 | 以下の存在確認ではローカルの接続・鍵等を準備済みとする根拠なし。Vercel側の実設定は未確認 | 本人が未追跡設定と環境管理画面へ登録。環境別schema/role/session/鍵/Origin、試験roleから本番拒否を確認 |
| Node・DB試験 | 現在Node24.11.0、CI設定はNode22。Node22でのrunner/buildとPostgreSQL17の実試験は未確認 | Node22と使い捨てPostgreSQL17を利用可能にする。環境失敗をRedやDB合格にしない |
| Git | 導入release branchに既存dirty差分がある。新release branchは未準備 | 開始条件を満たしてから、最新mainとdirty差分を再照合して専用branchを安全に準備 |

公開確認の正本は`../../../verification/bolt-001-prerequisites.md`。本書で公開成功を追加認定しない。本人の認証が必要な操作は後回しとする既存指示を維持する。

## Read-only Environment Evidence

秘密値を読み出さず、Node標準APIで存在だけを調べた。

- ルート直下の環境ファイル名は`.env.example`のみ。実値を含むファイルは作成していない。
- 確認したprocess環境変数`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`DATABASE_URL`、`SUPABASE_DB_URL`、`SESSION_ENCRYPTION_KEY`、`GENERATION_RECEIPT_KEY`、`APP_ORIGIN`、`TEST_DATABASE_URL`はすべて存在しなかった。この名前一覧は確認対象であり、将来実装の正式な設定名の決定ではない。
- `node_modules`は存在。`supabase/config.toml`、`compose.test.yml`、`tests/u1-company-notes`、`db/migrations/001-company-workspace.sql`は存在しなかった。
- Docker APIとユーザー設定へのアクセス拒否はdispatch briefの既確認事項。今回Docker設定変更、権限変更、実Supabase管理操作は行っていない。Docker稼働成功は未確認。
- `package.json`、`vitest.config.ts`、既存CI、`tests/sample.test.ts`、承認済み計画・試験手順、配置設計・技術前提・外部依存計画を照合した。開始条件により停止したため、実装に先立つ全設計・共有CodeKB・変更対象ソースの詳細再読と影響分析は再開時に行う。

## Runner Readiness

承認済みのexact commandをそのまま実行した。

```text
npm test -- tests/sample.test.ts --passWithNoTests=false
```

結果はexit 1。現行npm scriptが`vitest run --passWithNoTests`のため、実引数は次のようになる。

```text
vitest run --passWithNoTests tests/sample.test.ts --passWithNoTests=false
Error: Expected a single value for option "--passWithNoTests", received [true, false]
Node.js v24.11.0
```

Vitestの引数処理で収集前に拒否された。試験件数・pass/fail件数・coverageは得られていない。未実装振る舞いによる失敗ではなく、runner準備不備である。

再開時の具体的修正案は、承認済みStep 2のpackage/test設定整備でnpm test scriptの既定`--passWithNoTests`を外し、上記exact commandと公式checkpointコマンドを維持すること。この修正は未実行。検証コマンドや承認計画の変更を必要とする理由にはしていない。runnerが成立してから各レイヤーのRedへ進む。

## Git Evidence and Preservation

```text
current branch: release/bolt-001-aidlc-adoption
HEAD: 8e528e2f983479805e27f601dbd4683dade323e0
local origin/main: df63c09be502bf5c9e50b58a69e2bacea5c39bc5
planned branch: release/bolt-002-company-data-management
```

`git status --short --branch`では既存変更として`.gitignore`、`aidlc/spaces/default/memory/project.md`、`aidlc/spaces/default/memory/team.md`、`docs/status-2026-10.md`、未追跡の共有CodeKB・Intent・`docs/session-handoff.md`・`index.html`を確認した。他者の変更を維持している。

`git diff --name-only HEAD origin/main`は`app/layout.tsx`、`package-lock.json`、`package.json`を返した。今回の実装は手元HEADのまま始めず、main上のこれらの変更を再開時に取り込む必要がある。ローカルorigin/mainで上記未追跡パス群を`git ls-tree`確認した範囲には既存tracked pathはなかったが、実際のbranch切替成功や最新remoteとの無競合を証明するものではない。

branch作成・切替、fetch、stash、reset、clean、commit、push、mergeは実施していない。開始条件未達のためStep 1完了とはしていない。

## Next Steps

1. rootが本書の未達条件を本人へ引き継ぎ、必要なら公式pauseを記録する。U1のcompleteやBuild and Testへ進めない。
2. 本人の認証操作と導入Bolt公開受入を完了し、秘密を含まない完了有無と検証結果を記録する。接続文字列・鍵・メール・tokenを会話やIntentへ貼らない。
3. 公式再開後、現行directive、全U1設計・共有契約・CodeKBと最新mainのソースを読み、dirty差分を保持してStep 1を完了する。
4. Step 2で承認済み固定依存・試験設定を準備し、scriptの重複引数を解消する。Node22でexact readinessを再実行し、実PostgreSQL17のhealth・使い捨て・隔離を確認する。
5. すべての着手条件とrunner成立後、計画どおりStep 3からRed → Green → Refactorを直列実行する。

## Revision 1 continuation — 2026-10-16

上の開始条件未達・待機・未実行は初版時点の履歴。本人が改訂1を公式承認し、最新directiveのplan_approval.status=approvedをrootが確認したため、実Supabase/Auth/鍵・導入Bolt公開待ちは現在のローカル実装条件ではない。Vercelは本人担当。外部未確認を成功へ書き換えず、dummy Auth/provider＋実PostgreSQL17で承認済み20ステップを継続している。

既存release branchとclean worktreeを保持し、最新origin/main `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`を基点にroot checkoutの`release/bolt-002-company-data-management-local`を使用した。同名既存branchを上書きしないための同じBolt002専用branchで、namespace・番号・1 PR・人間merge方針は維持。rootはsource移動後の公式continuationを確認済み。既存dirty/untrackedとroot所有のhandoff/verificationは保持する。

Node22.23.3、固定依存、既定passWithNoTests重複除去後のexact readinessとbaselineはexit0。使い捨てPostgreSQL17.6、実migration、非特権app roleでTDDを実行し、環境エラーをRedやskip成功にしていない。実際の修正と検証の詳細はtdd-evidence.mdを参照する。最新全suiteは332tests成功・全アプリlines82.38%、typecheck/lint/buildはexit0。追加の手動ACと最終自己レビュー・成果物確定は進行中で、Unit完了や公開受入を認定していない。

ローカルpreviewの実行停止を受け、専用Next/Edge/schemaだけを確認・終了した。以後は5分寿命と明示cleanupを持つ短時間previewとし、実行中にbuildを重ねない。guard/lock/state/承認receiptは変更していない。外部秘密の要求・実Supabase操作・Vercel操作・commit/push/mergeは行っていない。

最終値：lint/typecheck/npm test/buildすべてexit0、36files/336tests成功、skip0、全アプリlines82.48%。実EdgeのTab/Shift+Tab/Escape/h1を含む確認、架空pg_dump/pg_restore、容量/2clients参考計測も完了。Step5成果物は94source pathsと146trace rowsを構造/実在/リンク/所有差分検証済み。専用preview/Edge/復元資源はcleanupし、試験PostgreSQLだけ後続検証用にhealthyで保持。正式レビュー・checkpointはrootへ返却し、実Supabase・公開受入・GitHub CI実行は未確認のまま区別する。
