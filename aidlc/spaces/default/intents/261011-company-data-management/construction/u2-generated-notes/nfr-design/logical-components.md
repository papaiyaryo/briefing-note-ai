# U2の論理部品と故障境界

## LC1 — Component Inventory

対象: NFR6.2、NFR6.3、NFR6.4、NFR5.2、NFR7.7。

| 部品 | 所有と境界 | 共有資源／故障時の影響 |
|---|---|---|
| GenerationWorkspace | U2の画面。本人／企業／作業世代、訂正draft、候補と現在の保存意図の寿命を管理 | 一時メモリのみ。表示往復で保存意図を破棄せず、作業失敗を保存正本へ波及させない |
| TemporaryImageOwner | U2のfile／表示参照とreleaseの単一所有者 | 不要参照の解放。画像を永続mapperへ渡さない |
| GenerationAdapter | U2の既存OCR／構造化／Web境界、検証済み候補と出自発行 | 既存server fetch／provider設定を共有。失敗は入力保持で縮退 |
| CandidateMapper | U2→C2の唯一のデータ受渡し。sourceUrl/id/confidenceを保持 | U1共有型を参照し別DTOや画像欄を作らない |
| SaveIntentController | 生成ワークスペースに所属する凍結送信snapshot・安定ID・結果確認。表示パネルには所属しない | U1 clientを共有。OCR／既存復習往復でも失敗・不明・確定／GET失敗を保持・分離 |
| ExistingReviewExport | 従来生成入力と対応復習／.mdだけ | 保存DBの復習連携なし。既知範囲外は区別 |
| AccessControl／CompanyWorkspace | U1所有の本人・保存・版・操作結果・backup | Auth／DB障害はU2の保存・保護生成を停止。U2は直接DB接続なし |

## Isolation and Verification Handoff

同じNext.js／React／TypeScript／Tailwind／Node22を使う。別プロセス・queue・cache・ORM・Express・新browser test製品なし。実Supabase/Auth/鍵は後回しにして、既存dummy Auth／providersと実使い捨てPostgreSQL17へ接続する。新しい依存・課金・Vercel作業を追加しない。

各部品の振る舞いを既存Vitestでrunner確認→受入対応Red→最小Green→Refactorと進める。純粋な設計文書・設定は非適用理由と構文／build検査をコード計画に明記する。全app／srcのline coverage80%以上、lint／typecheck／test／build、必要時Docker検査を維持。DOM／focusはSSR単体で代用せず、PC1366×768、390×844、幅320/767/768、200/400%拡大、キーボード・安全表示・通知を架空入力で実画面確認する。実コード計画の承認は別に必要。

追加の画面確認は画像選択→OCR訂正→生成→保存→OCR往復→候補へ戻る→既存復習往復→再取得を通し、同じmemoId・件数1を記録する。標準表示とブラウザ実倍率200%を別に確認し、CSS拡大・viewport代用では倍率の合格にしない。接続切断やfilechooser失敗、本人の準備完了回答は受入合格の証拠にせず、前提不成立をTDD Redへ数えない。

Infrastructure Designへは既存platform・鍵・DB／Auth境界を再利用し、U2固有インフラを追加しない条件を渡す。アプリ側deadline／出自発行／store:falseはコード設計であり、実公開環境の確認済み主張にはしない。本人のVercel設定／deploy／公開確認を実装担当の待機条件に戻さない。

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

