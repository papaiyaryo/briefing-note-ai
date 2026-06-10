export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold text-teal-700">briefing-note-ai</p>
        <h1 className="mb-4 text-3xl leading-tight font-bold text-slate-900 sm:text-5xl">
          企業説明会メモを、就活で使える Markdown へ。
        </h1>
        <p className="text-base leading-8 text-slate-600">
          現在は Docker 開発環境構築フェーズです。OCR、Markdown 生成、
          画像アップロード、外部 API 連携はまだ実装していません。
        </p>
      </section>
    </main>
  );
}
