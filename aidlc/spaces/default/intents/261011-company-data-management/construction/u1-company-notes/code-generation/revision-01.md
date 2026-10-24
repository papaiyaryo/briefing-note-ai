# U1計画改訂1

## Sources

2026-10-15の本人指示：SupabaseはAPIキー等を後で書く設定枠を先に作る。実設定なしで試験できるか確認したい。Vercelのデプロイ作業は本人が担当する。

## Changes

実Supabase準備と導入Bolt公開確認をローカル実装の着手条件から外し、サーバー環境変数の空欄と手順を用意する。ローカル・CIはdummy認証／生成と実PostgreSQL17でTDD・実migration・coverage80%を検証。実接続・外部性能・公開の未確認は本人へ引継ぎ、Vercel設定・deploy・公開URL照会は実装担当の作業にしない。本人限定認証・RLS・秘密のserver保持・人間merge・Unit順を維持し、productionでdummyへfallbackしない。

## Approval

初版承認は記録済み。本改訂は本人の変更依頼を具体化しcode-generation-plan.mdとunit-test-instructions.mdに反映したもの。修正版への公式確認を待つ。過去の準備未達や未実施確認を成功に書き換えない。

## Technical References

現在のAuth＋pg方式では実利用にAPIキーだけでなくproject URL・DB接続等が必要。[Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)、[DB connection](https://supabase.com/docs/guides/database/connecting-to-postgres)（2026-10-15確認）。
