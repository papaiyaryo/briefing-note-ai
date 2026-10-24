import {
  ClientFailure,
  type FixedRequest,
  type WorkspaceClient,
} from "../workspace/client";
import type {
  GeneratedCandidate,
  MutationOutcome,
  OperationLookup,
} from "../workspace/contracts";
import { createMemoSchema, idSchema } from "../workspace/schema";
import { mapGeneratedCandidate } from "./candidate";
export class GenerationSaveIntent {
  readonly request: FixedRequest;
  state: "ready" | "saving" | "saved" | "rejected" | "unknown" | "verifying" =
    "ready";
  outcome: MutationOutcome | null = null;
  error: unknown = null;
  constructor(
    private readonly client: WorkspaceClient,
    readonly companyId: string,
    candidate: GeneratedCandidate,
    readonly ids: { operationId: string; memoId: string },
    frozenRequest?: FixedRequest,
  ) {
    idSchema.parse(companyId);
    const body = createMemoSchema.parse({
      ...ids,
      candidate: mapGeneratedCandidate(candidate),
    });
    this.ids = Object.freeze({ ...ids });
    this.request = frozenRequest
      ? Object.freeze({ ...frozenRequest })
      : client.prepare(`/api/v1/companies/${companyId}/memos`, "POST", body);
  }
  static restore(
    client: WorkspaceClient,
    companyId: string,
    request: FixedRequest,
  ) {
    if (
      request.method !== "POST" ||
      request.path !== `/api/v1/companies/${idSchema.parse(companyId)}/memos`
    )
      throw new ClientFailure("invalid_input");
    const body = createMemoSchema.parse(JSON.parse(request.body));
    if (body.candidate.origin !== "generated")
      throw new ClientFailure("invalid_input");
    const intent = new GenerationSaveIntent(
      client,
      companyId,
      body.candidate,
      { operationId: body.operationId, memoId: body.memoId },
      request,
    );
    intent.state = "unknown";
    return intent;
  }
  private committed(outcome: MutationOutcome) {
    if (
      outcome.operationId !== this.ids.operationId ||
      outcome.memoId !== this.ids.memoId ||
      outcome.companyId !== this.companyId ||
      outcome.action !== "memo_create"
    )
      throw new ClientFailure("operation_unknown", 0, true);
    this.outcome = outcome;
    this.state = "saved";
  }
  async save(signal?: AbortSignal) {
    if (
      this.state === "saving" ||
      this.state === "verifying" ||
      this.state === "saved"
    )
      return;
    this.state = "saving";
    this.error = null;
    try {
      this.committed(
        await this.client.send<MutationOutcome>(this.request, signal),
      );
    } catch (error) {
      this.error = error;
      this.state =
        error instanceof ClientFailure && !error.unknown
          ? "rejected"
          : "unknown";
    }
  }
  async lookup(signal?: AbortSignal) {
    if (
      this.state === "saving" ||
      this.state === "verifying" ||
      this.state === "saved"
    )
      return;
    this.state = "verifying";
    this.error = null;
    try {
      const result = await this.client.get<OperationLookup>(
        `/api/v1/operations/${this.ids.operationId}`,
        signal,
      );
      if (result.state === "committed") this.committed(result.outcome);
      else this.state = "unknown";
    } catch (error) {
      this.error = error;
      this.state = "unknown";
    }
  }
}
