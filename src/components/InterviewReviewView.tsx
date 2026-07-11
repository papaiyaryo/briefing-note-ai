import { downloadMarkdownFile } from "../lib/download";
import {
  buildInterviewReviewFileName,
  toInterviewReviewMarkdown,
} from "../lib/interviewReview/toMarkdown";
import type {
  InterviewReviewItem,
  InterviewReviewStructured,
} from "../lib/interviewReview/schema";
import { Button } from "./Button";

interface InterviewReviewViewProps {
  review: InterviewReviewStructured;
  companyName?: string;
  onClose: () => void;
}

const sections: Array<{
  key: keyof InterviewReviewStructured;
  title: string;
  description: string;
}> = [
  {
    key: "motivationPoints",
    title: "志望理由",
    description: "面接で短く伝えたい志望理由の材料です。",
  },
  {
    key: "reverseQuestions",
    title: "逆質問候補",
    description: "面接終盤に確認したい質問候補です。",
  },
  {
    key: "companyUnderstanding",
    title: "企業理解",
    description: "事業・強み・説明会で得た事実の復習ポイントです。",
  },
  {
    key: "selfConnectionPoints",
    title: "自分との接点（ES 接続ポイント）",
    description: "自己PRやESへつなげられる接点です。",
  },
];

function ConfidenceBadge({
  confidence,
}: Pick<InterviewReviewItem, "confidence">) {
  const isRequiresCheck = confidence === "requires_check";
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
        isRequiresCheck
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isRequiresCheck ? "要確認" : "確認済み"}
    </span>
  );
}

export function InterviewReviewView({
  review,
  companyName,
  onClose,
}: InterviewReviewViewProps) {
  const handleDownload = () => {
    downloadMarkdownFile(
      toInterviewReviewMarkdown(review, companyName),
      buildInterviewReviewFileName(companyName),
    );
  };

  return (
    <section className="space-y-6" aria-labelledby="interview-review-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-teal-700">Interview Review</p>
          <h2
            id="interview-review-heading"
            className="text-2xl font-semibold text-slate-900"
          >
            面接前復習メモ
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            メモと採用済み Web
            補足を、志望理由・逆質問・企業理解・自分との接点に分けて確認します。
          </p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          閉じる
        </Button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        要確認の項目は、メモに明記されていない候補や Web
        補足由来の可能性があります。面接前に必ず内容を確認してください。
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.key}
            className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <h3 className="font-semibold text-slate-900">{section.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {section.description}
              </p>
            </div>
            {review[section.key].length === 0 ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                要確認
              </p>
            ) : (
              <ul className="space-y-3">
                {review[section.key].map((item, index) => (
                  <li
                    key={`${section.key}-${index}`}
                    className="space-y-2 rounded-md bg-slate-50 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm leading-6 text-slate-800">
                        {item.content}
                      </p>
                      <ConfidenceBadge confidence={item.confidence} />
                    </div>
                    <p className="text-xs text-slate-500">根拠: {item.basis}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Button onClick={handleDownload}>復習用 Markdown を出力</Button>
      </div>
    </section>
  );
}
