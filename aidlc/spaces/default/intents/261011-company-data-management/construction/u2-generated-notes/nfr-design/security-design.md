# U2のセキュリティ設計

## SD1 — Identity Gate and Response Isolation

対象: NFR1.1、NFR1.2、NFR1.4。

既存のserver側本人確認とOrigin検査を各OCR／構造化／Web／復習入口のprovider処理より前に行い、保存は同じC1／C2を通す。選択企業は開始時の確認に加え保存時にU1が本人・存在を再検査する。401、403、本人に見えない対象404は内容や他人の件数を出さない。既存generation失敗はC5／リリース計画の写像を保つ。

U1のHttpOnly Cookie・server暗号化token・7日絶対／24時間非操作上限の既存認証へ依存し、U2はtokenや鍵を保持しない。DB TLS／保存暗号化の境界もU1を再利用し、別資格情報やブラウザAuth SDKを追加しない。保護応答はprivate,no-store、JSONの正しいContent-Typeを維持する。新しい全体CSP変更等を追加しない。

画面は本人識別子・選択companyId・generationRevisionの組を要求開始時に固定し、callbackで再照合する。logout／401／本人変更で保護cache・生成／復習結果を除去し進行要求を無効化。同じ端末の一時draftは元の本人へだけ結び付け、別本人には再表示しない。同一本人再認証後にも最新対象・操作状態を確認してから明示再操作する。

保存意図は同じ本人・企業・候補の作業に所属し、表示中のパネルより長く保持する。OCR／既存復習への往復だけではこの組を更新・破棄しない。本人・企業変更、401、明示終了は組を無効化し、旧応答が次の作業の確定表示や保存先を書き換えないようにする。

## SD2 — Validated Candidate and Provenance

対象: NFR1.3、NFR4.2、NFR4.3、NFR4.4、NFR5.1。

外部入力は既存schemaで実行時検証する。完全な構造検証に成功した時だけ、既存のU1 verifierと同じ証明形式・server鍵・本人／generationId／providerOriginの結合で出自を発行する。U2で独自署名形式やブラウザ署名を作らない。保存時はU1が検証する。証明は内容の真偽や編集後の正確さを保証しない。

Candidate mapperはC2の既存型へ一度だけ写像する。論理出典URLはsourceUrlへ対応し、id、category、content、fetchedAt、confidence、statusを保持、statusはadoptedに限定する。独自urlキーを保存DTOへ送らない。欠損・危険URL・無効取得日時は保存前に拒否する。本人が編集した本文と構造を別正本として渡し、未採用Webや画像を含めない。

Markdownは安全な既存rendererを使用しraw HTMLを実行しない。URLはhttp/https絶対形式・資格情報なしを検証し、安全なlinkのみ表示する。入力内の指示を認証／保存規則へ昇格させず、区分・要確認を維持する。

外部Responsesの単発要求へstore:falseを明示する。送信前の案内はアプリの画像非保存と外部providerの保持条件が別であることを短く説明する。実組織の保持設定やゼロ保持を推定せず、既存provider/modelを変更しない。試験はfake transportで送信項目を検査し、実外部送信なし。

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

