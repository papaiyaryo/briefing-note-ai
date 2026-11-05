# Bolt 002 リリース確認・修復案

2026-11-03。ユーザーは今回のリリースを先に進めたいと依頼。次Boltの実装は開始しない。

## 確認した状態

- リモートmainは `1054820a1ffa1664a7c75fcc167e621f34ae0149`。今回のアプリ実装は既にその履歴に含まれる。現在のローカルHEADとの差分は通知メール手順のみ。未コミットの検証・承認記録は別途存在する。
- 同SHAのGitHub Production deployment `7363224189` はsuccess。Vercel配置先は `https://briefing-note-4tv1b73aq-papaiyaryos-projects.vercel.app`。
- 同SHAのCI run `40534503722` はInstall dependenciesでfailure。`npm ci`がlockfile不整合を報告し、`@emnapi/runtime@1.11.3`、`@emnapi/core@1.11.3` が不足。lint/typecheck/test/buildはこのrunでは未実行。
- 公開URLの `/api/health` はVercel Security Checkpointを返した。保護を回避せず、health・本人の保存/再読込・生成保存・比較フローは未確認とする。デプロイ成功だけでリリース完了としない。
- 既存のAccept failure、Deferred、フォーカス問題、次Bolt整理の判断は維持する。

## 承認された限定修復案

2026-11-03、ユーザーはこの修復案に `yes` と回答した。これは今回の限定修復・検証・PR作成の承認であり、人間による最終mergeや公開受入の完了を代行するものではない。

1. Node22/npm10でlockfileを修復する。直接依存・アプリの機能・CI設定・DB・Vercel設定は変更しない。想定外のversion更新が出たら採用せず差分を再確認する。
2. 隔離した一時directoryで `npm ci --ignore-scripts --no-audit --no-fund` を実行し、clean install可能性を確認する。現在のnode_modulesは削除しない。
3. 既存dummy providerとloopback試験DBで `npm run lint`、`npm run typecheck`、`npm test`、`npm run build` を確認する。実API/本番DBを使わない。実行結果と失敗を記録する。
4. lockfile修復と必要な検証記録をrelease branchの日本語PRにまとめ、GitHub CIの成功を確認する。mainへ直接pushせず、最終mergeは人間が行う。
5. merge後の実SHAのVercel成功を照合する。公開healthと本人利用フローは、保護画面を通過できる本人環境で確認する。秘密値のチャット貼付は不要。

## 完了条件

修復PRのCI成功、人間merge、実merge SHAのProduction配置成功、公開healthと本人の承認済み利用フローの確認。既存の未確認項目を成功に読み替えない。

## 修復・ローカル検証結果

- Node22.23.3/npm10.9.3で一時directoryのlockfileを再生成。不足のroot `@emnapi/core` / `@emnapi/runtime` 各1.11.3、既存Tailwind WASM同梱依存6エントリを補完し、npmのpeer属性も再計算。既存package versionの変更・削除なし。package.json変更なし。
- 一時directoryで `npm ci --ignore-scripts --no-audit --no-fund` はexit0、400 packages。インストールscriptはこの確認では未実行。Linuxの通常installはPR CIで確認する。
- 既存node_modules、dummy provider、loopback試験DBで `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` は全てexit0。56 files、645 tests passed。外部API・実Supabase/Auth・本番DBを使用していない。
- アプリ動作の変更がないlockfile修復のため新規TDDテストは追加しない。既存CIのinstall失敗を修復前証拠、隔離clean install成功を修復後証拠とする。
- 今回のPRにはlockfileとこのリリース記録を含める。次Bolt整理の引継ぎは既存のローカル記録に保持する。他の未コミットUnit/監査記録・ユーザー文書は作業treeに保持し、一括stageしない。既存の通知メール手順commitも同branchの差分に含まれる。

## リリース途中の追加作業: 失敗原因のサーバーログ（2026-11-05）

本番確認の途中に、ユーザーから「OCR失敗の理由がわからない」と報告があった。公開確認を進めるのに必要な作業として、ユーザーの直接指示（2026-11-05「すぐに直したい。サーバーログに残してほしい」「途中での必要な作業として記録してマージして」）で実施した。次Boltの実装ではない。2026-11-04 の #104（認証・起動設定・DBの失敗理由ログ）の続きにあたる。

- 原因: OpenAIのエラー本文（`code`/`type`/`param`/`message`/`x-request-id`）を捨ててHTTPステータスだけを残し、OCRルートはそれもログに出していなかった。`/api/v1/*` の想定外の例外、生成APIガードの失敗、DB期限切れも、原因が記録されていなかった。
- 対応: OpenAIのエラー分類と、OCRの本文が空だった理由（`responseStatus`/`incompleteReason`/`refused`）を `ocr.failed` に記録する。入力拒否の理由と画像の形式・サイズも記録する。1件のリクエストで出るログすべてに同じ `requestId`/`route`/`method` を付け、応答の `X-Request-Id`・エラー本文の `requestId` と一致させる。アクセスログ `workspace.request`/`generation.request` を追加する。想定外の例外は名前・メッセージ・stack・causeを `workspace.error` に記録する。ブラウザのコンソールにも `requestId` を出す。
- 安全性: APIキー・Bearer・JWT・接続文字列の資格情報は伏字にし、メッセージは300文字で切る。JSON解析エラーとDBエラーは本文を記録しない（#104の方針を維持）。画像・OCR本文・メモ・email・password・Cookieは記録しない。
- TDD: `tests/serverLogging.test.ts` を先に書き、未実装による失敗を確認した（Red）。その後、実装して通した（Green）。
- 検証（Node 24、dummy provider、loopbackの試験DB）: `npm run lint`/`npm run typecheck`/`npm test`（58 files、677 tests passed）/`npm run build` は全てexit 0。実API・実Supabase・本番DBは使っていない。
- 完了条件は上記「完了条件」のまま変えない。このPRのCI成功と人間によるmergeの後、merge SHAのProduction配置と、本番で `ocr.failed` などのログが出ることを確認する。未確認の項目を成功として扱わない。
