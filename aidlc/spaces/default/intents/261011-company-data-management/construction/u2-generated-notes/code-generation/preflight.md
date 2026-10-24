# U2 preflight

- 開始branch: release/bolt-002-company-data-management-local。HEAD: df63c09be502bf5c9e50b58a69e2bacea5c39bc5。同じBolt002を継続。
- 開始時156source/config/docsのSHA256をbaseline.jsonへ採取。他者のdirtyとU1既存sourceを保全する。
- Node v22.23.3、既存依存。PG17.6-alpine healthy、loopback試験専用DBのみ。
- Vitest node、v8 include src/app、lines80%、既存CI Node22/dummy/PG17.6を確認。設定・依存は変更しない。
- readiness: `npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplementRoute.test.ts --passWithNoTests=false`。Node22 wrapper経由で4files/16tests passed、exit0（2026-10-16）。
- 初回wrapperは存在しないnode_modules/npm/bin/npm-cli.jsを指定しMODULE_NOT_FOUND/exit1、収集前setup失敗。アプリRedに数えない。正しいwrapperは `npm exec --cache .npm/u1-cache --package=node@22.23.3 -- npm ...`。
- Testing Contract a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440。公式plan approval approved。順序は各層Red→Green→Refactor。
- 実Supabase/外部API/実CI/本番は未検証。U1競合draft・復元session・削除期限の既知不備、既存audit high5/critical1は未解消のまま区別する。
