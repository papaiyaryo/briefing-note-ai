# Business Overview

## Business Domain
企業説明会の手書きメモを企業研究・ES・面接準備に再利用する就活支援アプリ。情報を事実、HR/社員の強調、印象、質問、ES材料、Web補足に分け、不明情報を「要確認」とする。`src/lib/structure/schema.ts:3`, `src/lib/structure/toMarkdown.ts:67`。

## Current Functionality
- `/`: 最大20枚のPNG/JPEG/WebP画像（各10MiB以下）→画像ごとに順次OCR→編集→Web候補確認/採否→構造化JSON→編集可能なMarkdown/簡易preview/ダウンロード。
- 同じFlow内で構造化メモから面接前復習の4区分を生成/表示/出力する。
- `/compare`: 保存メモの選択、7比較観点、志望度/理由編集、比較Markdown出力。
- dummy/openai切替と公開health。実行成功を今回検証したものではない。
根拠: `src/lib/upload.ts:1`, `src/components/BriefingNoteFlow.tsx:159`, `src/components/compare/CompanyComparePage.tsx:17`。

## Current Data Ownership
保存と正本の現状は `architecture.md` / `component-inventory.md`。会社を独立して識別するモデルはなく、企業名はイベントメモ内の文字列。比較保存の入口にはprops欠落による無効化がある（品質評価参照）。

## Active Intent Context
回答Q1-Q3ではNotionのような使いやすい企業メモ・選考状況管理、進行中社数の可視化が優先された。これらは現在未実装。細かな既存バグは後回し、旧Issueから範囲が変わったという回答を要件段階へ引き継ぐ。本調査は採用DB、認証、リリース範囲や受入基準の承認ではない。

## Historical Inputs and Limits
`docs/status-2026-10.md`は2026-10-10の棚卸し。README/初期設計は1枚/dummyのみと記すが、現コードには複数画像/実provider/Web/比較/復習がある。旧Phase/Issueや過去CI成功は背景記録であり、現行本番・承認状態の証明にしない。Google Driveの実装は見つからない。
