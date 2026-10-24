import { z } from "zod";
import { randomUUID } from "node:crypto";
import { withGenerationDeadline } from "../generation/request";
import {
  ApiError,
  errorResponse as generationErrorResponse,
  toApiError,
} from "../errors";
import { requireOrigin } from "../auth/accessControl";
import type {
  ContractError,
  ErrorCode,
  Result,
  Principal,
} from "../../workspace/contracts";
import { comparisonSelectionSchema, idSchema } from "../../workspace/schema";
import { contractProblem, WorkspaceError } from "./errors";
import { withRequestDeadline } from "./requestScope";
import { getWorkspaceRuntime, type WorkspaceRuntime } from "./runtime";
const statuses: Record<ErrorCode, number> = {
  invalid_input: 400,
  payload_too_large: 413,
  unauthenticated: 401,
  origin_forbidden: 403,
  not_found: 404,
  version_conflict: 409,
  confirmation_changed: 409,
  confirmation_expired: 410,
  operation_reused: 409,
  operation_unknown: 503,
  rate_limited: 429,
  unavailable: 503,
  internal_error: 500,
};
export function jsonResponse(
  value: unknown,
  status = 200,
  headers: HeadersInit = {},
) {
  const result = Response.json(value, { status, headers });
  result.headers.set("Cache-Control", "private, no-store");
  return result;
}
export function problemResponse(problem: ContractError) {
  return jsonResponse(
    problem,
    statuses[problem.error.code],
    problem.error.retryAfterSeconds
      ? { "Retry-After": String(problem.error.retryAfterSeconds) }
      : {},
  );
}
function unwrap<T>(result: Result<T>): T {
  if (!result.ok)
    throw new WorkspaceError(
      result.problem.error.code,
      result.problem.error.fields,
    );
  return result.value;
}
function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success) throw new WorkspaceError("invalid_input");
  return result.data;
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new WorkspaceError("invalid_input");
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 1048576))
    throw new WorkspaceError(
      Number(length) > 1048576 ? "payload_too_large" : "invalid_input",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new WorkspaceError("invalid_input");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1048576) {
        await reader.cancel();
        throw new WorkspaceError("payload_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new WorkspaceError("invalid_input");
  }
}
function query(url: URL, allowed: string[]) {
  const value: Record<string, string> = {};
  for (const [key, item] of url.searchParams) {
    if (!allowed.includes(key) || Object.hasOwn(value, key))
      throw new WorkspaceError("invalid_input");
    value[key] = item;
  }
  return value;
}
const loginSchema = z
  .object({ email: z.email().max(320), password: z.string().min(1).max(1024) })
  .strict();
