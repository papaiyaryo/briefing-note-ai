# U3 — 比較の安全設計

## Trust Boundaries

ブラウザLC1〜LC6は権限を発行しない。U1 AccessControl→CompanyWorkspaceのC1/C3/C4を信頼境界とし、本人認証/owner/所属/版/原子的更新はU1で検査する。U3→U1の既存依存だけを使い、U2内部/DB/Auth管理鍵への新しい経路を作らない。

| NFR | 解決策 | 拒否/非漏洩の検証 |
|---|---|---|
| NFR1.1 | LC2は全候補/比較/欄別更新/照会/出力前読取をC4へ送り、U1が毎回認証・owner・所属を照合 | 401保護非表示、他ownerと不存在は同404。ID改変/所属違いを直接HTTPでも拒否 |
| NFR1.2 | LC1はcurrentOwnerとlogin/selection/request/input世代を持つ。失効で表示/要求を無効化し、draft/intentはowner別メモリへ退避。新ownerへ旧応答/入力を渡さない | A→B→A、遅い旧成功/401、出力確認中の切替。同本人復旧でも最新読取と明示確認 |
| NFR1.3 | LC1 storeをブラウザのアプリinstance内だけで生成。server processのsingleton/SSR共有stateを使わず、秘密や保護内容をURL/log/新localStorageへ複写しない | 同時SSR/別ownerで状態非共有。架空固有本文/秘密のログ・storage・応答混入0 |
| NFR1.4 | LC2でレスポンスをruntime検証し、全selected順/対象/所属/非空版/構造/出典を照合。更新DTOは欄限定、U1側strict検証も継承 | 不足/余分/重複/入替/不正応答をreadyへせずファイル0。schema許容範囲とbytes/文字制約を照合 |
| NFR1.5 | LC2は既存同一Origin/Cookie/private,no-storeを使用。LC6は認証後の明示旧入口のみ。旧記録はアカウント関連付けせずサーバー送信0 | 不正/欠如Origin更新拒否、失効後旧表示停止。既存Cookieの安全属性はU1責任で変更しない |
| NFR5.1 | LC3/画面は値をtextとして表示。Markdown導出は表/改行/HTML風値を安全化。URLは資格情報なし絶対http/httpsだけリンク化 | script/イベント属性/危険scheme/縦棒/括弧/長文の表示と.mdを確認。値から外部fetchを起こさない |

## Validation and Presentation Sequence

本人境界確認→要求snapshot固定→C4→LC2の構造/所属/順序検証→LC1の現世代確認→LC3の派生→安全な画面表示、の順。HTTP成功だけではreadyとしない。検証失敗は内容を漏らさないエラーで入力を保持し、表示途中の一部を完全比較へ昇格させない。

構造化全schemaを再定義した別DTOにせず、既存schema/契約を再利用する。企業志望度null/undecidedの区別、reason5000 code points、adoptedWebの全保持項目は既定どおり。画像欄・ownerId指定・他欄のchangesを新たに受け付けない。

## Encryption, Secrets and Compliance

U3に暗号鍵/tokenの新たな保管責任はない。通信・セッション暗号化・権限・RLSはU1配置へ写す。新しい安全header/外部監査製品/法令適合保証をこの設計から追加しない。実メモ/秘密を検証証拠へ出さず、dummyと架空データだけを使う。

U1復元session復活/削除期限/競合draft破棄、U2重複保存/native200%、既存auditは未解消。U3の安全設計をこれらの修正や実環境合格と読み替えない。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
