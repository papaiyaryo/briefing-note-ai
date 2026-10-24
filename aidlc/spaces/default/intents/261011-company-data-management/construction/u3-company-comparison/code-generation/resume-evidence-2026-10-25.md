# U3 revision02 — 再開時の照合と限定CUA停止

## 既存証拠の回収

bugfix-evidence-revision-02.md、verification-revision-02.md、manual-revision-02-root.md、code-summary.md、self-check-revision-02-root.mdを読取照合した。runner/baseline、Red→Green→Refactor、新規20件、U3 139件、全体635件、lines85.95%、lint/typecheck/build成功は前回の実行証拠。今回はアプリ/試験/設定変更0、成功済みコマンドの再実行0であり、新しい品質検査成功とは称さない。

## 追加CUA run

computer-use skillとCUA文書を読み、既存 `node scripts/local-workspace-preview.mjs` を無変更で使用。Node22.23.3、Next15.5.19、300000ms TTL。専用schema `u1_preview_3ba1f8e408e74ae581e985b6da3b7a51`、helper40492/Next51560、exec94889。

初回タブ作成はnavigate timeout。Next Ready/compile後の再作成で本人ログイン画面へ到達した。作成タブ1632700615で架空メール欄を入力後、パスワード操作が `Debugger unattached` で失敗し、続く状態観測も同原因で失敗。AGENTS.mdの同一原因2回停止に従い3回目を試さず、別制御技術へ切り替えなかった。ログイン成功・企業/メモ作成・比較・M-R1〜5の追加成功は0。既存部分観測と残条件を維持する。

stdin stopはstdin closedのため送信不能。TTL終了はexit1、dedicatedSchemaDropped:true、dedicatedPreviewStopConfirmed:false。その後read-only `Get-Process -Id 40492,51560 -ErrorAction SilentlyContinue` は該当PIDなし（exit1、出力0）。schema削除と既知2PID消失は確認したが、helper停止失敗を成功へ置換せず、子孫全停止および作成タブ閉鎖は未確認としてrootへ引き継ぐ。既存server/DB volume/他者worktreeを停止・削除していない。

## 保存hashと現在bytes

read-only照合でU3保存fingerprint29件のうち現在と異なるものは以下3件。今回担当8ファイルは全て保存hashと一致。既存fingerprintの過去aggregateを現在全bytes一致の証拠へ流用しない。

- app/layout.tsx
- app/compare/page.tsx
- src/components/compare/CompanyComparePage.tsx

U1保存fingerprint96件との差分23件は以下。先行記録が共有変更より古い可能性があり、無断変更と判定せず、修正/復元/再固定を行わない。

- .env.example
- app/api/interview-review/route.ts
- app/api/ocr/route.ts
- app/api/structure/route.ts
- app/api/web-supplement/route.ts
- app/compare/page.tsx
- app/globals.css
- app/page.tsx
- eslint.config.mjs
- next.config.ts
- package.json
- src/lib/interviewReviewClient.ts
- src/lib/ocrClient.ts
- src/lib/structureClient.ts
- src/lib/webSupplementClient.ts
- tests/ocrRoute.test.ts
- tests/u1-company-notes/helpers.ts
- tests/u1-company-notes/restore.integration.test.ts
- tests/u1-company-notes/runtimeFixture.ts
- tests/u1-company-notes/uiCallbacks.tsx
- tests/webSupplementRoute.test.ts
- tsconfig.json
- vitest.config.ts

U2はfilesではなくhashes形式のため初回共通検査がTypeError終了。U2現在bytesは今回未検証。前回mismatch0を今回の結果へ流用しない。U3単独再照合はexit0。これは検査スクリプトの形式不一致でありTDD Redではない。

## Step5 handoff

累積source-manifest.jsonの29件/削除0を保持し、8件だけへ縮小しない。traceabilityの90AC/17BR/30NFR、U3担当35AC/他Unit55AC、全Deferredを維持。Step1〜8/10の過去完了を回収、Step9未完、Step11の追加証拠と引継ぎを記録した。正式review/lifecycle/report/state、risk acceptance、Unit完了は代行しない。R-03、実B/Auth/Supabase/外部API/CI/Vercel/公開、U2画面未達は持越す。