export function createWorkspaceHandler(
  resolve: () => WorkspaceRuntime = getWorkspaceRuntime,
) {
  return async (request: Request): Promise<Response> => {
    try {
      return await withRequestDeadline(async () => {
        const url = new URL(request.url),
          path = url.pathname.replace(/^\/api\/v1\//, "").split("/");
        const method = request.method,
          runtime = resolve();
        if (method !== "GET")
          requireOrigin(request, runtime.auth.options.origin);
        if (path[0] === "auth") {
          query(url, []);
          if (path.length !== 2) throw new WorkspaceError("not_found");
          if (path[1] === "login" && method === "POST") {
            const body = parse(loginSchema, await readJson(request));
            const result = unwrap(
              await runtime.auth.login(request, body.email, body.password),
            );
            return jsonResponse({ userId: result.userId }, 200, {
              "Set-Cookie": result.cookie,
            });
          }
          if (path[1] === "logout" && method === "POST") {
            parse(z.object({}).strict(), await readJson(request));
            const result = unwrap(await runtime.auth.logout(request));
            return jsonResponse({ ok: true }, 200, {
              "Set-Cookie": result.cookie,
            });
          }
          if (path[1] === "session" && method === "GET") {
            const p = unwrap(await runtime.auth.authenticate(request));
            return jsonResponse({ userId: p.userId });
          }
          throw new WorkspaceError("not_found");
        }
        const principal = unwrap(await runtime.auth.authenticate(request));
        const repo = runtime.repo,
          service = runtime.service;
        const mutate = async (
          kind: Parameters<typeof service.mutate>[0],
          target = {},
        ) => {
          const result = await service.mutate(
            kind,
            principal,
            await readJson(request),
            target,
          );
          return jsonResponse(
            result.outcome,
            !result.replayed &&
              (kind === "company_create" || kind === "memo_create")
              ? 201
              : 200,
          );
        };
        if (path[0] === "board" && path.length === 1 && method === "GET") {
          const q = query(url, ["showEnded"]);
          if (
            q.showEnded !== undefined &&
            q.showEnded !== "true" &&
            q.showEnded !== "false"
          )
            throw new WorkspaceError("invalid_input");
          return jsonResponse(
            await service.board(principal, q.showEnded === "true"),
          );
        }
        if (path[0] === "companies") {
          if (path.length === 1) {
            query(url, []);
            if (method === "POST") return mutate("company_create");
          } else {
            const companyId = parse(idSchema, path[1]);
            if (path.length === 2) {
              query(url, []);
              if (method === "GET")
                return jsonResponse(
                  unwrap(await service.requireCompany(principal, companyId)),
                );
              if (method === "PATCH")
                return mutate("company_update", { companyId });
            }
            if (path[2] === "memos") {
              if (path.length === 3) {
                if (method === "GET") {
                  const q = query(url, ["limit", "cursor"]);
                  if (
                    q.limit !== undefined &&
                    !/^(?:[1-9]\d?|100)$/.test(q.limit)
                  )
                    throw new WorkspaceError("invalid_input");
                  if (
                    q.cursor !== undefined &&
                    (!q.cursor || q.cursor.length > 4096)
                  )
                    throw new WorkspaceError("invalid_input");
                  return jsonResponse(
                    await repo.listMemos(principal, companyId, {
                      ...(q.limit ? { limit: Number(q.limit) } : {}),
                      ...(q.cursor ? { cursor: q.cursor } : {}),
                    }),
                  );
                }
                query(url, []);
                if (method === "POST")
                  return mutate("memo_create", { companyId });
              }
              if (path.length === 4) {
                query(url, []);
                const memoId = parse(idSchema, path[3]);
                if (method === "GET")
                  return jsonResponse(
                    unwrap(
                      await service.readMemo(principal, companyId, memoId),
                    ),
                  );
                if (method === "PATCH")
                  return mutate("memo_update", { companyId, memoId });
              }
            }
          }
        }
        query(url, []);
        if (path.length === 1 && method === "POST") {
          if (path[0] === "deletion-confirmations")
            return jsonResponse(
              await service.confirmDeletion(principal, await readJson(request)),
            );
          if (path[0] === "deletions") return mutate("delete");
          if (path[0] === "comparison-sources") {
            const body = parse(
              comparisonSelectionSchema,
              await readJson(request),
            );
            return jsonResponse(
              unwrap(await service.readComparison(principal, body.selected)),
            );
          }
        }
        if (path[0] === "operations" && path.length === 2 && method === "GET")
          return jsonResponse(
            await repo.lookupOperation(principal, parse(idSchema, path[1])),
          );
        throw new WorkspaceError("not_found");
      });
    } catch (error) {
      return problemResponse(contractProblem(error));
    }
  };
}
export const handleWorkspaceRequest = createWorkspaceHandler();
export interface GenerationContext {
  principal: Principal;
  signal: AbortSignal;
  issueGenerationReceipt: (provider: "dummy" | "openai") => string;
}
export async function guardExisting(
  request: Request,
  body: (context: GenerationContext) => Promise<Response>,
): Promise<Response> {
  const requestId = randomUUID(),
    startedAt = performance.now();
  let status = 500;
  const finish = (response: Response) => {
    status = response.status;
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Request-Id", requestId);
    return response;
  };
  try {
    const runtime = getWorkspaceRuntime();
    requireOrigin(request, runtime.auth.options.origin);
    return finish(
      await withGenerationDeadline(request.signal, async (signal) => {
        const principal = unwrap(await runtime.auth.authenticate(request));
        signal.throwIfAborted();
        return body({
          principal,
          signal,
          issueGenerationReceipt: (provider) =>
            runtime.issueGenerationReceipt(principal.userId, provider),
        });
      }),
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return finish(
        generationErrorResponse(
          new URL(request.url).pathname === "/api/structure"
            ? new ApiError("provider_error", 502)
            : toApiError(error),
        ),
      );
    }
    return finish(problemResponse(contractProblem(error)));
  } finally {
    console.info({
      requestId,
      operation: "generation",
      code: status < 400 ? "ok" : `http_${status}`,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}
