# U1：企業・保存メモ管理の実装結果

## 実装結果

改訂1の承認済み20ステップとTesting Contract `a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440`に従い、U1のアプリ・試験・設定・手順を実装し、ローカル検証を完了した。U2/U3、実Supabase、本番公開の完了ではない。

作業branchは `release/bolt-002-company-data-management-local`、baseは `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。既存同名release branchとclean worktreeを保持するための非破壊のbranch名調整で、同じBolt002・1 PR・人間mergeを維持した。commit/push/mergeはしていない。

対象94ファイルの作業tree fingerprintは `sha256:5d814912e29c2801c0b77754d9f145709017944c72ba4233bc865175db4a589a`。各pathをsortし、`path + NUL + SHA256(file bytes) + LF`を順にSHA256した値であり、commit SHAではない。

## 作成・変更したファイル

実際の全pathは[ source-manifest.json ](source-manifest.json)のstrict `writes[{path}]`で対象にした。91 claimsを展開した対象は94ファイル（created 73、modified 21、deleted 0）。Next動的routeの3つの親directoryをUnit所有範囲としてclaimし、その配下の実ファイルもすべて対象とする。build cache・一時browser profile・生成試験reportはアプリソースとして列挙しない。

| 区分 | ファイル・責務 |
|---|---|
| Created | `src/lib/workspace/`：C1〜C4型・strict入力・8状態集計・owner-bound draft・固定要求client |
| Created | `src/lib/server/auth/`：本人検証、opaque Cookie、暗号化token、refresh/logout共有排他 |
| Created | `src/lib/server/workspace/`：実pg adapter、永続operations、版/所有者/削除snapshot、service、HTTP、fail-closed runtime |
| Created | `src/components/workspace/`、`app/companies/[companyId]/page.tsx`：共通認証入口、企業ボード/詳細、項目別編集、手入力メモ、dialog |
| Created | `app/api/v1/`：認証3入口とC4のboard/company/memo/削除確認/削除/operations/comparison-sources |
| Created | `db/migrations/001-company-workspace.sql`、`compose.test.yml`、`tests/u1-company-notes/`：RLS/FK/限定session関数、隔離PG17、TDD・競合/故障/実DB・SSR/callback試験 |
| Created | `scripts/local-workspace-preview.mjs`、`workspace-browser-check.mjs`、`workspace-restore-check.mjs`：所有資源だけの短時間preview、既存Edge確認、架空backup/restore |
| Created | `docs/company-data-setup.md`：後で埋めるserver設定、取得場所、本人Auth、鍵更新、backup/復旧、本人の実接続/公開確認 |
| Modified | `.env.example`、`.github/workflows/ci.yml`、package/lock、vitest/eslint/tsconfig、`next.config.ts`、`app/globals.css` |
| Modified | 既存4provider route/client、`app/page.tsx`、`app/compare/page.tsx`、既存OCR/Web route試験：本人境界とOrigin/no-storeを接続しprovider契約を維持 |

root所有のhandoff/verification、既存の.gitignore・memory・status・CodeKB・index.htmlは自分の変更と混同せず保持した。承認済みplan/test instructionsの本文を変更せず、実完了checkboxだけを更新する。

## 主な実装判断

- 外部資格情報なしのdummy Auth/provider＋実PostgreSQL17を使用。本番・非loopbackでdummy/local設定を拒否し、設定不足は503。APIキーだけでDB接続を代替せず、server用の空欄設定を用意した。
- 正本5表、複合所有者FK、FORCE RLS、非公開schema、通常roleと限定session関数を採用。pool最大3、要求10秒/transaction8秒と残予算、取消/接続破棄、COMMIT不明を実試験した。
- operationIdと正規化hash、対象変更と成功記録の原子確定、削除後ID予約、企業項目版と子集合版、10分確認snapshotを分離。成功履歴は対象削除やTTLから独立。
- AES-256-GCMのAAD/nonce/tag、別HMAC鍵の出自検証、鍵rotationを実装。公開Auth欄はpublishable/旧anonのみでsecret/service_roleを拒否。
- 本文・構造・原文/出典・Web・企業志望度/メモ理由を分離。構造追加は本人の明示操作だけ。構造256KiBはcompact JSONのbyteとしてDBも同じ境界に合わせた。
- 書込は自動再送せず、unknown時は固定要求を保持してGET確認後に同一要求を明示再試行。別タブの未保存入力や送信中追加入力を保持し、401/対象切替後の古い応答を無効化。
- modal内にunknown照会を表示し、保存確定後GET失敗でも確定を消さない。登録は名前初期focus、Tab/Shift+Tab wrap、Escape取消・起動元focus、詳細h1は初回/会社切替だけfocus。
- Tailwind走査はapp/srcだけへ明示し、一時profile/cache/記録を除外。実行停止とcompile反復の因果を断定せず、previewは確認時だけ・5分寿命・専用Next/Edge/schema cleanupを検証した。

## 検証結果

Node22.23.3、dummy providers、実PostgreSQL17.6-alpineで実行。実外部API秘密なし。

| 必須確認 | 結果 |
|---|---|
| `npm run lint` | exit0、warning0 |
| `npm run typecheck` | exit0 |
| `npm test` | exit0、36files/336tests成功、skip0 |
| `npm test -- --passWithNoTests=false --coverage` | exit0、同336tests、全アプリlines82.48%（1869/2266） |
| `npm run build` | exit0、実秘密なし、全route生成成功 |
| Docker Compose | config確認exit0、PG17.6 healthy、loopback限定、tmpfs |
| CI設定 | 既存js-yamlでparse exit0。Node22/PG17 service/実migration試験/同じcoverage下限を接続 |
| diff | `git diff --check` exit0。改行のGit警告はあるが空白エラーなし |

coverageはinclude `src/**/*.{ts,tsx}` と `app/**/*.{ts,tsx}`、lines80%下限を維持。statements80.78%、functions78.97%、branches69.76%。他指標も80%達成したとは扱わない。U1 exact15filesは233tests（Model35/Repository18/Business70/API46/ClientUI64）、既存103testsを保持。GitHub CI自体はまだ実行していない。

TDDの各Red/Green/Refactor、runner不備・試験側の誤呼出等をRedから除いた根拠は[tdd-evidence.md](tdd-evidence.md)に記録。SSR/callbackはDOM・focus・browser受入の証拠と区別した。自己レビューで期限、旧service_role、draft、unknown表示、JSON byte境界、focus/keyboardを補修し最終回帰を行った。

## ローカル画面・復元・参考計測

既存Edge/CDPで全フロー13項目がexit0。ログイン、企業名のみ登録、初期focus、Tab循環、Escape/起動元focus、詳細h1、idle3秒API追加0、手入力保存、HTML非実行、危険操作cancel初期focus、dirty取消、390px表示を確認。別の短いkeyboard-only実行は6項目exit0でShift+Tabも確認。専用preview/Edge/schemaは全て停止・削除しexit0を確認した。実タッチ端末・2実端末・外部provider・公開受入は未確認。

PostgreSQL17のpg_dump custom→専用隔離DBへのpg_restoreはexit0。企業1/メモ1/成功operation1/session1（削除snapshot0）のdata fingerprintとschema fingerprint一致、復元後RLSは本人1/別本人0。専用DB/schema/dump cleanupもexit0。実運用backupや有効な実session復旧の保証ではない。

容量fixtureは100社/1000メモ/10000operations。warm-up5回後、2clients各50回のlocal adapter参考値は全失敗0。記録回収したp95/最大(ms)はboard58.49/138.40、detail24.16/29.98、page30.44/42.38、operation23.62/30.65、50メモ企業削除（作成/確認の準備込み）183.79/201.56。同時suite等のあるローカル条件であり外部API p95ではない。local DB全体14,737,935bytes、専用schema（表/索引等）3,366,912bytesを観測。実Supabase容量/Free枠は後日確認。

## 対応表と残る確認

[traceability.json](traceability.json)に90AC（U1 66/U2・U3 Deferred24）、23BR、33詳細NFRを列挙。各OKのtargetは実在する単一workspace-relative file。外部公開受入NFR6.2、外部p95 NFR7.1、実Free枠NFR7.4はDeferredとして本人手順へ引き継ぐ。OKは実装/ローカル根拠への対応であり外部未確認の成功ではない。

本番依存auditはhigh5/critical1の6対象でexit1。Next15.5.19、sharp0.34.5、postcss8.4.31、nanoid3.3.12、source-map-js1.2.1、@vercel/analytics2.0.1はいずれもbaseと同版。今回追加のSupabase/pg/coverageはこのreportの対象にない。Windows serverやImage Optimization等に関する既存Next重大advisoryを未対処のリスクとして引き継ぐ。forced fixや承認外upgradeは行っていない。

実Supabaseの本人作成・公開登録停止・実role/schema/TLS/pooler・鍵設定、実接続/2端末/外部性能、Vercel設定・deploy・実merge SHAの公開受入は本人担当で未実施。U2の生成保存/出自発行、U3の新比較UIは未実装。PostgreSQL試験serviceは後続検証用にhealthyで保持し、専用preview/Edge/復元資源は片付けた。


