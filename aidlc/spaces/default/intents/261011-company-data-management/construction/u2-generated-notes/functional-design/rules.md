# U2の業務ルール

## Business Rules — Source of Truth

```yaml
rules:
  - id: "BR1.1"
    statement: "本人と対象の所有権を全生成入口・保存入口で検査する"
    category: "authorization"
    applies_to: "Principal, GenerationDraft, Company"
    trigger: "OCR・生成・Web・復習・保存の要求時"
    logic: "IF 本人を検証できない THEN 保護内容を返さない。IF 選択企業が本人に属さない・消失 THEN 非開示の対象なしとして保存停止"
    violation: "入力を本人の一時領域で保持し再認証／対象確認へ。別本人へ表示・自動保存しない"
    source: "FR1,FR1.2,FR1.3,NFR1"
  - id: "BR1.2"
    statement: "終了・失効・対象変更後の古い応答を新しい作業へ適用しない"
    category: "policy"
    applies_to: "GenerationDraft, ExistingReviewResult"
    trigger: "応答受信・ログアウト・再ログイン"
    logic: "IF 本人・作業世代・対象が開始時と不一致 THEN 応答と保護キャッシュを破棄。IF 同じ本人が再ログイン THEN 最新確認後にだけ再操作"
    violation: "成功表示や別企業への転用をせず一時入力保持。再読込後の保持は保証しない"
    source: "FR1.3,FR6.3,NFR1,NFR3"
  - id: "BR2.1"
    statement: "生成名で企業を新規作成・改名・再割当しない"
    category: "constraint"
    applies_to: "GenerationDraft, GeneratedCandidate"
    trigger: "生成成功・保存時"
    logic: "IF 生成overview名と選択企業名が異なる THEN 両方を区別表示し選択companyIdを保持。保存先なしの単発生成は利用可だが保存不可"
    violation: "企業選択へ案内。別企業への移動は破棄確認を伴い、新しい作業として開始"
    source: "FR5.1,FR2.3"
  - id: "BR2.2"
    statement: "訂正OCRとイベントを確認してから生成・保存する"
    category: "policy"
    applies_to: "GenerationDraft, GeneratedCandidate"
    trigger: "OCR成功・訂正・生成開始・明示保存"
    logic: "IF OCRが読めない・誤る THEN 元画像を見て訂正可能。生成開始時入力snapshotと結果を結合し訂正OCR・イベントを候補へ引継ぐ"
    violation: "失敗で元入力と訂正を消さない。編集後の再生成は本人の明示操作と既存変更の破棄確認が必要"
    source: "FR5.3,FR5.4"
  - id: "BR2.3"
    statement: "原画像は一時参照のみとし不要時に解放する"
    category: "constraint"
    applies_to: "GenerationDraft, GenerationSaveAttempt"
    trigger: "保存DTO作成・画像差替え・除去・保存確定・明示終了"
    logic: "IF 保存要求を作る THEN 画像binary・base64・object参照・ファイル名を含めない。IF 画像が不要 THEN 表示参照と保持fileを解放し取消し後の応答も無効化"
    violation: "永続領域へ渡さない。外部provider保持は別条件でありアプリ非保存からゼロ保持と断言しない"
    source: "FR5.4,NFR4"
  - id: "BR3.1"
    statement: "外部出力は構造検証成功後だけ保存候補にする"
    category: "validation"
    applies_to: "GeneratedCandidate"
    trigger: "生成応答・本人の構造編集・保存前"
    logic: "IF 既存全項目・型・出典・上限を満たす THEN 有効候補。ELSE 不正部分を示し保存を停止。新保存全体1MiB、本文/OCR各50000、構造256KiB、配列100、文字5000等は既存計画を適用"
    violation: "最後の有効候補と訂正入力を保持。不正応答から成功メモや出自証明を作らない"
    source: "FR5.2,FR5.5,FR7.3,NFR2,NFR4"
  - id: "BR3.2"
    statement: "情報区分と不確実性を維持し根拠を捏造しない"
    category: "policy"
    applies_to: "GeneratedCandidate, ExistingReviewResult"
    trigger: "生成・編集・保存・再表示・出力"
    logic: "IF 根拠なしの数値・読取不能・空項目 THEN 要確認／未記載。事実、本人印象、HR強調、質問、ES材料、Webを別区分に維持"
    violation: "型検証を事実性の証明にしない。実OCR全入力の正解率を保証しない"
    source: "FR5.2,FR5.5,FR7.3,NFR4"
  - id: "BR3.3"
    statement: "採用Web補足だけを出典とともに保存する"
    category: "validation"
    applies_to: "AdoptedWebSource, GeneratedCandidate"
    trigger: "候補採用・保存・再表示・出力"
    logic: "IF 本人が採用 THEN status adoptedと安全な出典URL・取得日時が必須。未採用候補・取得本文を紙事実へ混ぜない"
    violation: "出典欠落や危険URLなら欄別に拒否、入力保持。URL保存だけでサーバー取得しない"
    source: "FR5.5,FR7.3,FR9.1,NFR4"
  - id: "BR3.4"
    statement: "dummy出自は実出力に基づき改変不能な証明で引継ぐ"
    category: "authorization"
    applies_to: "GeneratedCandidate, GenerationSaveAttempt"
    trigger: "構造検証成功・保存・再表示"
    logic: "IF サーバーが検証成功 THEN 本人・generationId・providerOriginに結合した証明を発行。U1は署名・本人・provider一致を検証。dummyは画面と保存再表示で検証用と明示"
    violation: "欠落・改変・別本人・鍵不整合は保存拒否し候補保持。証明は内容の真偽を保証しない"
    source: "FR5.5,NFR1,NFR4"
  - id: "BR4.1"
    statement: "明示保存は安定IDと凍結要求でU1へ一度の意図として渡す"
    category: "constraint"
    applies_to: "GenerationSaveAttempt"
    trigger: "保存クリック・二重操作・結果不明・再試行・同候補でのOCR／復習往復"
    logic: "IF 有効候補かつ選択企業あり THEN 新しい保存意図へoperationIdとmemoIdを一度割当て送信snapshotを固定。IF 同じ本人・企業・候補の表示を切替 THEN 保存中・unknown・確定結果とIDを保持し、新規保存へ戻さない。unknownは未実行確定と解釈せず同じ要求・IDを照会後に再試行。明示的新生成の検証成功だけが次候補へ移し、生成失敗や編集表示だけで確定を消さない"
    violation: "二重送信抑止。拒否は入力保持、結果不明は照会を案内し自動書込再送なし。成功確定後GET失敗でも成功を消さない"
    source: "FR5.1,FR6.2,NFR2,NFR3"
  - id: "BR4.2"
    statement: "生成保存後はU1の同じメモ編集と版契約を使う"
    category: "constraint"
    applies_to: "Memo, GenerationDraft"
    trigger: "保存後にメモ閲覧編集・競合"
    logic: "IF 本文だけ編集 THEN 構造を再生成しない。構造だけ編集でも本文を変えない。旧版は拒否し入力とbaselineを保持したまま最新内容を別に確認して明示再編集"
    violation: "無言上書き・自動mergeなし。U1の同じメモへの版検査と保持入力導線を使い、保存後の入力を別の新規メモとして自動送信しない。共同条件の完了は結合検証で確認する"
    source: "FR6.2,FR6.3,FR7.2,NFR3"
  - id: "BR4.3"
    statement: "未保存候補の移動と表示を安全に扱う"
    category: "policy"
    applies_to: "GenerationDraft, GeneratedCandidate"
    trigger: "画面移動・対象切替・破棄・プレビュー"
    logic: "IF 未保存変更あり THEN アプリ内破棄確認しcancelは継続。本文は文字として安全表示し危険リンクを実行しない。ブラウザ離脱確認は対応範囲で使う"
    violation: "失敗・拒否で入力を消さない。状態は文字／通知でも示しキーボードと小画面で主要操作へ到達可能"
    source: "FR6.3,NFR2,NFR5"
  - id: "BR5.1"
    statement: "生成・既存復習の対応するMarkdown出力を維持する"
    category: "constraint"
    applies_to: "GeneratedCandidate, ExistingReviewResult"
    trigger: "download・面接前復習入口"
    logic: "IF 成功した現在表示の内容あり THEN 対応する本文・区分・採用出典を出力。未保存を保存済みと称さない。生成から従来入力で復習へ進む"
    violation: "失敗／未生成は成功結果として出力しない。比較出力はU3所有で本Unitは追加しない"
    source: "FR9.1,FR9.2,NFR4"
  - id: "BR5.2"
    statement: "既存復習境界と既存エラーの互換を保つ"
    category: "constraint"
    applies_to: "ExistingReviewResult, GenerationDraft"
    trigger: "既存OCR・生成・Web・復習の呼出し"
    logic: "IF 既存入力で復習 THEN 既存契約と出力を維持。新DBメモ読取や復習結果保存を追加しない。生成失敗と保存結果不明を分離し、structure例外は承認済みリリース計画の写像を優先"
    violation: "既知中断不具合を一括修正しない。今回の変更による退行と区別して記録"
    source: "FR9.2,NFR6"
```

