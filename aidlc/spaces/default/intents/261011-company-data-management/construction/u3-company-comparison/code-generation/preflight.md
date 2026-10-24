# U3 着手基準

公式tool-produced briefのtarget u3-company-comparisonとTesting Contract sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440を全文確認した。rootが記録済みの実Approve Planに従う。計画本文・試験手順は変更しない。

working tree基準は[source-baseline.json](source-baseline.json)。branch release/bolt-002-company-data-management-local、HEAD df63c09be502bf5c9e50b58a69e2bacea5c39bc5。U1/U2および本人/rootの既存dirtyを含む実ファイルhashを開始前に採取した。U1/U2成果物は凍結、承認済み共有4ファイル以外を変更しない。

変更影響: 新6libと新6画面を既存C1/C3/C4へ接続し、layoutのProvider、compare入口、WorkspaceShellの本人/dirty連携、旧比較adapterの4既存ファイルだけ変更する。全体layout/contextは他画面も消費するため、既存UI/生成回帰と最終全suiteで確認する。DB/Auth/schema、依存・CI・coverage設定は読取再利用のみ。

Node22.23.3を既存cacheからprocess PATHへ選択、npm11.6.1。package install/upgradeなし。Vitest4.1.8/node、coverage app/src全対象・lines80%設定不変。

- 変更前 `npm test`: exit0、45files/468tests成功、skip0、24.99秒。
- `npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false`: exit0、1file/1test成功、skip0。既存7キー読込のrunner確認でありapp Redではない。
- 実PG接続: PostgreSQL17.6、loopback workspace_test。adminと非superuser appロールを確認。自分のrandom u3_preflight schema作成/削除成功、cleanup true。既存volume/他schema変更なし。

必須knowledgeは先行同一agentでの全文読了を継承し、今回の再読の出力省略箇所を新しい読了証拠に数えない。current Unitのfunctional/NFR全資料とtrace、共有C1/C3/C4・上限・担当境界を確認。存在しないschemas.tsの読取はschema.tsへ訂正、テスト失敗ではない。キャッシュ一覧の過大出力は中身を調査せず、以後sourceに限定する。

既存5問題、audit high5/critical1、実Supabase/Auth/CI/公開は未解決/未確認。Vercel実作業は本人担当。
