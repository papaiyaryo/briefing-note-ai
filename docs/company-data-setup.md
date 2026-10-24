# 企業・保存メモの設定と引継ぎ

U1は本人だけが利用する企業・メモ保存、認証、所有者境界を実装する。ローカル・CIは架空Auth/providerと実PostgreSQL17で確認する。実Supabase接続・実本人ログイン・外部性能・本番公開は未確認。Vercel設定・deploy・公開確認は本人が担当する。

## 後で記入する設定

`.env.example`を参照し、実値はGit管理外のサーバー環境へ記入する。秘密値を製品画面へ入力する機能はない。設定不足の保護APIは503となり、認証なしやdummy成功へ切り替わらない。buildに実DB・実キーは不要。

1. 専用SupabaseのProject Settingsからproject URLとpublishable key（旧anon可）を取得する。secret/service_roleは通常処理に使用しない。
2. Authで本人を作成してUUIDを`WORKSPACE_ALLOWED_USER_ID`へ設定し、公開登録・匿名ログインを停止する。本人以外は検証済みJWTでも拒否する。
3. SQL管理者で`db/migrations/001-company-workspace.sql`の`__SCHEMA__`と`__APP_ROLE__`を専用の識別子へ置換し実行する。通常roleは管理者・schema owner・SUPERUSER・BYPASSRLSにしない。試験bootstrapは実環境へ適用しない。企業/メモは非公開schemaと所有者RLS、sessionsは限定SQL関数を通す。
4. 通常roleのDB接続文字列、専用schema、project提供CA、許可Originを設定する。TLS検証は無効化しない。接続文字列のssl queryではなく`WORKSPACE_DATABASE_CA`へPEMを設定する（改行または`\n`）。poolは各process最大3、名前付きprepared statementに依存しない。実pooler・PostgreSQL版・role権限とFree枠は本人が確認する。
5. `WORKSPACE_TOKEN_KEYS`と`WORKSPACE_RECEIPT_KEYS`へそれぞれ独立した32-byte暗号乱数鍵をbase64で設定する。形式は`.env.example`の説明を参照する。公開設定/ログ/Gitへ置かない。

session鍵の更新は新しいkey IDをactiveにして旧鍵を読取用に保持する。利用時に再暗号化する。旧参照ゼロまたは該当session終了を確認して旧鍵を除去する。出自署名鍵は別ringで更新し、必要な旧生成receiptの検証期間を保持する。緊急時は該当sessionを失効し企業データを消さない。

## ローカル・CI

Node22とDocker Composeを用いる。`docker compose -f compose.test.yml up -d --wait`でloopbackだけの使い捨てPostgreSQL17を起動する。`npm ci`後、`npm run lint`、`npm run typecheck`、`npm test -- --passWithNoTests=false --coverage`、`npm run build`を実行する。全アプリlines80%以上を維持する。各suiteは実migrationと独立schemaを作り、終了時に自分のschemaだけを削除する。実外部API/秘密は使わない。

画面確認用`node scripts/local-workspace-preview.mjs`は開発専用の明示dummy Auth、loopback Origin、隔離schema、実DBを使用する。表示される専用process識別情報を保持する。確認中だけ起動し、TTYから`stop`を送る。5分最大寿命も設定する。Windowsで所有子process停止の権限が不足した場合は失敗として記録し、既知PIDの所有・commandを確認して専用processだけ停止、表示された専用schemaだけ片付ける。推定PIDや他schemaは対象にしない。終了JSONのstop/schema結果とport停止を確認する。専用Edgeはbrowser helperのfinallyで閉じる。`docker compose -f compose.test.yml down`で試験DBを破棄する。

## backup・復旧

手動backupは、変更日の終了時と、deploy・保存形式変更前に本人が取得する。変更後24時間以内に成功取得することを運用目標とする。取得成功日時と対象（DB/schema・対象SHA・保存形式版）を本人が管理し、失敗・未取得も把握する。未取得の場合は最後に成功したbackup以降の変更を失う可能性がある。自動実行や自動RPO保証は今回追加しない。

