import type { WebSupplementItem } from "../../lib/types";
import { Button } from "../Button";

interface WebSupplementStepProps {
  supplements: WebSupplementItem[];
  isLoading: boolean;
  isGeneratingMarkdown: boolean;
  onSetStatus: (id: string, status: WebSupplementItem["status"]) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const confidenceLabels: Record<WebSupplementItem["confidence"], string> = {
  high: "信頼度: 高",
  medium: "信頼度: 中",
  low: "信頼度: 低",
  requires_check: "要確認",
};

const confidenceClassNames: Record<WebSupplementItem["confidence"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  low: "border-orange-200 bg-orange-50 text-orange-700",
  requires_check: "border-red-200 bg-red-50 text-red-700",
};

export function WebSupplementStep({
  supplements,
  isLoading,
  isGeneratingMarkdown,
  onSetStatus,
  onBack,
  onNext,
  onSkip,
}: WebSupplementStepProps) {
  const adoptedCount = supplements.filter(
    (item) => item.status === "adopted",
  ).length;
  const isBusy = isLoading || isGeneratingMarkdown;

  return (
    <section className="space-y-6" aria-labelledby="web-supplement-heading">
      <div className="space-y-2">
        <p className="text-sm font-medium text-teal-700">Step 3</p>
        <h2
          id="web-supplement-heading"
          className="text-2xl font-semibold text-slate-900"
        >
          Web 補足候補を確認
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          紙メモ由来の情報とは分けて扱います。採用した候補だけが Markdown の
          「Web 補足情報」に出典付きで追記されます。
        </p>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        ユーザー確認なしに Web
        補足を本文へ混ぜません。信頼度が低い候補や要確認の候補は、
        内容と出典を確認してから採用してください。
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Web 補足候補を準備しています…
        </div>
      ) : supplements.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          表示できる Web 補足候補はありません。補足なしで続行できます。
        </div>
      ) : (
        <div className="space-y-4">
          {supplements.map((item) => {
            const isRejected = item.status === "rejected";
            return (
              <article
                key={item.id}
                className={`space-y-3 rounded-lg border p-4 ${
                  isRejected
                    ? "border-slate-200 bg-slate-50 opacity-70"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.category}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {item.content}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                      confidenceClassNames[item.confidence]
                    }`}
                  >
                    {confidenceLabels[item.confidence]}
                  </span>
                </div>
                <dl className="grid gap-1 text-xs text-slate-500 sm:grid-cols-[auto_1fr]">
                  <dt className="font-medium">出典 URL</dt>
                  <dd className="break-all">{item.sourceUrl}</dd>
                  <dt className="font-medium">取得日</dt>
                  <dd>{item.fetchedAt}</dd>
                  <dt className="font-medium">状態</dt>
                  <dd>
                    {item.status === "adopted"
                      ? "採用"
                      : item.status === "rejected"
                        ? "却下"
                        : "未選択"}
                  </dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      item.status === "adopted" ? "primary" : "secondary"
                    }
                    onClick={() => onSetStatus(item.id, "adopted")}
                    disabled={isBusy}
                  >
                    採用する
                  </Button>
                  <Button
                    variant={
                      item.status === "rejected" ? "primary" : "secondary"
                    }
                    onClick={() => onSetStatus(item.id, "rejected")}
                    disabled={isBusy}
                  >
                    却下する
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack} disabled={isBusy}>
          OCR 確認へ戻る
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onSkip} disabled={isBusy}>
            スキップ（補足なしで続ける）
          </Button>
          <Button onClick={onNext} disabled={isBusy}>
            {isGeneratingMarkdown
              ? "Markdown を生成しています…"
              : `採用した ${adoptedCount} 件で Markdown 生成へ`}
          </Button>
        </div>
      </div>
    </section>
  );
}
