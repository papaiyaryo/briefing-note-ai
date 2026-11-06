# U1：改訂7の差分検査と検証継続（2026-10-29）

## 継続元

改訂7は、改訂6の[2026-10-28実行記録](timeout-30s-verification-20261028.md)を同じ試行のStep 1〜3およびStep 4途中の証拠として引き継ぐ。Node v22.20.0でschema 24件、対象2 files 52件、U1 17 files 261件、全体およびcoverage各56 files 645件が成功し、skip 0。lint、typecheck、buildもexit 0。全app/src lines 85.96%（2964/3448）で下限80%を満たした。対象3件のit第三引数30000は既に現ソースにあり、アプリ・テストのソースを今回変更していない。性能原因の解消や製品p95達成は示さない。

改訂6の `git diff --check` exit 1と公式audit shardの行末空白12行は、当時の失敗として記録を維持する。監査記録の手編集や元コマンドの再実行はしていない。

## 改訂7で実行した検査

新しいPlan Approvalで承認された次のコマンドを1回実行した。

```text
git diff --check -- . ':(exclude)aidlc/spaces/default/intents/261011-company-data-management/audit/**'
```

exit 0。`docs/generated-notes-checks.md` のLF→CRLF変換予告だけが出力され、行末空白の指摘はなかった。除外は公式tool所有の当該auditディレクトリだけで、アプリ・テスト・その他の計画記録は検査対象に残した。失敗の隠蔽として元のコマンドを成功扱いにはせず、改訂7の新コマンドの結果として区別する。

## 記録と残る作業

Step 1〜4のコマンド検証は改訂7の範囲で完了。source-manifestの累積対象には該当2テストファイルが既に含まれ、新しいソース差分がないためmanifestのpathは変更しない。traceabilityの146 IDsとDeferred判定を維持し、AC6.3.2とNFR2.6に今回の検証記録を追加した。正式reviewと登録済み公式checkpointはorchestrator担当で未実施。U1の残GUI確認、未完了B1、性能調査、実Supabase/Auth・外部API、CI、merge/Vercelはこの結果で完了扱いにしない。
