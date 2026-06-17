export interface MarkdownDownloadFileNameInput {
  companyName?: string;
  now?: Date;
}

const FALLBACK_BASENAME = "briefing-note";
const MAX_BASENAME_LENGTH = 80;

function sanitizeFileNameSegment(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "")
    .slice(0, MAX_BASENAME_LENGTH)
    .replace(/[.\-\s]+$/g, "");
}

function formatTimestampForFileName(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "").replace(/:/g, "-");
}

export function buildMarkdownDownloadFileName({
  companyName,
  now = new Date(),
}: MarkdownDownloadFileNameInput = {}): string {
  const sanitizedCompanyName = sanitizeFileNameSegment(companyName ?? "");
  if (sanitizedCompanyName) {
    return `${sanitizedCompanyName}-briefing-note.md`;
  }

  return `${FALLBACK_BASENAME}-${formatTimestampForFileName(now)}.md`;
}

export function createMarkdownBlob(markdown: string): Blob {
  return new Blob([markdown], { type: "text/markdown;charset=utf-8" });
}

export function downloadMarkdownFile(markdown: string, fileName: string): void {
  const blob = createMarkdownBlob(markdown);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
