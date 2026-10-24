import type { ComparisonClient } from "./client";
import { ClientFailure } from "../workspace/client";
import { ComparisonSession } from "./session";
import { comparisonMarkdown, parseSnapshot } from "./model";
export async function exportComparison(
  session: ComparisonSession,
  port: Pick<ComparisonClient, "readComparison">,
  download: (markdown: string, filename: string) => void,
) {
  const state = session.state,
    display = state.snapshot;
  if (
    !session.owner ||
    state.status !== "ready" ||
    !display ||
    state.restorationRequired ||
    session.hasUnsaved() ||
    state.exportStatus === "checking"
  ) {
    state.exportStatus = "blocked";
    state.message =
      "保存済み参照を再取得し、未保存入力・未確定要求を解決してください。";
    session.notify();
    return;
  }
  const token = session.token(),
    selected = structuredClone(state.selected);
  state.exportStatus = "checking";
  state.message = "保存参照の版を確認しています。";
  session.notify();
  try {
    const fresh = parseSnapshot(await port.readComparison(selected), selected);
    if (!session.accepts(token, true) || session.hasUnsaved()) return;
    const same = display.sources.every(
      (source, index) =>
        source.company.version === fresh.sources[index].company.version &&
        source.memo.version === fresh.sources[index].memo.version,
    );
    if (!same) {
      session.install(fresh, token);
      state.exportStatus = "blocked";
      state.message =
        "参照が変わりました。内容を確認してもう一度出力してください。";
      return;
    }
    download(comparisonMarkdown(display), "saved-company-comparison.md");
    state.exportStatus = "idle";
    state.message = "確認した保存版の比較を出力しました。";
  } catch (error) {
    if (session.accepts(token)) {
      // 再取得経路と同じく、404は消えた参照を特定できないため選択全体の新規保存を止める。
      if (
        error instanceof ClientFailure &&
        error.code === "not_found" &&
        error.status === 404
      )
        session.invalidateReferences(token);
      state.exportStatus = "blocked";
      state.status = "error";
      state.message =
        "参照を確認できないため出力していません。再取得してください。";
    }
  } finally {
    if (state.exportStatus === "checking") state.exportStatus = "idle";
    session.notify();
  }
}
