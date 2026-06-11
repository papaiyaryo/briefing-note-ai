import type { ReactNode } from "react";

interface ErrorNoticeProps {
  children: ReactNode;
}

// エラーは色だけで伝えず、原因と次の操作をテキストで示す(docs/ui-spec.md)
export function ErrorNotice({ children }: ErrorNoticeProps) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      {children}
    </p>
  );
}
