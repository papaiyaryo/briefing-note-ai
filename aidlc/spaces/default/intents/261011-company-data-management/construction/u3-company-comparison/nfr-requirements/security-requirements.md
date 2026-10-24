# U3 — 企業比較のセキュリティ要件

## Authentication and Authorization

| ID | 必須条件 | 検証例 |
|---|---|---|
| NFR1.1 | 候補一覧・メモ一覧・比較参照・各欄更新・結果照会・出力前再取得でC1本人認証を適用。U1がownerと企業/メモ所属を照合する。未認証401、他所有者/不存在404の同一形で内容・件数を漏らさない | 本人/別本人/未認証の直接C4 HTTP、所属違い・不正ID、画面ID改変。clientの選択検査だけで権限を認定しない |
| NFR1.2 | ログアウト/401/本人切替で保護結果を隠し要求世代を無効化。未送信入力・unknown/確定要求は本人別の一時メモリだけに保持し、別本人には表示/自動送信しない | A要求中→Bへ切替→A遅延成功/401でもBを変えない。A再ログインは最新読取後に明示復旧。出力確認中の本人変更ではファイル0 |
| NFR1.3 | Auth/DB鍵・token・session値はサーバー側。新比較の本文・理由・OCR・画像・出典content・完全要求をログ、URL query、監査記録、localStorageへ複写しない。既存legacyの端末保存だけはその従来境界内に保つ | browser response/storage、送信DTO、ログ捕捉でdummy秘密/固有の架空本文が出ないこと。診断はrequestId/code/時間など内容を含まない値に限定 |
| NFR1.4 | 外部応答を型castだけで信用しない。選択1〜20・重複0・順序/対象/所属・有効構造・版・出典を検証し、全選択有効だけready。U1の更新側もexpectedVersion/operationId/許容changes/サイズを検証する | 不足/余分/重複/入替/不正構造/別企業memo/版欠落/不正Webを拒否しファイル0。1MiB・5000 code points等の境界は容量文書参照 |
| NFR1.5 | C4のprivate,no-store、HttpOnlyセッションと同一Origin検査を継承。旧比較も保護入口の内側で明示操作後に読み、旧データをアカウントへ結び付けずサーバー送信0回 | Cookie/Authの実装はU1の既存境界を使用。Origin不一致/欠如の更新拒否、失効後の旧比較非表示、legacy読取だけでは保存内容不変 |

## Safe Rendering and Threat Cases

| ID | 必須条件 | 検証例 |
|---|---|---|
| NFR5.1 | 企業名・理由・比較配列・Webを文字として扱い、HTML/スクリプトを実行しない。リンクは資格情報なし絶対http/httpsだけ。Markdownの表区切り・改行・HTML風文字を安全に扱い、選択順・内容・区分を壊さない | script/img onerror/HTML、javascript/data URL、資格情報入りURL、括弧/縦棒/改行/長文を表示・download双方で確認。URL保持だけで外部fetchしない |

主要脅威はIDOR、旧本人の遅延応答、別企業メモ混入、型だけの応答受理、理由欄からのXSS、保存済み/未保存値の混合、legacyの無断アップロード。各行の拒否と入力保持を同時に確認する。新比較はLLMや外部Web取得を呼ばず、採用Webの保存値だけを使う。

## Data and Compliance Boundaries

個人の企業調査・本人入力はprivateとして扱い、架空fixtureのみを試験/画像証拠に使用する。共有/公開/会員募集/新しい計測外部送信は範囲外。法令適合や実Authの動作確認を本設計で宣言しない。

## Carried Limitations

U1の復元後失効session復活・ロック待ち後の削除確認期限、U1競合draft破棄、U2往復後の重複保存、native200%未確認、既存依存auditは未修正/未達。U3の独立要件を満たしてもそれらの解消とはしない。凍結sourceへ無断修正せず、正式な修正経路へ持ち越す。実Supabase/Auth・実CI・公開の未確認も維持する。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
