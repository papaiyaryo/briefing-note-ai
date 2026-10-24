# U1：性能・安全性・障害時の要件の確認

## Confirmed Context

承認済みbolt-plan.mdの性能・容量・認証・入力上限・検証条件を引き継ぐ。新APIのp95 2秒、50メモ付き企業削除p95 3秒、100企業／1000メモの代表fixture、200 MiBの容量予算、同時2クライアント、有限タイムアウト、TDDと80% line coverageは聞き直さない。

保存・認証はSupabase Free、バックアップと休止時の復旧手順を含める方針も選択済み。ただし、手動バックアップの頻度と、復元時にどの程度前の状態まで戻ることを許容するかは未指定。

## Q1 — 手動バックアップの頻度

承認済み計画では無料プランの自動バックアップを前提にしていない。企業・メモの保存データを本人がバックアップする手順を用意する際、どの頻度を基準にしますか？

A. 利用して内容を変更した日の終了時と、デプロイ／保存形式変更の前にバックアップする。変更後24時間以内のバックアップ取得を運用目標にする（推奨）。
B. 週1回と、デプロイ／保存形式変更の前にバックアップする。復元時には最大約1週間分の編集を失う可能性を許容する。
X. Other (please specify)

[Answer]:a

どちらも本人の手動実行を基準とする。自動の予定実行サービス、課金、外部バックアップ製品は追加しない。実際の損失範囲は最後に成功したバックアップ以降であり、未実行・失敗したバックアップを成功扱いにしない。具体的な取得・保管・復元手順と架空データによる復元確認は後続設計／コード計画へ反映する。

秘密値・実メモを回答や開発記録に書かず、バックアップ本体もリポジトリ／auditへコミットしない。

## Sources

- ../../../inception/requirements-analysis/requirements.md NFR2、NFR3、NFR6、NFR7。
- ../../../inception/delivery-planning/delivery-planning-questions.md Q1=a — Supabase Free、バックアップ／休止復旧を計画へ含める。
- ../../../inception/delivery-planning/bolt-plan.md — 自動バックアップ非前提、本人管理バックアップによる復旧、公開確認とロールバック。
- ../functional-design/functional-spec.md、rules.md — 成功確定・結果不明・原子的保存／削除。
- ../../../inception/contract-design/contract-summary.md — 永続操作記録と成功再送。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行検証・配置の出発点。
