export interface CompanyEventInfo {
  companyName: string;
  eventName: string;
  eventDate: string;
}

export const EMPTY_COMPANY_EVENT_INFO: CompanyEventInfo = {
  companyName: "",
  eventName: "",
  eventDate: "",
};

export interface OcrResult {
  text: string;
}

// MVP flow aggregate. Persistence identifiers and timestamps belong to later storage phases.
export interface BriefingNote {
  imageFileName?: string;
  companyEventInfo: CompanyEventInfo;
  ocrText: string;
  markdown: string;
}

export type ProcessingState =
  | "idle"
  | "uploading"
  | "ocr_running"
  | "markdown_generating"
  | "ready"
  | "error";
