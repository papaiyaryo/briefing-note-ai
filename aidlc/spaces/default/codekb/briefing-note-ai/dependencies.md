# Dependencies

## External Dependencies
全直接依存とlock解決値は `technology-stack.md`。主なsource importsはReact/React DOM、next/server、Next metadata、Zod、Vitest、vitest/config。ESLint configは@eslint/eslintrcのFlatCompatを参照（直接devDependencyには記載なし）。node:path/node:url/Buffer/fetch/File/Blob/AbortController等のruntime APIも使う。脆弱性/更新状況の評価は未実施。

## Internal Dependency Adjacency
| source / 主なexports | direct internal dependencies |
|---|---|
| app pages: Home/Compare/RootLayout | BriefingNoteFlow/CompanyComparePage/globals.css |
| BriefingNoteFlow | flow; markdown reexports; dummyOcr; 4client; structure schema/toMarkdown; types/upload; 4step; StepIndicator; InterviewReviewView |
| UploadStep / OcrReviewStep | upload/markdown types; Button; ErrorNotice |
| WebSupplementStep | types; Button |
| MarkdownEditStep | comparison; structure schema; Button/ErrorNotice/MarkdownPreview; download |
| InterviewReviewView | download; interviewReview schema/toMarkdown; structure schema; types; Button |
| CompanyComparePage | comparison; download; Button |
| MarkdownPreview / StepIndicator | markdown parseMarkdownBlocks / flow STEPS |
| ocrClient / structureClient / interviewReviewClient | openai/contracts; 型(schema/types); ocrClientはerrorMessages |
| webSupplementClient | openai/contracts; types; webSupplement/schema |
| API ocr | contracts/provider; server errors/logger/ocr; upload |
| API structure | contracts/provider; server log/openaiClient/structure |
| API web-supplement | contracts/provider; server errors/log/webSupplement |
| API interview-review | Zod; provider; structure schema; server errors/log/interviewReview |
| API health | next/serverのみ |
| server ocr/runOcr | dummyOcr; provider/contracts/types; openaiClient |
| server structure/runStructure | contracts/provider; structure dummy/schema/validate; types; openaiClient |
| server webSupplement/runWebSupplement | contracts/provider; webSupplement dummy/schema/validate; openaiClient |
| server interviewReview/runInterviewReview | contracts/provider; interviewReview dummy/schema/validate; structure schema/types; webSupplement extractResponseText; openaiClient |
| server errors / logger / log | contracts,errorMessages,openaiClient / contracts / 外部依存なし |
| provider / contracts | contracts / structure・Web・復習schema,types（型import） |
| comparison/storage・toComparisonMarkdown | structure schema（型）、browser localStorage |
| structure validate/dummy/toMarkdown | schema / sampleData,types,schema / markdown,types,schema |
| Web validate/dummy | contracts,schema / schema,validate |
| interviewReview validate/dummy/toMarkdown | contracts,schema / structure schema,types,validate / schema,structure schema,types |
| markdown / sampleData / dummyOcr | types / markdown,types / sampleData |
| upload/download/flow/sample/types/errorMessages | runtime APIまたは外部依存なし（errorMessagesはcontracts型） |
| tests | 対応source、Vitest、UI testsはReact/ReactDOM static SSR |

ランタイムの内部循環importは読んだ経路では見つからない。type-only契約→domain→契約の参照はruntime cycleとは分ける。testとsourceは同居/分離混在。

## Change Surface for Company Management
会社identity/保存を変える場合、comparisonとCompanyComparePageだけでなく、Flow→MarkdownEditStepの保存入力、構造化JSON/手編集Markdown、復習入力、Web metadataが接続面となる。DB追加に伴うauth/ownership/移行契約は現在ない。UI/API/data/verificationを一つのdeployable Boltへまとめる具体案は後続の承認対象。

## External Data Boundaries
browser→自API: imageまたはOCR/JSON/会社名。server→OpenAI: 機能別入力。localStorageとdownloadはbrowser内。外部providerの出力はZod検証後に変換する。画像ストレージ/Drive/DB依存なし。実provider/APIリクエストは今回未実行。
