# U2のセキュリティ要件

## Identity and Trust Boundaries

| ID | 要求 | 検証対象 |
|---|---|---|
| NFR1.1 | OCR・構造化・Web・復習・保存の全保護要求はU1が検証した本人と同一Originを要求。未認証401／不正Origin403、他本人や消失企業404の非開示境界を維持 | 直接APIの未認証・失効・別本人・Origin欠如／不一致。拒否時providerを呼ばず書込なし |
| NFR1.2 | 認証token・DB接続・外部APIキー・生成署名鍵はサーバー限定。ブラウザはU1の安全なCookieのみ。保護応答はprivate,no-store | client bundle／レスポンス／ログへ秘密を出さない。実値を読まずdummyで検査 |
| NFR1.3 | 出自証明は本人・generationId・実providerOriginに署名結合し、本文・画像・秘密は含めない。U1が署名・本人・provider一致を保存時に再検証 | 欠落・改変・別本人・dummy偽装を拒否し入力を保持。証明を内容の真偽判定に使わない |
| NFR1.4 | logout／401／本人切替時に保護cacheと古い応答を無効化。同じ本人用一時draftを別本人へ見せず自動保存しない | 作業世代・本人の遅延応答、再ログイン時最新確認、本人不一致の表示防止 |

## Untrusted Content and Image Boundary

| ID | 要求 | 検証対象 |
|---|---|---|
| NFR4.2 | 外部構造は保存前に既存schemaと上限で検証。原文にない値は要確認／未記載、本文／構造／訂正OCR／紙の情報区分／Web出典は別正本 | 不正構造、欠損値、本人編集後の別正本不変。生成全入力の事実性や正解率を保証しない |
| NFR4.3 | 採用WebはC2既存WebSupplementItemのid・category・content・sourceUrl・fetchedAt・confidence・statusを保持。論理出典URLは保存時sourceUrlへ対応付け、statusはadoptedのみ。未採用は保存しない | sourceUrl欠落・危険URL・取得日時欠落を拒否。logical url名を独自保存DTOへ追加しない |
| NFR4.4 | アプリは原画像を永続保存しない。外部送信前にアプリ非保存と外部provider保持を区別する短い案内を表示。単発Responsesはstore:false | fake送信契約でstore:falseと画像非保存を検証。外部監視保持の例外までゼロとは断言しない。実組織の保持設定は未確認 |
| NFR5.1 | HTML／script風入力を実行せず、出典URLはhttp／httpsの絶対URL・資格情報なしを検証。保存したURLだけでserver fetchしない | 危険文字列・URL・長文を編集／preview／再表示／出力で検査 |

## Compliance and Residual Risks

実データ・実API秘密は自動試験に使わず、内容を不要にlog／auditへ出さない。一般公開signup・共有・新しいデータ委託先を追加しない。新しい法的適合認証／契約／保持ゼロを主張しない。

U1のbackup復元session・競合draft保持・削除確認期限の古い指摘は調査時点の記録であり、現在も未修正と推定しない。本Unitは共有C1/C4/C5を維持し、本人切替・401・終了では保存意図と旧応答を無効化する一方、同じ本人・企業・候補のOCR／既存復習往復だけでは確定結果を失わない。既存依存auditのhigh5／critical1も過去の観測であり、今回新たな依存監査や解消を主張しない。U2設計やdummy成功を他Unitの現行安全性・公開環境の合格へ代用せず、リリース前の対応は正式な修正経路と必要な本人承認に従う。

## Sources

- ../functional-design/functional-spec.md — WF1〜5と状態遷移。保存意図と画面表示の寿命を分離する。
- ../functional-design/rules.md — BR1.1〜BR5.2。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜7。
- ../../../inception/contract-design/contract-summary.md — C1／C2／C4／C5と失敗契約。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 既存技術の調査時点の記録。現行設定値の照会結果ではない。
- ../../../inception/delivery-planning/bolt-plan.md — 入力上限、有限待機、試験条件、既存structureエラーの明示例外。
- ../../../../../../../../docs/session-handoff.md — 実設定を後回し・Vercel本人担当という決定。過去の不具合記載は記録時点の情報であり、現在の合否は各Unitの検証証拠と区別する。

