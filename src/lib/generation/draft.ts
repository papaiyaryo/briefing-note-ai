import { DraftVault, workspaceDrafts } from "../workspace/draft";
import type { CompanyEventInfo } from "../types";
import type { GeneratedCandidate } from "../workspace/contracts";
import { copyEditableCandidate } from "./candidate";
import type { FixedRequest } from "../workspace/client";
export interface GenerationDraft {
  correctedOcr: string;
  event: CompanyEventInfo;
  candidate: GeneratedCandidate | null;
}
/** Owner-specific memory only. Recovery is deliberately explicit, never on reload. */
export class GenerationDrafts {
  constructor(private readonly vault = new DraftVault()) {}
  private target(companyId: string) {
    return `generation:${companyId}`;
  }
  put(
    owner: string,
    companyId: string,
    value: GenerationDraft,
    version: string,
  ) {
    this.vault.switchOwner(owner);
    this.vault.put(
      this.target(companyId),
      {
        correctedOcr: value.correctedOcr,
        event: {
          companyName: value.event.companyName,
          eventName: value.event.eventName,
          eventDate: value.event.eventDate,
        },
        candidate: value.candidate
          ? copyEditableCandidate(value.candidate)
          : null,
      },
      version,
    );
  }
  recover(owner: string, companyId: string, version: string) {
    this.vault.switchOwner(owner);
    const draft = this.vault.recover(this.target(companyId), version);
    return draft ? { ...draft, value: draft.value as GenerationDraft } : null;
  }
  dirty(owner: string) {
    this.vault.switchOwner(owner);
    return this.vault.hasDirty();
  }
  discard(owner: string, companyId: string) {
    this.vault.switchOwner(owner);
    this.vault.discard(this.target(companyId));
  }
  markPending(owner: string, companyId: string, request: FixedRequest) {
    this.vault.switchOwner(owner);
    this.vault.markPending(this.target(companyId), request);
  }
  pending(owner: string, companyId: string) {
    this.vault.switchOwner(owner);
    return this.vault.pending(this.target(companyId));
  }
  resolve(owner: string, companyId: string) {
    this.vault.switchOwner(owner);
    this.vault.resolve(this.target(companyId));
  }
}
export const generationDrafts = new GenerationDrafts(workspaceDrafts);
