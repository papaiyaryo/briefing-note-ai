# [Phase 2] Figma MCP から MVP UI 仕様を取得する

## Phase

Phase 2: Figma / UI設計

## Priority

High

## Labels

- phase:2
- mvp
- figma
- mcp
- docs

## Goal

Figma デザインの構造・トークン・コンポーネント情報を実装に使える形で取得する。

## Scope

- 対象 node の design context を取得する
- レイアウト・色・タイポグラフィ・状態を整理する
- 実装時の注意点を docs/ui-spec.md に反映する

## Out of Scope

- React コンポーネント実装
- Figma デザインの大幅変更

## Acceptance Criteria

- [ ] Figma 由来の UI 仕様が取得済みである
- [ ] docs/ui-spec.md に反映されている
- [ ] 実装で参照すべきコンポーネントと状態が明確になっている

## Dependencies

Depends on #02-02。

## Notes

Figma MCP から得たコードは参照として扱い、実装では既存構成に合わせる。
