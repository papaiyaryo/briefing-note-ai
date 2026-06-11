import { parseMarkdownBlocks } from "../lib/markdown";

interface MarkdownPreviewProps {
  markdown: string;
}

// 簡易プレビュー。ページ内の見出し階層を乱さないよう、見出しタグではなく
// スタイル付きテキストとして描画する。
export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return <p className="text-sm text-slate-500">プレビューする内容がありません。</p>;
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <p
                key={index}
                className={`font-bold break-words text-slate-900 ${
                  block.level === 1 ? "text-lg" : "text-base"
                }`}
              >
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul
                key={index}
                className="list-disc space-y-1 pl-5 text-sm text-slate-600"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="break-words">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "code":
            return (
              <pre
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-600"
              >
                {block.text}
              </pre>
            );
          case "paragraph":
            return (
              <p
                key={index}
                className="text-sm break-words whitespace-pre-wrap text-slate-600"
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
