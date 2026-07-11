import type { ApiErrorCode } from "../openai/contracts";
import { getInterviewReviewProvider } from "../openai/provider";
import { buildDummyInterviewReview } from "../interviewReview/dummy";
import {
  interviewReviewJsonSchema,
  type InterviewReviewStructured,
} from "../interviewReview/schema";
import { validateInterviewReview } from "../interviewReview/validate";
import type { CompanyMemoStructured } from "../structure/schema";
import type { WebSupplementItem } from "../types";
import { extractWebSupplementResponseText } from "./webSupplement";
import {
  createOpenAiClient,
  getOpenAiTimeoutMs,
  type OpenAiResponsesClient,
} from "./openaiClient";

export class InterviewReviewError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = "InterviewReviewError";
  }
}

interface InterviewReviewEnv {
  OPENAI_API_KEY?: string;
  OPENAI_INTERVIEW_REVIEW_MODEL?: string;
  INTERVIEW_REVIEW_PROVIDER?: string;
  OPENAI_TIMEOUT_MS?: string;
  [key: string]: string | undefined;
}

interface RunInterviewReviewOptions {
  env?: InterviewReviewEnv;
  client?: OpenAiResponsesClient;
}

function parseInterviewReviewJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new InterviewReviewError("validation_failed");
  }
}

async function runOpenAiInterviewReview(
  memo: CompanyMemoStructured,
  webSupplements: WebSupplementItem[] | undefined,
  motivationMemo: string | undefined,
  env: InterviewReviewEnv,
  client = createOpenAiClient(env),
): Promise<InterviewReviewStructured> {
  if (!env.OPENAI_INTERVIEW_REVIEW_MODEL) {
    throw new InterviewReviewError("not_configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getOpenAiTimeoutMs(env));

  try {
    const response = await client.createResponse(
      {
        model: env.OPENAI_INTERVIEW_REVIEW_MODEL,
        input: [
          {
            role: "system",
            content:
              "説明会メモを面接直前の復習用に4区分へ整理し、JSONのみ返す。紙メモ由来の事実、個人の印象、HR・社員の強調点、Web補足は混ぜない。企業情報を捏造せず、メモに明記されていない提案やWeb補足由来の項目は必ず confidence を requires_check にする。basis には根拠になった入力セクション名を入れる。",
          },
          {
            role: "user",
            content: JSON.stringify({ memo, webSupplements, motivationMemo }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "interview_review",
            strict: true,
            schema: interviewReviewJsonSchema,
          },
        },
      },
      controller.signal,
    );

    const text = extractWebSupplementResponseText(response);
    if (!text) throw new InterviewReviewError("validation_failed");
    const parsed = validateInterviewReview(parseInterviewReviewJson(text));
    if (!parsed.ok) throw new InterviewReviewError(parsed.code);
    return parsed.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function runInterviewReview(
  memo: CompanyMemoStructured,
  webSupplements?: WebSupplementItem[],
  motivationMemo?: string,
  options: RunInterviewReviewOptions = {},
): Promise<InterviewReviewStructured> {
  const env = options.env ?? process.env;
  if (getInterviewReviewProvider(env as InterviewReviewEnv) === "dummy") {
    return buildDummyInterviewReview(memo, webSupplements, motivationMemo);
  }
  return runOpenAiInterviewReview(
    memo,
    webSupplements,
    motivationMemo,
    env,
    options.client,
  );
}
