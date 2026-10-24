# Component Inventory

## App Shell
`app/layout.tsx`, `app/page.tsx`, `app/compare/page.tsx`, `app/globals.css`。metadata、ja language、各画面とスタイル配置。依存: Next/React、Flow/Compare。

## BriefingNoteFlow
`src/components/BriefingNoteFlow.tsx:27`。画像/OCR/JSON/Markdown/Web/復習state、非同期競合防止、4step制御。依存: client4種、変換、step UI、復習view。再読込復元なし。structuredMemo保存props未接続。

## UploadStep
`src/components/steps/UploadStep.tsx:36`。画像選択/drag-drop/追加削除/preview、任意企業イベント情報。upload validator、Button/ErrorNoticeに依存。

## OcrReviewStep
`src/components/steps/OcrReviewStep.tsx:19`。複数画像とOCR編集/再実行、空状態・エラー・処理中制御。Button/ErrorNotice/upload型に依存。

## WebSupplementStep
`src/components/steps/WebSupplementStep.tsx:28`。補足の出典/取得日/信頼度/採否/skip。Button、browser WebSupplementItem。

## MarkdownEditStep
`src/components/steps/MarkdownEditStep.tsx:26`。編集preview/tab、download、比較保存、復習起動。props省略時structuredMemo=null、保存不可。比較storageとdownload/previewに依存。

## InterviewReviewView
`src/components/InterviewReviewView.tsx:67`。4区分と根拠/確認badge、復習Markdown出力。source memo/Webをoutputに別区分で渡す。復習結果を永続保存しない。

## CompanyComparePage
`src/components/compare/CompanyComparePage.tsx:17`。保存メモ一覧、初期3メモ選択、7観点比較、志望度/理由更新、Markdown出力。comparison/download依存。会社一覧/選考boardではない。

## Shared UI
`Button.tsx`, `ErrorNotice.tsx`, `StepIndicator.tsx`, `MarkdownPreview.tsx`。ボタン/role alert/step aria-current/4種類のMarkdown block。HTMLをdangerouslySetInnerHTMLで挿入しない。

## Client API Layer
`src/lib/{ocrClient,structureClient,webSupplementClient,interviewReviewClient}.ts`。自アプリAPI fetch、safe error、Web形変換。contracts/typesへの依存。

## Structured Memo Domain
`src/lib/structure/{schema,validate,dummyStructure,toMarkdown}.ts`。CompanyMemoStructuredの10情報配列とoverview、Zod/JSON Schema、dummy、Markdown。markdown/types/sampleDataに依存。

## Web Supplement Domain
`src/lib/webSupplement/{schema,validate,dummy}.ts`。出典付き結果、medium/low/non_officialの要確認正規化、fake候補。structured memoのfactsに混在させない。

## Interview Review Domain
`src/lib/interviewReview/{schema,validate,dummy,toMarkdown}.ts`。4区分、basis/confidence、源情報別Markdown。structure/types依存。

## Comparison Storage
`src/lib/comparison.ts:9`。SavedCompanyMemo: id/memo/markdown/interestNote/savedAt/updatedAt。志望度はhigh/medium/low/undecided、会社ID/選考状態/所有者IDなし。v1 localStorage配列へ追加・志望度更新。JSON parse/array以外のschema検証なし。画像bytesや独立OCR/Web/復習object保存なし、Markdownにはそれらの文字列が含まれ得る。

## Server API and Services
`app/api/`, `src/lib/server/{ocr,structure,webSupplement,interviewReview}.ts`。公開5endpoint、境界検証、provider dispatch、LLM出力検証。OpenAI adapter/dummy/domain validatorに依存。

## Provider and Error Infrastructure
`src/lib/openai/{contracts,provider}.ts`, `src/lib/server/{openaiClient,errors,logger,log}.ts`, `src/lib/errorMessages.ts`。キー/明示envに応じたdummy/openai選択、fetch、safe errorとmeta log。scalars型は本文文字列のログを自動で禁止する保証ではなく、現呼出箇所のfieldsを確認した。

## Utilities and Demo Data
`src/lib/{types,upload,flow,markdown,download,dummyOcr,sample,sampleData}.ts`。共通型/画像制限/step/簡易parser/Blob download/架空demo。typesを最下層とする。

## Build and Verification Configuration
ルートnpm/Next/TypeScript/Tailwind/Vitest/ESLint/Prettier/Docker設定、21test files、GitHub CI/optional Claude workflow/PR template。技術バージョンはtechnology-stack、実測の制限はquality assessment参照。
