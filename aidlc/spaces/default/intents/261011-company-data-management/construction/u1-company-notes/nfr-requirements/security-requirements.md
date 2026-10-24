# U1：本人・保存内容を守る要件

## Requirements and Evidence

| ID | 要件・判定条件 | 受入証拠 |
|---|---|---|
| NFR1.1 | 全保護APIで有効なアプリsessionとAuthが検証した本人を確認し、一覧／対象／親所属／操作結果／削除確認／比較参照の所有者を照合 | 本人・未認証・失効・別所有者・不正IDの架空ケース。401／同じ404、他人データ返却0・不正変更0 |
| NFR1.2 | 変更Originを同一サイトへ制限。ログイン／ログアウトを含む新旧POST／PATCHで欠如・不一致は403 | Cookieだけを持つ不正OriginとOrigin欠如の直接要求で変更0 |
| NFR1.3 | 公開サインアップ／匿名ログインなし。管理側の初期本人アカウントによるemail＋password。CookieはHttpOnly、本番Secure、SameSite=Lax、Path=/、Domain指定なし。access／refresh tokenをブラウザへ出さない | 実設定確認、応答／ブラウザ保存の検査、未認証の既存OCR／生成／Web／復習の拒否 |
| NFR1.4 | session絶対7日・非操作24時間。全要求で期限／失効を検査しrefresh直列化。ログアウトは現在sessionをDBで失効、他端末を勝手に終了しない | 時計注入で期限直前／期限時、同時refresh／logout、失効直後の次要求を検証。古いJWTでアプリ失効を回避不可 |
| NFR1.5 | password非保存・非ログ。Auth tokenは内部session保存で暗号化。暗号鍵と生成出自署名鍵は別サーバー秘密値。DBの通常処理は必要権限だけ、所有者RLSも適用 | 設定／権限DDLの検査、ブラウザに鍵0、別所有者SQL拒否、接続先TLS証明書検証。実値は記録しない |
| NFR1.6 | 認証／保存応答はprivate/no-store。401／logoutで保護cacheと古い応答を除去。未保存入力は端末の一時領域で隔離し同じ本人の再認証後のみ復帰 | 遅延要求・別本人・再ログイン試験。失効後保護内容再表示0、draft自動保存0 |
| NFR4.1 | 本文・構造化項目・訂正OCR・イベント・Web出典・本人コメントを別用途で保存。不明は要確認／未記載。手入力項目追加は本人の明示記入だけ | 全情報区分・本文単独変更・項目単独変更・null／空の有効構造・手入力追加fixture。自動事実化0 |
| NFR4.2 | 保存要求に原画像／一時URL／画像ファイル名等の欄なし。採用Webはadoptedと有効なURL／取得日時を必須、generated出自証明の本人・provider一致を検証 | 不正／不足出典・偽出自・画像欄要求は拒否、dummyは保存再表示でも識別。U2で一時参照解放を共同確認 |
| NFR5.1 | 外部入力を実行時検証し、上限超過は明示拒否、切詰めなし。表示はHTML／スクリプトを実行せず、資格情報なしの絶対http/httpsだけリンク | 危険文字／URL、実在日／閏日、上限直前／上限／上限超過、長文・改行・絵文字fixture。欄エラーと入力保持 |

## Threat and Data Boundaries

主な脅威は他所有者IDの指定、親所属すり替え、CSRF、失効後の遅延応答、出自表示の改変、危険Markdown、過大JSON、内容／鍵のログ漏洩。UI判定だけで防御せずC1〜C4のサーバー側検査、最小権限、RLS、構造検証で同じ境界を守る。

一般会員募集・共有・管理UI・新しい規制対応／認証方式は追加しない。特殊な法令・認証取得が要求されたとは仮定しない。本人の私的研究メモとして不要な収集・記録を避ける。healthはstatus:ok／service:briefing-note-aiだけの公開確認とし、Auth／DB／個人データを返さない。

## Input Limits and Remaining Clarification

保存JSON 1 MiB、本文／訂正OCR各50000 code points、名前／業界200、自由企業メモ／比較理由5000、構造化JSON256 KiB、配列100、採用Web50、URL2048。その他個別上限は承認済みbolt-planのInput and Response Limitsに従う。byte上限とcode points上限を両方検査する。

機能設計のoverview文字上限には、一般文字項目5000と承認計画のcompanyName／eventName／speakers各500の適用先に軽微な曖昧さが残る。既存レビューをここで修正した扱いにせず、後続詳細設計／コード計画で個別欄への適用を明確にし、500の承認値を勝手に緩めない。生成イベント型のspeakers有無も共有モデルに合わせる。

## Sources

- ../functional-design/functional-spec.md、rules.md — U1の操作順序・規則。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜NFR7。
- ../../../inception/contract-design/contract-summary.md — C1〜C6・有限再試行・版と原子性。
- ../../../inception/delivery-planning/bolt-plan.md — 選定・入力上限・性能／容量と検証条件。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行構成の静的記録。最新性・稼働証明ではない。
- nfr-requirements-questions.md Q1の本人回答a — 利用して変更した日の終了時と配置／保存形式変更前の手動バックアップ。

