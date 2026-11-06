## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-25
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/infrastructure-design/infrastructure-specification.md > Deployment (Environments, Resource sizing) と cicd-pipeline.md > Preview & Promotion | Preview は本番と同じ Supabase Free プロジェクト内の別 schema・別ロールで動く。一方、Preview の性能測定は 100 企業／1000 メモ／10,000 操作と warm-up＋各 50 回の連続実行を行う。DB 容量（200 MiB 予算）、pooler の接続数、CPU・IO は schema を分けても本番と共有される。そのため Preview の負荷試験が本番の接続枯渇や応答劣化を起こしうる。また本番 DB の空き容量を試験データが消費する。設計は schema／ロール分離だけを隔離策としており、資源面の影響範囲を扱っていない。 | 負荷試験中は本番で本人が使わない時間帯に限る、本番とのpooler 接続数・DB サイズ合計の上限を試験前に確認する、試験後に fixture を削除して容量を戻す、といった運用制約を cicd-pipeline.md に追記する。または、負荷試験を使い捨て実 PostgreSQL（ローカル／CI）側で行う方針に改める。 | New |
| R-02 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/infrastructure-design/infrastructure-specification.md > Deployment (Compute, Region) と Infrastructure Services > 既存Vercel | 保存 API のアプリ deadline は server 10 秒・DB 8 秒以内と定めているが、Vercel の契約プラン（Hobby／Pro）ごとの関数最大実行時間とリージョン変更の可否は未確認のまま「コード計画で照合」とされている。プラットフォームの上限がアプリ deadline より短い場合は、設計した取消し・ROLLBACK 手順が実行される前に関数が強制終了される。 | コード計画の着手条件に、現行プランの関数最大実行時間と Functions リージョン設定の確認を明記する。上限がアプリ deadline を下回るなら deadline 値を見直す。 | New |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/infrastructure-design/cicd-pipeline.md > Sources と CI Configuration Design | 出典に「未追加のcoverage／SQL service（2026-10-15読取）」とあるが、現在の .github/workflows/ci.yml には postgres:17.6-alpine の service と U1_TEST_DATABASE_URL がすでにある。読取時点の記述が古く、拡張前の CI 状態を誤って伝える。また CI の postgres は 17.6 で、本番の本人申告版 17.11 とは minor が異なる（同 major は満たす）。 | 現行の ci.yml を再読取して Sources の記述を更新し、試験 image の minor 差を許容する根拠（またはタグ固定の方針）をコード計画で明記する。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/infrastructure-design/cicd-pipeline.md > Preview & Promotion（本番 DB migration） | 本番 migration は本人の手動適用で、手順は「コード計画に固定」と先送りされている。migration の適用順（migration 先か deploy 先か）と、適用に失敗した時や旧アプリとの互換が崩れた時に、Vercel が自動公開する main とどう整合させるかが現時点では未定義である。merge は自動 deploy を伴うため、migration 前に新アプリが公開される窓が生じうる。 | コード計画に migration と merge の順序（互換的な加算 migration を先に適用してから merge する、など）を明記し、未適用のまま公開された場合の検知方法（health ではなく受入 flow）を記載する。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability.json の確認 | PASS | upstream_ids の 33 件 (NFR1.1 から NFR7.6) は nfr-design 配下の ID 集合と完全に一致し、coverage も全件に target がある。 |
| 現行 ci.yml の確認 | 注意 | PostgreSQL 17.6 service と dummy providers は既にあり、設計の Sources 記述が古い (Minor)。 |

### Summary

配置は既存の Vercel GitHub integration と verify CI の拡張に収まっており、第二の deployment workflow や新しい資格情報は追加されていない。NFR の追跡も揃っている。人が判断すべき主な点は、Preview の負荷試験が本番と同じ Free プロジェクトの資源を共有する影響範囲と、本番 migration と自動公開の順序である。Critical はなく、Major は 1 件のため READY とする。
