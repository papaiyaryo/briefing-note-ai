export const STEP_IDS = ["upload", "ocr", "markdown"] as const;

export type StepId = (typeof STEP_IDS)[number];

export interface StepDefinition {
  id: StepId;
  number: number;
  label: string;
}

export const STEPS: readonly StepDefinition[] = [
  { id: "upload", number: 1, label: "アップロード" },
  { id: "ocr", number: 2, label: "OCR 確認" },
  { id: "markdown", number: 3, label: "Markdown 編集" },
];

export function getStep(id: StepId): StepDefinition {
  const step = STEPS.find((candidate) => candidate.id === id);
  if (!step) {
    throw new Error(`Unknown step id: ${id}`);
  }
  return step;
}

export function getNextStepId(id: StepId): StepId | null {
  const index = STEP_IDS.indexOf(id);
  return index >= 0 && index < STEP_IDS.length - 1
    ? STEP_IDS[index + 1]
    : null;
}

export function getPreviousStepId(id: StepId): StepId | null {
  const index = STEP_IDS.indexOf(id);
  return index > 0 ? STEP_IDS[index - 1] : null;
}
