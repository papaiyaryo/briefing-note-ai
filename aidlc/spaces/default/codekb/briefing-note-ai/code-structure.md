# Code Structure

## Package Organization
単一ルートnpm package。配置はpage/API→UI→libと機能別libの組合せ。別package、migration、DAO、middlewareは見つからない。

## Source Classification
| 分類 | 対象 |
|---|---|
| Controller/Handler | `app/page.tsx`, `app/compare/page.tsx`, `app/layout.tsx`, `app/api/{health,ocr,structure,web-supplement,interview-review}/route.ts` |
| Service/UseCase / UI orchestration | `src/components/BriefingNoteFlow.tsx`, `compare/CompanyComparePage.tsx` |
| Static/Asset / UI | `Button.tsx`, `ErrorNotice.tsx`, `StepIndicator.tsx`, `MarkdownPreview.tsx`, `InterviewReviewView.tsx`, `steps/{UploadStep,OcrReviewStep,WebSupplementStep,MarkdownEditStep}.tsx`, `app/globals.css` |
| Model/Entity | `src/lib/types.ts`, `openai/contracts.ts`, `{structure,webSupplement,interviewReview}/schema.ts` |
| Repository/DAO相当（ブラウザのみ） | `src/lib/comparison.ts`のlocalStorage CRUDの一部。DB repositoryではない |
| Service/UseCase | `src/lib/{ocrClient,structureClient,webSupplementClient,interviewReviewClient}.ts`, `server/{ocr,structure,webSupplement,interviewReview}.ts` |
| Utility/Helper | `src/lib/{upload,flow,markdown,download,errorMessages,sample,sampleData,dummyOcr}.ts`, `structure/{validate,toMarkdown,dummyStructure}.ts`, `webSupplement/{validate,dummy}.ts`, `interviewReview/{validate,toMarkdown,dummy}.ts`, `server/{openaiClient,errors,logger,log}.ts` |
| Configuration | `openai/provider.ts`, root package/TypeScript/Next/Vitest/ESLint/PostCSS/Docker/ignore設定、`.github/workflows/` |
| Test | `tests/*.test.ts`14、`src/lib/comparison.test.ts`, `openai/provider.test.ts`, `structure/{dummyStructure,validate,toMarkdown}.test.ts`, `interviewReview/{dummy,toMarkdown}.test.ts` |
| Documentation/Static | `README.md`, `docs/`、PR template。ルート `index.html`はアプリ非参照の未追跡資料として浅い確認のみ |

## Code Patterns
React hooksのstate/ref、純粋な変換関数、Zod schemaから型推論、JSON Schemaの並行定義、provider selector、fake client注入、安定codeと日本語error。共通server-only指定ファイルはなく、実際のimport経路でサーバー境界を確認した。依存関係とexport群は `dependencies.md`。

## Absence and Historical Boundaries
会社DB、ユーザー/所有権ID、選考status、会社集計、編集ノート再オープン、Google Drive integration、カレンダー/応募管理のmoduleは現行ソースにない。過去の設計案やIssue見出しは存在確認に用い、実装と同一視しない。
