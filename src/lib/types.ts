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

export type WebSupplementConfidence =
  | "high"
  | "medium"
  | "low"
  | "requires_check";

export type WebSupplementStatus = "pending" | "adopted" | "rejected";

export interface WebSupplementItem {
  id: string;
  category: string;
  content: string;
  sourceUrl: string;
  fetchedAt: string;
  confidence: WebSupplementConfidence;
  status: WebSupplementStatus;
}

// MVP flow aggregate. Persistence identifiers and timestamps belong to later storage phases.
export interface BriefingNote {
  imageFileNames?: string[];
  companyEventInfo: CompanyEventInfo;
  ocrText: string;
  markdown: string;
  webSupplements?: WebSupplementItem[];
}

export type ProcessingState =
  | "idle"
  | "uploading"
  | "ocr_running"
  | "markdown_generating"
  | "ready"
  | "error";