実環境ではDB管理者が同じ時点の非公開schemaと必要なAuth本人参照をbackupする。companies/memosだけを抜くと、所有者FK、成功operations、削除ID予約を欠く。通常の`pg_dump`はcustom形式で、`--exclude-table-data=<専用schema>.app_sessions`を必ず指定し、session/token行を持ち出さない（表定義と限定関数は保持）。Authのpassword/tokenを企業メモbackupへ追加しない。本体は暗号化された保管先へ保存し、鍵ringはDB dumpとは別の秘密保管先で管理する。自動backup製品やcronは今回追加しない。

復旧は既存DBを上書きせず隔離DBで行う。アプリを停止したまま、PostgreSQL17・必要なrole・元のAuth user参照を用意し`pg_restore`で復元する。続けて管理者接続で[復元session除去SQL](../db/maintenance/reset-restored-sessions.sql)を実行する。`__SCHEMA__`は今回復元した専用schemaの名前だけへ置換し、ASCII小文字で始まる小文字・数字・underscoreの1〜63文字であることを確認する。SQLも識別子とsystem/public/auth schemaを検査して拒否する。通常APIへ管理者権限やsession表の直接権限を渡さない。

**通常backup・古い全schema dumpのどちらでも、鍵が揃っている場合を含め、再開前の全session/token除去と新規ログインが必須。** SQL失敗・session残存ならアプリを再開しない。管理者が対象schemaの`app_sessions`件数0・`encrypted_tokens`非null件数0を確認する。企業・メモ・owner/ID/版・所属・成功operationsと再送結果、schema fingerprint、RLS/FKが保持されることを別に検査してから再開する。復元された旧Cookieを使わず本人が再ログインする。古いsnapshotからの復旧で10分確認を誤利用しない。架空DBの復元証拠と実運用のbackup成功は区別する。

停止時はAuth・DBの復旧を優先し、復旧したDBの時点を確認してから本人が再認証する。結果不明の保存は同じoperationIdで照合し、記録が見つからない結果を未保存と断定しない。確認後の再試行は同一要求を明示的に行う。

アプリrollbackは人間承認のrevert PRと人間mergeを使い、本人が対象SHAの再配置成功、実際の配置SHA、対象動作を確認する。Vercelでの実作業は本人担当のままとする。データ復旧は損失範囲・backup時点・形式互換性を踏まえた別判断とし、revertから本番DB上書きやmigration逆実行を自動で行わない。

## 本人の実接続・公開確認

実設定後に本人ログイン、他本人/未認証拒否、企業名だけで登録、8状態と進行中社数、日付、手入力メモの再読込、本文/構造/原文/Web分離、本文download、2端末の版競合、結果不明照会、変更後削除拒否と最終確認を確認する。keyboard Tab/Escape/focus、スマホ表示も本人環境で確認する。

ローカル容量・復元・性能参考値はUnit実装記録を参照する。実Supabaseのネットワーク・pooler・負荷下p95や2端末公開受入は別途必要。Vercelの設定・deploy・実merge SHAのdeployment確認・公開ページと`/api/health`・承認済み利用導線の確認は本人担当。U3新比較UIは後続Unitであり、U1の旧比較入口をその完了と扱わない。

## 訂正OCR・生成候補の保存

U2は企業詳細から開始し、固定の保存先へ訂正OCR・生成候補を明示保存する。本文・構造・イベント・採用Webは別に確認し、生成企業名の不一致やdummy出自を表示する。単発入口は既存の生成・復習・.md出力を維持する。[生成保存の手順と検証境界](generated-notes-checks.md)を参照する。

追加の設定キー・DB・依存はない。既存の本人Auth、DB、独立したreceipt鍵ringを使い、鍵はserver内だけで利用する。実値の空欄と本人による設定・Vercel作業の境界は上記のまま。一時画像は保存せず、外部AIへ送信した画像の保持は提供元の条件に従う。ローカルdummy成功は実外部の動作確認ではない。
