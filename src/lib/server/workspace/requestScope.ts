import { AsyncLocalStorage } from "node:async_hooks";
import { WorkspaceError } from "./errors";
const scope = new AsyncLocalStorage<{ deadline: number; committing: number }>();
export function markTransactionCommit() {
  const current = scope.getStore();
  if (current) current.committing++;
  return () => {
    if (current) current.committing--;
  };
}
export function remainingRequestTime() {
  const current = scope.getStore();
  return current ? Math.max(0, current.deadline - performance.now()) : 10000;
}
export async function withRequestDeadline<T>(
  body: () => Promise<T>,
  timeoutMs = 10000,
): Promise<T> {
  return scope.run(
    { deadline: performance.now() + Math.min(timeoutMs, 10000), committing: 0 },
    async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          body(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new WorkspaceError(
                    (scope.getStore()?.committing ?? 0) > 0
                      ? "operation_unknown"
                      : "unavailable",
                  ),
                ),
              Math.max(1, remainingRequestTime()),
            );
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    },
  );
}
