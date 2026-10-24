import type { OpenAiResponsesClient } from "../openaiClient";
const abortError = () =>
  new DOMException("生成処理を中断しました。", "AbortError");
/** Both transport abort and a finite result boundary, including non-cooperative fakes. */
async function withDeadline<T>(
  external: AbortSignal | undefined,
  ms: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const forward = () => controller.abort();
  if (external?.aborted) controller.abort();
  else external?.addEventListener("abort", forward, { once: true });
  const timer = setTimeout(forward, ms);
  let stop: () => void = () => {};
  try {
    return await new Promise<T>((resolve, reject) => {
      stop = () => reject(abortError());
      controller.signal.addEventListener("abort", stop, { once: true });
      if (controller.signal.aborted) {
        stop();
        return;
      }
      try {
        work(controller.signal).then(
          (value) => (controller.signal.aborted ? stop() : resolve(value)),
          reject,
        );
      } catch (error) {
        reject(error);
      }
    });
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", forward);
    controller.signal.removeEventListener("abort", stop);
  }
}
export function withGenerationDeadline<T>(
  external: AbortSignal | undefined,
  work: (signal: AbortSignal) => Promise<T>,
) {
  return withDeadline(external, 40000, work);
}
export function requestProvider(
  client: OpenAiResponsesClient,
  body: Record<string, unknown>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  const configured = options.timeoutMs ?? 30000;
  const timeout =
    Number.isFinite(configured) && configured > 0
      ? Math.min(configured, 30000)
      : 30000;
  return withDeadline(options.signal, timeout, (signal) =>
    client.createResponse({ ...body, store: false }, signal),
  );
}
