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

// MVP flow aggregate. Persistence-oriented fields stay optional until storage is introduced.
export interface BriefingNote {
  id?: string;
  imageFileName?: string;
  companyEventInfo: CompanyEventInfo;
  ocrText: string;
  markdown: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProcessingState =
  | "idle"
  | "uploading"
  | "ocr_running"
  | "markdown_generating"
  | "ready"
  | "error";
