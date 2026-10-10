# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

- 1 development cycle = 1 Intent = 1 release Bolt. A Bolt is a runnable, deployable application improvement a user can try; it can include multiple dependency-linked Units.
- Use Classic with serial Unit-major execution and official approval/checkpoint gates. Begin application implementation only after actual human approval of the Inception plan; then obtain the official Code Generation Plan Approval.
- Requirements, acceptance criteria, design, scope, verification commands, and deployment checks must be decided in Inception. Re-approve changes to approved requirements or design.
- Branch: release/bolt-{number}-{short-description}; root bolt-* names are reserved by the official runtime for internal worktrees. One release PR per Bolt, Japanese title/body, human merge after successful CI. Issues and explicit @claude assistance are optional.
- Keep Phase/Issue designs under docs/codex/ and docs/generated-issues/ as historical input. The approved current Intent is the execution source of truth; resolve material contradictions with the human.

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

- Before the release PR, pass npm run lint, npm run typecheck, npm test, and npm run build; also verify the Bolt's user-facing acceptance criteria.
- Keep the official runtime outside application lint/typecheck/format checks; validate it with aidlc doctor and trusted-session $aidlc --doctor.
- Tests/CI use dummy providers and do not call real OpenAI/Google Drive APIs or log private notes or secrets.

<!-- Project-specific specialisation. -->

## Guard Policy

Mode: strict

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

- Existing Vercel GitHub integration deploys main automatically after human merge. Do not add a second deployment workflow or new credentials.
- Production: https://briefing-note-ai.vercel.app; health: /api/health (status: ok, service: briefing-note-ai).
- Verify the actual merge SHA's Vercel success, the public page, health, and the approved user flow. Fix current-release failures before implementing the next Bolt.
- Classic workflow completion and production verification are separate. Carry the merge SHA, deployment URL/result, checks, and feedback into the next Intent's Inception.

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

- Next.js / React / TypeScript / Tailwind CSS / Vitest / Docker Compose; server-side API Routes handle external API secrets.

<!-- Technology choices locked for this project. -->

## Decided

DECIDED: Official AI-DLC 2.11.0 Codex native runtime; Classic / strict; 1 Intent = 1 release Bolt; human Inception approval and human merge; existing Vercel deployment. (Adoption plan approved in user chat, 2026-10-10 Asia/Tokyo.)

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

- NEVER fabricate human approvals, invoke hooks to impersonate human input, bypass hook trust, or disable approval guards.
- NEVER commit .env, credentials, machine-local state, trust receipts, or personal notes/real OCR contents in lifecycle records.

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

## Mandated

- ALWAYS keep briefing facts, impressions, HR/employee emphasis, questions, ES/interview material, and Web supplements separate. Mark uncertainty as 要確認; do not invent company facts.
- ALWAYS follow the approved Inception plan and AGENTS.md; start the next application Bolt only after production verification and renewed Inception approval.

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