## Rules Summary

| ID | 判断 |
|---|---|
| BR1.1 | 本人と対象の所有権を全生成入口・保存入口で検査する |
| BR1.2 | 終了・失効・対象変更後の古い応答を新しい作業へ適用しない |
| BR2.1 | 生成名で企業を新規作成・改名・再割当しない |
| BR2.2 | 訂正OCRとイベントを確認してから生成・保存する |
| BR2.3 | 原画像は一時参照のみとし不要時に解放する |
| BR3.1 | 外部出力は構造検証成功後だけ保存候補にする |
| BR3.2 | 情報区分と不確実性を維持し根拠を捏造しない |
| BR3.3 | 採用Web補足だけを出典とともに保存する |
| BR3.4 | dummy出自は実出力に基づき改変不能な証明で引継ぐ |
| BR4.1 | 明示保存は安定IDと凍結要求でU1へ一度の意図として渡す |
| BR4.2 | 生成保存後はU1の同じメモ編集と版契約を使う |
| BR4.3 | 未保存候補の移動と表示を安全に扱う |
| BR5.1 | 生成・既存復習の対応するMarkdown出力を維持する |
| BR5.2 | 既存復習境界と既存エラーの互換を保つ |

## Sources

- ../../../inception/units-generation/unit-of-work.md
- ../../../inception/units-generation/unit-of-work-story-map.md
- ../../../inception/requirements-analysis/requirements.md
- ../../../inception/domain-design/components.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/user-stories/stories.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md — 実環境設定の後回し、Vercel本人担当の現在方針。

