import { STEPS, type StepId } from "../lib/flow";

interface StepIndicatorProps {
  currentStepId: StepId;
}

export function StepIndicator({ currentStepId }: StepIndicatorProps) {
  return (
    <ol
      aria-label="処理ステップ"
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-4"
    >
      {STEPS.map((step, index) => {
        const isCurrent = step.id === currentStepId;
        return (
          <li
            key={step.id}
            className="flex items-center gap-2 sm:gap-4"
            aria-current={isCurrent ? "step" : undefined}
          >
            {index > 0 && (
              <span aria-hidden="true" className="text-slate-300">
                →
              </span>
            )}
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex size-6 items-center justify-center rounded-full text-xs ${
                  isCurrent
                    ? "bg-teal-700 font-bold text-white"
                    : "border border-slate-300 text-slate-400"
                }`}
              >
                {step.number}
              </span>
              <span
                className={`text-sm ${
                  isCurrent ? "font-bold text-teal-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
