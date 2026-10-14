# API Documentation

## HTTP Endpoints
全POSTはNext.js nodejs runtime。共通auth/authorization、アプリ側rate-limit、CORS custom middlewareは見つからない。GET healthは外部providerを呼ばない。成功は200。

| Method / Path | 入力 | 成功body | 主なエラーstatus / 根拠 |
|---|---|---|---|
| GET /api/health | なし | status: ok, service: briefing-note-ai, timestamp: ISO string | `app/api/health/route.ts:3` |
| POST /api/ocr | multipart file 1枚、形式/10MiB上限検証 | text, provider | 400 malformed/format; 413 oversize; 503 not_configured; 429; 504 timeout; 502 provider_error。`app/api/ocr/route.ts:25` |
| POST /api/structure | JSON ocrText（非空）, companyEventInfoの3文字列 | memo: CompanyMemoStructured, provider | 400 invalid; 500 not_configured; 422 StructureError; 429 upstream429; その他502。`app/api/structure/route.ts:39,54` |
| POST /api/web-supplement | JSON companyName（非空trim） | result: WebSupplementResult, provider | 400; 503 disabled/missing key/model; 404 company_not_found; 422 validation; 429/504/502。`app/api/web-supplement/route.ts:19,29` |
| POST /api/interview-review | JSON memo（Zod）, optional webSupplements/motivationMemo | review: InterviewReviewStructured, provider | 400 invalid; 503 not_configured; 422 validation; 429/504/502。`app/api/interview-review/route.ts:18,34` |

エラーbodyは `{error:{code,message}}`。8 codeは `src/lib/openai/contracts.ts:43`、共通HTTP写像は `src/lib/server/errors.ts:5`。structureは共通写像と異なりtimeoutを専用分類していない。payload_too_large codeの存在はstructure/Web/復習の入力サイズ上限実装を意味しない。

## Structured Contracts
- CompanyEventInfo: companyName/eventName/eventDate。CompanyMemoStructured: overview（上記+speakers）とfacts/emphasizedPoints/business/strengths/idealCandidate/impressions/concerns/questions/esPoints/nextResearchの配列。`src/lib/structure/schema.ts:3`。
- Web API項目: title/summary/sourceUrl/retrievedAt/confidence(high,medium,low)/needsVerification/sourceType(official,non_official)。browserはcategory/content/fetchedAt/status(pending,adopted,rejected)へ変換する。sourceTypeはbrowser型で保持しない。`src/lib/webSupplement/schema.ts:12`, `src/lib/webSupplementClient.ts:88`。
- 復習: motivationPoints/reverseQuestions/companyUnderstanding/selfConnectionPoints。各content/basis/confidence(confirmed,requires_check)。APIはadopted補足だけをserviceへ渡す。`src/lib/interviewReview/schema.ts:3`, `app/api/interview-review/route.ts:54`。

## Internal API Surfaces
| Surface | contract |
|---|---|
| requestOcr(file, signal?) | OcrApiResponse / OcrRequestError |
| requestStructure(ocrText, companyEventInfo) | StructureApiResponse / StructureRequestError |
| requestWebSupplement(companyName, options) | enabled条件、WebSupplementApiResponse / WebSupplementRequestError |
| requestWebSupplements(ocrText, companyEventInfo) | browser補足配列、空企業/not_configured/company_not_foundは[] |
| requestInterviewReview(memo, webSupplements?, signal?) | InterviewReviewApiResponse / InterviewReviewRequestError |
| validateCompanyMemo / validateWebSupplementResult / validateInterviewReview | unknown→success/failure discriminated result |
| toMarkdown / toInterviewReviewMarkdown / toComparisonMarkdown | structured input→文字列 |
| loadSavedCompanyMemos / saveCompanyMemoForComparison / updateInterestNote | browser v1 localStorage、一覧読取/メモ追加/志望度更新 |

復習APIはmotivationMemoを受けるがbrowser helperは送信しない。企業CRUD API、ノート保存API、認証APIはない。

## External Integrations
`src/lib/server/openaiClient.ts:43`のfetchでResponses APIへPOSTし、Bearerキーをserver envから取る。OCRは画像data URL、structureはOCR/企業イベント情報、Webは企業名とretrievedAt+web_search、復習は構造化メモ/採用補足/志望度メモを送る。OCR/Web/復習はAbortControllerと既定30秒timer、structureには同timerがない。実API、モデルの現在の提供状況、ネットワーク成功は未確認。契約はソースの記述であり外部仕様の最新確認ではない。
