# U1：認証・秘密・入力の設計

## SD1 — 検証済み本人とセッション

NFR1.1／NFR1.3／NFR1.4／NFR1.6／NFR1.8を対象に、AccessControlだけが本人コンテキストを作る。ブラウザには暗号学的な乱数で作る不透明なsession値をCookieで返し、内部保存はそのハッシュで検索する。CookieはHttpOnly、本番Secure、SameSite=Lax、Path=/、Domainなし。Authのaccess／refresh tokenは内部sessionに暗号化保存しブラウザへ返さない。

全保護要求の流れ:
1. 有効なsession、revokedAtなし、現在時刻が絶対期限と非操作期限より前であることを確認。
2. 必要なtoken更新はsession単位の共有された排他で直列化する。プロセス内mutexだけに依存せず、同時実行環境でも同じsessionを1つだけが更新する。排他取得待ち・Auth呼出しを要求deadline内に収める。
3. 外部Authで本人を検証し、session.userIdと一致することを確認。古いtokenや未検証JWTから本人を確定しない。終了sessionへtokenを書き戻さないためrefreshVersion／失効を再検査する。
4. 保存処理の開始時にも同じsessionの期限と失効を再確認し、認証から得た本人を保存コンテキストへ設定する。Cookie由来のIDや要求ownerIdへ置き換えない。
5. 書込確定とlogoutを直列化できるsessionの共有／排他の境界を設ける。認証確認→企業ロック→変更確定の間に失効済みsessionから新しい変更を通さない。全要求のロック順はsession→operation→企業→メモで統一する。
6. ログアウトは現在sessionを排他的に失効し、不要なtokenを消去する。他端末sessionは対象外。外部Auth失効も試みるがアプリ失効の成功を外部結果に依存させない。

Auth呼出しの間に企業ロックを保持しない。refreshを終えてから保存処理でsessionを再確認する。logoutが確定した後の保護要求は拒否し、先行読取の遅延応答はUIの要求世代で破棄する。認証／失効が確定できない障害を成功logoutや認証済みとして返さない。時刻境界はnow>=expiryを期限切れとし、保存日時は信頼できるサーバー時刻、経過deadlineは単調時刻で扱う。

## SD2 — 所有者と通信境界

NFR1.1／NFR1.2／NFR1.5を対象に、CompanyWorkspaceは全一覧・親参照・メモ・確認・操作・比較で本人所有者を照合する。非公開保存領域に必要権限だけのserverロールを置き、所有者RLSでも同じ境界を検査する。保存接続の本人設定はトランザクション内の一時設定とし、プールの次の要求へ漏らさない。本人設定前に企業行を読まない。

変更POST／PATCHはOriginが同一許可サイトであることを検査する。欠如／不一致は403、未認証401、見えない対象と不存在は同じ404。公開healthと認証入口は私的データを返さない。Auth失敗の説明にアカウント存在を含めない。DB接続はTLS証明書を検証し、検証を切って接続成功としない。通常の管理者／全権キーは使わない。

## SD3 — 暗号化・出自・鍵の境界

NFR1.5／NFR4.2を対象に、内部token暗号化はAES-256-GCM、32 bytesの乱数鍵、暗号化ごとの12 bytesの乱数nonce、16 bytesの認証tagを設計として選ぶ。Node 22の標準cryptoを利用する案とし、稼働runtimeでの対応はコード計画で照合する。暗号鍵をDBと別のサーバー秘密設定へ置き、nonceの再利用を避ける。session識別子・本人ID・鍵識別子を追加認証データに結び、別sessionへの暗号値すり替えと改変を拒否する。tag検証前の平文を利用・返却せず、保存値には鍵識別子・nonce・tag・暗号値を保持する。アプリ用session値は32 bytesの暗号学的乱数、保存検索はSHA-256ハッシュとする。これは実装の成功確認ではなく、暗号処理を独自実装しないための設計選択である。[Node 22 cryptoの公式仕様](https://nodejs.org/docs/latest-v22.x/api/crypto.html#cryptocreatecipherivalgorithm-key-iv-options)

生成出自は別の32 bytes乱数署名鍵と鍵識別子を用いるHMAC-SHA-256を選び、本人ID・generationId・providerOriginだけを認証する。本文の正しさの証明にしない。用途と形式版を固定した署名envelopeを検証し、同じ長さの署名値を時間差を抑えた比較で照合する。検証鍵を保持する範囲で旧署名を検証し、除去された鍵／改変／本人不一致はinvalid_inputで入力保持。保存済みproviderOriginを再表示する際に新しい生成名やブラウザ入力で上書きしない。[Node 22 HMACの公式仕様](https://nodejs.org/docs/latest-v22.x/api/crypto.html#cryptocreatehmacalgorithm-key-options)

鍵の実値・暗号化前tokenをrepo／ログ／auditへ書かない。計画的ローテーションでは新書込を新鍵へ切り替え、旧鍵を読取用として維持し、session利用時の再暗号化または終了で旧鍵参照がなくなったことを確認してから除く。新鍵を書き込めない時は旧有効値を壊さない。緊急鍵失効は対象sessionを終了して再ログインへ案内する。企業／メモの内容まで消去する処理にはしない。鍵供給・復旧・保管と既存有効鍵の確認方法は配置／コード計画で固定する。

## SD4 — 外部入力と表示

NFR4.1／NFR4.2／NFR5.1／NFR5.2を対象に、HTTP入口でcontent-type・要求byte量・許可キー・ID／版・項目型を検査し、共有型の実行時schemaからサービスと保存境界まで同じルールを使う。検証した構造をそのまま保存正本へ渡し、DB値の再読取でも構造の妥当性を確認する。不正保存データを架空値で埋めた成功応答にしない。操作hashは検証・正規化後の型と安定キー順から求める。

文字項目ごとの承認上限はbolt-planを正本とする。overviewのcompanyName／eventName／speakersの個別上限適用は機能設計レビューからの未解消事項としてコード計画へ明示する。一般の5000上限を口実に承認済み500を緩めない。この設計で元のレビュー済みentitiesを編集した扱いにはしない。

手入力本文は勝手にtrimして変えず、空白のみを拒否。本人が項目追加した時だけ全項目の編集枠を作る。null／有効な空構造を別に扱い、保存は明示操作。各情報区分・Web出典・dummy由来を保持する。

Markdown／名前を文字として扱い、raw HTML実行を許さない。絶対http／httpsかつ資格情報なしのURLだけリンク化し、外部リンクの別窓では参照元window操作を防ぐ。埋込／MIME sniffing等を防ぐ応答headerを後続配置で確認し、既存UI／画像／Markdown導線を壊す設定を未検証で有効にしない。

## SD5 — 試験と着手条件

NFR1.7／NFR6.1を対象に、本人／未認証／別所有者、失効直前／期限時、同時refresh／logout、偽出自、Origin不正、危険表示、入力上限でTDDを行う。SQL権限と本人context分離は同じmajorの実試験DB、ブラウザ表示は承認した手動条件で検証。dummyしか持たないCIでも動くよう認証providerの試験adapterを使う。

導入Boltの対象SHAの公開ページ・health・基本操作、専用環境／秘密設定、コード計画承認の実施は別に確認する。記録された設計は稼働・権限・暗号方式の実検証を代替しない。未選定の実装詳細を本書から選定済みと推定しない。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

