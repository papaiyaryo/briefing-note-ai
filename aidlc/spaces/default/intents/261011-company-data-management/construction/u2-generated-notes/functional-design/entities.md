# U2の論理エンティティ

## Entity Model — Source of Truth

以下のYAMLをデータ形の正本とする。永続Company／Memo／WriteOperation／Principalの所有者はU1、U2は新しい保存領域を持たない。

```yaml
entities:
  - name: GenerationDraft
    description: 本人が確認中の一時的なOCR・生成作業。永続メモではない。
    attributes:
      - { name: generationId, type: opaque_identifier, required: true, unique: true }
      - { name: ownerContext, type: verified_principal_reference, required: true, references: Principal }
      - { name: selectedCompanyId, type: company_identifier, required: false, references: Company, default: null }
      - { name: temporaryImages, type: temporary_image_reference_list, required: true, default: [], max: 20, constraints: "既存形式・1枚10MiB以内。永続入力へ含めない" }
      - { name: correctedOcr, type: text, required: true, default: "", constraints: "訂正した原文。保存時50000文字以内" }
      - { name: event, type: existing_event_fields, required: true, constraints: "既存項目を維持。非空日は実在する暦日" }
      - { name: candidate, type: validated_candidate_reference, required: false, references: GeneratedCandidate, default: null }
      - { name: processingState, type: enum, required: true, allowed: [input, ocr_pending, correction, generation_pending, candidate, generation_failed, cancelled] }
      - { name: generationRevision, type: opaque_identifier, required: true, constraints: "開始時入力に結合し、遅延結果の適用を制限" }
    constraints:
      - "選択済み保存先は生成企業名から変更しない。移動には未保存確認を使う"
      - "画像参照と作業内容は端末の一時メモリのみ。再読込後の復元保証なし"
  - name: GeneratedCandidate
    description: 構造検証に成功し本人が確認・編集する候補。出自証明は内容の事実性を保証しない。
    attributes:
      - { name: generationId, type: opaque_identifier, required: true, unique: true, references: GenerationDraft }
      - { name: markdown, type: text, required: true, max: 50000, constraints: "本文の正本。構造編集で自動書換しない" }
      - { name: structuredContent, type: existing_complete_company_memo_structure, required: true, constraints: "既存11項目全て。256KiB・各配列100・各文字項目5000以内。overviewのイベント系は個別500を優先" }
      - { name: correctedOcr, type: text, required: true, max: 50000 }
      - { name: event, type: existing_event_fields, required: true }
      - { name: adoptedWebSources, type: adopted_source_list, required: true, default: [], max: 50, references: AdoptedWebSource }
      - { name: comparisonReason, type: optional_text, required: false, default: null, max: 5000 }
      - { name: origin, type: enum, required: true, allowed: [generated] }
      - { name: providerOrigin, type: enum, required: true, allowed: [dummy, openai] }
      - { name: generationReceipt, type: signed_origin_proof, required: true, constraints: "本人・generationId・providerOriginに結合。画像・本文・秘密なし" }
    constraints:
      - "本文と構造化項目は別正本。未定義保存項目・原画像を受け付けない"
      - "不正構造や欠けた出典は成功候補として保存不可"
  - name: AdoptedWebSource
    description: 本人が明示採用したWeb補足。紙の事実とは独立。
    attributes:
      - { name: content, type: text, required: true, max: 5000 }
      - { name: category, type: text, required: true, max: 200 }
      - { name: url, type: safe_absolute_web_url, required: true, max: 2048 }
      - { name: fetchedAt, type: utc_instant, required: true }
      - { name: status, type: enum, required: true, allowed: [adopted] }
    constraints: ["既存Web補足型の他の項目も保持。未採用候補は保存しない"]
  - name: GenerationSaveAttempt
    description: 本人・選択企業・生成候補に結び付く現在の保存意図。表示する画面の寿命から独立した一時情報。
    attributes:
      - { name: operationId, type: stable_identifier, required: true, unique: true, references: WriteOperation }
      - { name: memoId, type: stable_identifier, required: true, references: Memo }
      - { name: companyId, type: company_identifier, required: true, references: Company }
      - { name: frozenCandidate, type: candidate_snapshot, required: true }
      - { name: state, type: enum, required: true, allowed: [ready, saving, saved, rejected, unknown, verifying] }
      - { name: outcome, type: committed_operation_reference, required: false, default: null, references: WriteOperation }
    constraints:
      - "送信後に同一IDの要求内容を変えない。結果不明中は入力と送信snapshotを別に保持"
      - "再試行は同じ本人・同じ要求・同じoperationIdとmemoId"
      - "同じ候補のOCR確認・既存復習への往復では、保存中・結果不明・保存確定と安定IDを保持し、新規保存意図を作らない"
      - "保存確定後の編集は同じMemoへの未保存変更として引き継ぐ。候補の編集表示だけで別Memoを作らない"
      - "明示的新生成の検証成功時に次の候補へ移る。生成失敗では前の候補の保存確定を消さない"
      - "本人・企業の切替または明示終了後は旧意図の遅延応答を新しい作業へ適用しない"
  - name: ExistingReviewResult
    description: 従来生成候補から作る一時的な面接前復習結果。
    attributes:
      - { name: sourceGeneratedContent, type: existing_review_input, required: true }
      - { name: sourceWebReferences, type: existing_source_list, required: true, default: [] }
      - { name: reviewSections, type: existing_review_structure, required: true }
      - { name: providerOrigin, type: existing_provider_origin, required: true }
      - { name: resultState, type: enum, required: true, allowed: [pending, success, failure] }
    constraints: ["新DBメモ読取・復習結果永続化なし。成功結果に対応した出力のみ"]
relationships:
  - { from: Principal, to: GenerationDraft, cardinality: "1 to 0..many", direction: "本人が一時作業を所有" }
  - { from: Company, to: GenerationDraft, cardinality: "0..1 to 0..many", direction: "U1企業を任意参照、保存には必須" }
  - { from: GenerationDraft, to: GeneratedCandidate, cardinality: "1 to 0..1", direction: "現在の有効候補" }
  - { from: GeneratedCandidate, to: AdoptedWebSource, cardinality: "1 to 0..50", direction: "採用出典を包含" }
  - { from: GeneratedCandidate, to: GenerationSaveAttempt, cardinality: "1 to 0..1", direction: "同じ候補で保持する現在の保存意図。再送は同じsnapshot" }
  - { from: GenerationSaveAttempt, to: Memo, cardinality: "1 to 0..1", direction: "U1確定時に同じ安定IDのメモへ" }
  - { from: GeneratedCandidate, to: ExistingReviewResult, cardinality: "1 to 0..many", direction: "既存入力だけから復習" }
```

## Model Summary

生成途中、検証済み候補、保存意図、保存正本を分ける。画像は作業途中にのみ存在し、保存後の再取得は原画像に依存しない。出自証明は編集内容の真偽を認証するものではない。

## Sources

- ../../../inception/units-generation/unit-of-work.md
- ../../../inception/units-generation/unit-of-work-story-map.md
- ../../../inception/requirements-analysis/requirements.md
- ../../../inception/domain-design/components.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/user-stories/stories.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md — 実環境設定の後回し、Vercel本人担当の現在方針。

