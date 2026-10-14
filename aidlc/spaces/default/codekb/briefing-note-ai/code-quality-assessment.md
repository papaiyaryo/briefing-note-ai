# Code Quality Assessment

## Assessment Basis
ソース静的調査とテスト内容の読取。lint/typecheck/test/build/Docker、CI照会、本番/実providerは今回未実行。テスト成功件数、coverage%、production acceptanceを推定しない。

## Test Coverage
Vitest node環境、21test files。upload境界、step純粋ロジック、dummy、Markdown/parser/download filename/Blob、Zod/カテゴリ分離、provider切替、OCR/Web routeとfake server client、error/logがある。
UI testsはReact renderToStaticMarkupによる部品の文字列確認。`tests/ui-components.test.ts:1,54,163`。comparison testはtoComparisonMarkdownの1ケース（`src/lib/comparison.test.ts:32`）。Flowを操作し保存→reload→比較へ進む統合/E2E、localStorage schema/quota、選考集計、structure/復習routeの直接テストは見つからない。保存ボタンが利用可能になることを親子結合で検証していない。
coverage provider/閾値/測定scriptなし。`vitest.config.ts:9`。現行Classic/orgの80% floorを実測満足したとは扱わず、後続の計画/検証で解決する。

## Linting and CI/CD
ESLint Next rules、TS strict、Prettier scripts。PR/main pushでlint/typecheck/test/build。CIには実API secrets設定なし。Claudeは明示mentionのみ。`.github/workflows/ci.yml`, `.github/workflows/claude.yml`。testにpassWithNoTests指定がある。Dockerはdevelopment commandで、本番imageではない。

## Quality Indicators
| 項目 | 評価 | 根拠 |
|---|---|---|
| Naming clarity | good | feature/schema/clientの名称と安定code |
| Function size | fair | Flowが約482行でstate/非同期/UIを集中管理 |
| Error handling | fair | server safe error/meta log、Web UIとstorage例外境界に欠落 |
| Test presence | fair | 純粋domain/APIのテストあり、親子Flow/保存統合なし |
| Duplication | fair | client error写像、server抽出、Zod/JSON Schemaが重複 |
| Dead code | fair | sample helper/旧templateがdemo/testから参照、未接続props/cancelが残る。機械的unused解析未実施 |

## Intent-Relevant Findings
1. **企業とメモのidentityが分離されていない**: SavedCompanyMemo.idは毎回新規UUID。会社名/イベントはoverview内。会社の再利用/複数メモ統合/選考状態/社数集計はない。`src/lib/comparison.ts:9,49,82`。会社数をメモ数で代用しない要件が必要になる。
2. **比較保存の親子接続が欠落**: FlowのMarkdownEditStep呼出しにstructuredMemoがない。`src/components/BriefingNoteFlow.tsx:442`。child既定nullとdisabled条件により通常Flowで比較保存不可と静的に判断できる。`src/components/steps/MarkdownEditStep.tsx:29,133`。本段階でのブラウザ再現は未実施、今回の修正採用は未承認。
3. **正本が二重**: Markdownは手編集可能だがstructuredMemoは更新されず、比較/復習はJSONを使う。`src/components/BriefingNoteFlow.tsx:152,350`, `src/lib/comparison.ts:82`。JSON→Markdownはあるが逆方向なし。
4. **永続化の単位/復元に制限**: localStorage v1は配列型判定のみ。所有者/会社IDなし。画像bytes、独立OCR、構造化Webmetadata、復習結果、未保存Flowを復元しない。保存Markdownの元メモsectionにはOCR文字列、Websectionには採用補足が含まれるため、「OCR/Webの文字列も一切保存されない」とは言えない。`src/lib/comparison.ts:58,69,75`, `src/lib/structure/toMarkdown.ts:67`。
5. **ユーザー分離/外部送信の設計境界**: 公開APIに認証/rate-limit実装なし。実providerはメモ入力を外部送信。DB化時の所有権/画像/OCR保存範囲、既存データ引継ぎ、復元/削除を要件・設計で決める。

## Deferred Existing Defects and Debt
ユーザー回答は細かな不具合を後回しにする。以下を今回の実装要件へ自動採用しない。
- 復習AbortControllerは作るがrequestInterviewReviewのsignal引数へ渡していない。`src/components/BriefingNoteFlow.tsx:358,365`, `src/lib/interviewReviewClient.ts:55`。
- Web not_configured/company_not_foundが[]に変換され、原因がUIで区別できない。`src/lib/webSupplementClient.ts:115`。その他失敗はFlowにcatchなし。`src/components/BriefingNoteFlow.tsx:241`。
- structureには既定timeout timerがなく、error写像は他routeと異なる。`src/lib/server/structure.ts:34`, `app/api/structure/route.ts:75`。
- JSON bodyサイズ/出力token上限、アプリ利用量制限は見つからない。server loggingのscalar型だけで機微文字列を完全排除する保証はないが、現呼出fieldはmetaのみ。
- TODO/FIXME/HACKのliteralは検索で見つからず、未来Issueに依存する古いコメントは残る（`app/api/structure/route.ts:24`）。eslint-disableは2箇所、blob image preview理由付き（UploadStep:165、OcrReviewStep:65）。
- dummyStructureは非demoの企業情報が空でもdemo企業名/イベントをfallbackする。`src/lib/structure/dummyStructure.ts:20`。実企業情報として扱わずdummy表示/データ継承に注意する。

## Documentation Quality
READMEと初期architecture/privacyはdummy/1枚/外部送信なし等の過去MVP記述が残る。sourceは実OpenAI/20枚/Web/比較/復習。company-comparison-designの5段階志望度は現行4enumと異なる。更新は後続承認範囲で扱う。
棚卸しのmain CI成功、Issue/PR履歴、Firewall設定は記述由来であり今回検証した事実ではない。資料の旧運用/対象外宣言は現IntentやAGENTSを上書きしない。
