# U2の容量・拡張設計

## SC1 — Shared Store and Bounded Work

対象: NFR7.3、NFR7.4、NFR7.5。

U2は同じNext.jsプロセスの生成アダプタと画面を使い、永続データはU1のCompanyWorkspaceへ渡す。別DB・table・画像storage・queue・shard・共有cacheを追加しない。provider呼出しのstateは要求単位、一時画像／draftは本人と作業単位に閉じる。2clientの生成は独立し、同一保存意図の競合はU1の本人＋operationIdの直列化へ委譲する。

既存のDB poolと一覧pagingを共用し、U2からDBへ直接接続しない。1企業50メモ等はfixtureであり登録制限を増やさない。15社警告を生成保存の制限へ使わない。

## Capacity and Change Triggers

100企業／1000メモ／10000操作、長文・Webの代表fixtureで、DB総量200MiB以内という計画予算とp95目標を維持する。容量・失敗数・待ち時間の超過は記録して改善案を作る契機であり、有料plan・autoscale・上限緩和を自動実行しない。実Supabase提供枠・休止の成立は未確認のまま、失敗時は入力保持と再試行へ縮退する。実OCR費用はDB/Auth無料枠と別。Vercelの構成・公開測定は本人担当で、U2は新しい運用環境を作らない。

## Sources

- ../nfr-requirements/performance-requirements.md
- ../nfr-requirements/security-requirements.md
- ../nfr-requirements/scalability-requirements.md
- ../nfr-requirements/reliability-requirements.md
- ../nfr-requirements/observability-requirements.md
- ../nfr-requirements/tech-stack-decisions.md
- ../functional-design/functional-spec.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/domain-design/components.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md

