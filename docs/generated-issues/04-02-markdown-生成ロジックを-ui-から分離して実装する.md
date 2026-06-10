# [Phase 4] Markdown 生成ロジックを UI から分離して実装する

## Phase

Phase 4: Markdown生成・ダミーOCR

## Priority

High

## Labels

- phase:4
- mvp
- frontend

## Goal

OCR テキストと入力情報から企業研究向け Markdown を生成する純粋ロジックを作る。

## Scope

- Markdown テンプレートを実装する
- 不明情報を 不明 / 要確認 として扱う
- UI から呼び出せる関数として分離する

## Out of Scope

- OpenAI API 呼び出し
- Web 補足情報の統合

## Acceptance Criteria

- [ ] 生成ロジックが UI に依存していない
- [ ] docs/output-format.md と整合している
- [ ] OCR にない情報を断定しない

## Dependencies

Depends on #04-01 and #00-01。

## Notes

LLM 導入前の deterministic な生成を優先する。
