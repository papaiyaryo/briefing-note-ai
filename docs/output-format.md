# Output Format

## Purpose

This document defines the Markdown structure generated from company briefing notes.
The output must stay editable by the user and useful for company research, entry sheet writing, interview preparation, and follow-up questions.

## Core Rule

Generated Markdown must separate these categories:

- Facts from the briefing
- Personal impressions
- Points emphasized by HR or employees
- Questions to ask later
- ES / interview usable points
- Web-derived supplemental information

Do not mix facts, impressions, and web information in the same section.
If a detail is not present in the note or OCR text, write `要確認` instead of inventing it.

## Basic Template

```markdown
# {{companyName}}

## 説明会概要
- 企業名: {{companyNameOrUnknown}}
- イベント名: {{eventNameOrUnknown}}
- 日時: {{dateOrUnknown}}
- 登壇者: {{speakerOrUnknown}}
- メモ元画像: {{imageFileName}}

## 説明会で得た事実
- {{factFromBriefing}}

## HR・社員が強調していた点
- {{emphasizedPoint}}

## 事業内容
- {{businessContent}}

## 強み・特徴
- {{strengthOrFeature}}

## 求める人物像
- {{candidateProfile}}

## 自分の印象・感じたこと
- {{personalImpression}}

## 気になった点・懸念
- {{concernOrObservation}}

## 次に聞きたい質問
- {{followUpQuestion}}

## ES・面接で使えそうな材料
- {{usablePointForApplication}}

## 次に調べること
- {{researchTodo}}

## Web 補足情報
- MVP では未使用
- Post-MVP で追加する場合は、出典 URL と取得日を必ず残す

## 元メモからの抜粋
```text
{{ocrTextExcerpt}}
```
```

## Section Guidelines

### 説明会概要

Brief metadata about the briefing or event.
If the company name, event name, date, or speaker cannot be read from the note, use `要確認`.

### 説明会で得た事実

Only include information that appears in the briefing note or OCR result.
Examples include business areas, hiring information, office locations, selection steps, and numeric facts.

### HR・社員が強調していた点

Use this section for messages that were explicitly emphasized by HR, recruiters, or employees.
Do not rewrite personal interpretation as if it were an official statement.

### 事業内容

Summarize business content from the briefing note.
Unknown business details should be marked as `要確認`.

### 強み・特徴

List strengths or characteristics presented in the briefing.
If the note only suggests a possible strength, phrase it cautiously and mark uncertainty.

### 求める人物像

List candidate traits, skills, values, or behaviors mentioned in the briefing.
Do not infer a desired profile only from the company's industry.

### 自分の印象・感じたこと

Keep personal reactions separate from facts.
This section may include interest, concern, motivation, or fit with the user's values.

### 気になった点・懸念

Use this section for unclear points, concerns, contradictions, or topics that need verification.

### 次に聞きたい質問

List questions for later company events, interviews, or follow-up research.
Questions should be concrete enough to reuse.

### ES・面接で使えそうな材料

Extract points that may help with entry sheets, motivation statements, self-PR, or interview answers.
These should be based on facts, emphasized points, or personal impressions already separated above.

### 次に調べること

List research tasks that can be done after the briefing.
Examples include checking the official hiring page, reading business segment pages, or confirming selection details.

### Web 補足情報

MVP does not generate web-derived supplemental information.
When this feature is added after MVP, every item must include a source URL and retrieval date.
Web information must not be merged into briefing facts.

### 元メモからの抜粋

Keep an excerpt of the OCR text so users can trace generated Markdown back to the original note.
Do not include sensitive content in logs or unnecessary external outputs.

## Handling Uncertainty

Use these labels consistently:

- `要確認`: The note suggests the item, but it is not clear enough to state as fact.
- `不明`: The item is not present in the note or OCR result.
- `未使用`: The feature or section is intentionally unused in the current MVP flow.

## MVP Output Requirements

- The Markdown must be plain text and editable by the user.
- The file must be downloadable as `.md`.
- The structure must support company research, ES writing, interview preparation, and follow-up questions.
- The output must not invent company facts.
- Web-derived information must remain empty or explicitly marked as unused in MVP.
