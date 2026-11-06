## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-24T23:47:37Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/nfr-design/security-design.md > SD1 手順2・5、およびlogical-components.md > Infrastructure Handoff | トランザクションpooler前提と「session単位の共有排他」が両立する根拠が書かれていない。transaction poolerではセッション単位のadvisory lockやセッション状態が使えず、排他をトランザクション内ロックで実現するとAuth refresh（外部HTTP呼出し）の間ずっとDB接続を1本占有する。プロセス最大3接続（PD2）なので、同時refreshが数件重なるだけで接続枯渇し、保存処理全体が止まる。ロック方式は「配置／コード計画で実証」と先送りされており、成立しなかった場合の代替設計が無い。 | 排他の実現方式（行ロック付きのリース行とfencing用refreshVersion等、DB接続を保持せずに済む方式）を設計として1つ選び、Auth呼出しの間に接続を保持しないことと、トランザクションpooler上で成立することを明記する。成立しない場合のフォールバックを決めておく。 | New |
| R-02 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/nfr-design/security-design.md > SD2 | 本人のRLS識別子の渡し方が「トランザクション内の一時設定」としか書かれていない。transaction poolerでRLSを安全に使うには、全保存操作を明示トランザクションで包み、トランザクション局所の設定（SET LOCAL／set_config(…, true)）を最初の文として実行する必要がある。セッション局所の設定を使うと別要求へ漏れる。ここで明示されていないため、自動コミットのクエリや読取専用の単発SELECTが本人設定なしで実行される経路を設計が排除していない。また、serverロールがRLSを迂回しない（BYPASSRLSやテーブル所有者でない）こと、本人設定が未設定のときは行が0件になる（フェイルクローズ）ことの規定が無い。session表のようにRLSが本人未確定で参照する表の扱いも未記載。 | SD2へ、(a)全保存アクセスは必ずトランザクション内でtransaction局所の本人設定を先頭に行う、(b)未設定時はRLSで全拒否、(c)serverロールはBYPASSRLS無し・RLS対象表の所有者でない、(d)session表は本人未確定で引く別経路として別のアクセス権で分離、を設計として追記し、SD5の実DB試験に「本人設定漏れの検出」を含める。 | New |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/nfr-design/security-design.md > SD4 | overviewのcompanyName／eventName／speakers個別上限が機能設計レビューからの未解消事項としてコード計画に回されている。承認済み500を緩めないとはあるが、どの上限が正本かが設計内で確定していない。 | コード計画の着手前に正本の上限値をbolt-planから転記して確定するか、未解消として人間の判断を得る。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/nfr-design/security-design.md > SD3 | 暗号化・HMAC方式はNode 22標準cryptoの「案」で、Vercel稼働runtimeでの対応が未確認。鍵ローテーション中の旧鍵保持期間の上限も未定。 | コード計画で稼働runtime対応を確認する項目を明示し、旧鍵の保持期限の方針を決める。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability.json（目視） | NFR1.1〜NFR7.6の33件がOK行で各設計節へ対応付け | 構造上の欠落は見当たらない |

### Summary

NFR網羅と責任境界は整っているが、transaction pooler上でのRLS本人識別の渡し方（トランザクション局所設定の強制とフェイルクローズ）と、Auth呼出しを跨ぐsession排他が接続3本制約と両立するかが未確定で、どちらも実装前に決めておくべきMajorである。Majorは2件のため判定はREADYだが、承認前に人間が重みを判断してほしい。
