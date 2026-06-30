export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;

export const ACCEPTED_FORMATS_LABEL = "PNG / JPG / JPEG / WebP";

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGES = 20;

export type UploadValidationError =
  | "unsupported-format"
  | "file-too-large"
  | "too-many-files";

export interface UploadCandidate {
  name: string;
  type: string;
  size: number;
}

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface FileValidationResult {
  file: File;
  error: UploadValidationError | null;
}

function hasAcceptedExtension(name: string): boolean {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
}

function isAcceptedImageType(candidate: UploadCandidate): boolean {
  if (candidate.type) {
    return (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(
      candidate.type,
    );
  }
  // 一部の環境では MIME type が空になるため、拡張子で判定する
  return hasAcceptedExtension(candidate.name);
}

export function validateImageFile(
  candidate: UploadCandidate,
): UploadValidationError | null {
  if (!isAcceptedImageType(candidate)) {
    return "unsupported-format";
  }
  if (candidate.size > MAX_IMAGE_SIZE_BYTES) {
    return "file-too-large";
  }
  return null;
}

export function validateImageFiles(
  incoming: File[],
  currentCount: number,
): { results: FileValidationResult[]; tooMany: boolean } {
  const tooMany = currentCount + incoming.length > MAX_IMAGES;
  const results = incoming.map((file) => ({
    file,
    error: validateImageFile(file),
  }));

  return { results, tooMany };
}

export function getUploadErrorMessage(error: UploadValidationError): string {
  switch (error) {
    case "unsupported-format":
      return `対応していないファイル形式です。${ACCEPTED_FORMATS_LABEL} の画像を選択し直してください。`;
    case "file-too-large":
      return `ファイルサイズが上限(${MAX_IMAGE_SIZE_MB}MB)を超えています。小さい画像を選択し直してください。`;
    case "too-many-files":
      return `画像は最大 ${MAX_IMAGES} 枚まで選択できます。現在の枚数と合わせて ${MAX_IMAGES} 枚以内になるよう選択し直してください。`;
  }
}
