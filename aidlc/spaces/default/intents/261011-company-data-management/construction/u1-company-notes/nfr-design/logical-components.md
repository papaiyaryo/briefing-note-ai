# U1：品質設計から配置設計への責任境界

## Logical Inventory

| 論理領域 | 所有する責任と品質対策 | 共有資源・障害の影響 |
|---|---|---|
| AccessControl／session境界 | SD1〜SD3。本人検証、token暗号化、期限・refresh・logout直列化 | Authと内部session保存。停止時は保護操作を拒否し、公開healthとログイン入口の安全表示は残す |
| CompanyWorkspace／transaction境界 | RD1〜RD2、PD1〜PD2。所有者、版、親直列化、操作履歴、削除確認 | 保存DBとpooler。停止／期限時は結果不明・入力保持。別所有者を混ぜない |
| ApplicationExperience／端末内表示境界 | PD3、SD4、WF1〜WF7。本人要求世代、draft、安全表示、PC／スマホfocus | ブラウザ内の一時領域。失効で非表示、端末終了後の完全復元は保証しない |
| 保存・秘密設定境界 | SC1〜SC2、SD2〜SD3、RD3。最小権限、接続・鍵、容量、backup | 専用保存領域、サーバー秘密値、本人管理backup。管理者鍵を通常処理に混ぜない |
| 検証／公開診断境界 | OD1〜OD2、PD3。dummy・実SQL・手動・SHA一致 | ローカル使い捨てDB／既存CIとVercel。実私的データをfixture／artifactへ入れない |

6部品の所有者と呼出方向を変更せず、表は新しい別サービスの一覧ではない。生成の出自発行／画像解放はU2、7観点比較／出力前の版確認はU3。両方はU1の本人・保存／参照契約を使い、独自DB・独自認証を追加しない。

## Design Decisions and Alternatives

- **親を先に直列化＋保存版＋操作履歴**: 古い更新、削除確認後変更、二重送信を同じ正本で検証する。UIの事前取得だけに頼る方式は検査後競合を防げないため採用しない。
- **共有保存側のsession排他と確定前検査**: 複数実行プロセスでrefresh／logoutを扱う。プロセス内mutexだけでは実行先変更で境界が切れるため採用しない。具体ロック方式と取消しは配置／コード計画で実証する。
- **私的データは共有cacheなし・軽量読取**: 今回の代表規模へ必要な索引／ページと有限接続を対応付ける。新しいcache・queue・shardingの依存を追加しない。
- **手動backup＋架空restore試験**: 本人選択の無料運用を保つ。自動RPOや固定SLAを誤って約束しない。

## Infrastructure Handoff

NFR6.3／NFR2.9を含む選定技術と上記全品質対策を、既存Next.js／Vercel、Supabase Auth／非公開PostgreSQL、pooler、ローカル同major試験DB／CIへ配置設計で写す。ここでは接続・アカウント・鍵を作成せず、完全コード／SQLも書かない。

必要確認: 実リージョン／DB版／無料枠、新専用本人アカウント・公開登録無効、最小serverロール／RLSとsessionアクセス権、poolerのsession／transactionロック互換、有限取消し／後始末、秘密設定と鍵更新・backup／restore手順、導入Boltの公開確認、release branchとコード計画承認。成立しなければ具体的な変更を実装前に確認する。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

