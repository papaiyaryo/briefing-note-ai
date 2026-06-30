# AGENTS.md

## Project

This repository is for developing a web app that converts handwritten company briefing notes into structured Markdown using OCR/LLM.

The app is not just an OCR tool.
It is a job-hunting knowledge tool that helps users reuse briefing notes for company research, ES writing, interview preparation, and follow-up questions.

---

## Product Principle

Always separate the following information:

* Facts from the briefing
* Personal impressions
* Points emphasized by HR or employees
* Questions to ask later
* ES / interview usable points
* Web-derived supplemental information

Do not mix facts, impressions, and web information.

---

## Development Phase

Current Phase:

* Phase 0: 設計・開発準備

Follow GitHub Issues.

Each Issue defines the current phase, scope, out of scope, and acceptance criteria.
Do not implement work outside the selected Issue.

### Phase 00: 修正・手戻りフェーズ

Phase 00 は、実装済み内容の修正・手戻り・運用ルールの補正を扱う特別フェーズである。

Phase 00 の用途:

* 実装済み Issue / PR の不具合修正
* 運用ルール（AGENTS.md 等）の補正
* 設計と実装のずれの是正
* CI / lint / typecheck の修正
* ドキュメント不整合の修正

Phase 00 は新規機能追加フェーズではない。
新規機能は通常の Phase（Phase 1 以降）で扱う。
Phase 00 の Issue も `1 Issue = 1 Branch = 1 PR` ルールを守る。

---

## Core Workflow

Development follows:

```txt
Issue 作成 (Human)
→ @claude 設計依頼
→ Claude が Issue コメントで設計を共有（+ 必要に応じて docs/codex/ に設計ファイルを生成）
→ Phase 設計レビュー・承認 (Human gate)
→ @codex 実装依頼
→ Codex が Issue 本文・Claude 設計コメント・設計ファイルを読んで実装
→ Branch 作成・実装・PR 作成 (Codex)
→ Self Review
→ Pull Request
→ GitHub Actions (CI)
→ Claude Review
→ Fix if needed
→ Human Merge
```

Rules:

* Claude Code designs one Phase at a time before Codex implementation begins
* Claude Code may share design as an Issue comment, as a committed file at `docs/codex/phase-{number}/implementation-plan.md`, or both
* Claude Code may output one Issue-level design file as `docs/codex/phase-{number}/issue-{issue-number}.md`, but may also share Issue-level design as an Issue comment
* Issue comments by Claude are treated as official design input, equivalent to committed design files
* Human approves the Phase design and Phase implementation start
* Codex reads the approved Phase instructions before implementing Issues in that Phase
* Codex reads the GitHub Issue body, Claude design comments on the Issue, and any design files before implementation
* Codex implements Issues in the Phase order, starting from foundation Issues
* 1 Issue = 1 Branch = 1 PR
* Branch names must follow `issue-{number}-{short-description}`
* Branch names may use only lowercase letters, numbers, hyphens, and slashes
* Do not include brackets, spaces, or special Git characters such as `~`, `^`, `:`, `?`, `*`, `[`, `]`, or `\` in branch names
* Do not push directly to `main`
* Do not solve multiple Issues in one PR
* Do not add MVP-out-of-scope features to MVP Issues
* Before implementation, present a short plan
* If the user explicitly says approval is not needed, proceed after presenting the plan
* Otherwise, wait for approval before editing files
* After implementation, run self-review and checks
* PR title and body should be written in Japanese
* Claude Review runs automatically when a PR is opened or marked ready for review
* If re-review is needed, comment `@claude review` on the PR
* Human decides final merge

---

## Phase-Based Claude / Codex Workflow

From implementation phases onward, development is coordinated at the Phase level.

### Claude Code responsibility

Claude Code designs one Phase at a time.

Design output can take either or both of the following forms:

1. **Issue comment**: Claude posts the design as a comment on the target GitHub Issue.
2. **Committed file**: Claude writes the Phase-level design file at `docs/codex/phase-{number}/implementation-plan.md` and/or the Issue-level design file at `docs/codex/phase-{number}/issue-{issue-number}.md`.

Both forms are treated as official design input. Codex must treat Claude's Issue comments as design information, whether or not a design file also exists.

The Phase-level design (comment or file) should include:

* Phase objective
* Target Issue list
* Implementation order
* Dependencies between Issues
* Shared design decisions
* Phase-wide verification policy
* Out of scope items

Each Issue-level design (comment or file) should include:

* Issue summary
* Scope
* Out of scope items
* Implementation steps
* Files likely to change
* Acceptance Criteria mapping
* Verification commands
* Risks / unclear points

Claude Code should not require Codex to make large design decisions during implementation.

### Human approval

Human approval is required before Codex starts implementing a Phase.

Approval covers:

* The Phase design
* The Issue implementation order
* Starting implementation for that Phase

Even when Phase implementation is approved, the repository still follows:

* 1 Issue = 1 Branch = 1 PR
* PRs are created per Issue
* Human decides final merge

### Codex responsibility

Codex implements approved Phase designs Issue by Issue.

Before implementing an Issue, Codex must read:

* `AGENTS.md`
* `docs/`
* The target GitHub Issue body
* All Claude design comments on the target GitHub Issue
* The Phase-level design file at `docs/codex/phase-{number}/implementation-plan.md`, if it exists
* The Issue-level design file at `docs/codex/phase-{number}/issue-{issue-number}.md`, if it exists

Codex must implement from the foundation Issues in the approved order.

Codex must not implement outside:

* The approved Phase design
* The selected Issue scope
* The Issue acceptance criteria

#### Conflict resolution

If any of the following conflict with each other, Codex must stop and ask the human how to proceed before editing any files:

* The GitHub Issue body
* Claude design comments on the Issue
* The Phase-level or Issue-level design file in `docs/codex/`

Do not attempt to resolve design conflicts by choosing one source over another. Always defer to the human.

---

## Standard Codex Behavior

When asked to work on an Issue, do the following.

### 1. Read context

Read:

* `AGENTS.md`
* `docs/`
* Target GitHub Issue body
* All Claude design comments on the target GitHub Issue
* Phase-level design file at `docs/codex/phase-{number}/implementation-plan.md`, if it exists
* Issue-level design file at `docs/codex/phase-{number}/issue-{issue-number}.md`, if it exists

If design information from different sources (Issue comment vs. design file) conflict with each other, stop and ask the human before proceeding.

### 2. Plan first

Before editing files, report:

* Issue summary
* Planned changes
* Files likely to change
* Commands to run
* Risks / unclear points
* Scope concerns

Then stop and wait for approval unless the user has explicitly said approval is not needed.
If the human has already approved the Phase design and Phase implementation start, Codex may proceed through the approved Issues in order while still keeping each Issue to its own branch and PR.

### 3. Implement after approval

After approval:

* Create a branch named `issue-{number}-{short-description}`
* Use only lowercase letters, numbers, hyphens, and slashes in branch names
* Do not include brackets, spaces, or special Git characters such as `~`, `^`, `:`, `?`, `*`, `[`, `]`, or `\` in branch names
* Implement only the Issue scope
* Add or update tests if needed
* Update README/docs if needed
* Do not commit secrets or `.env`

### 4. Self review

Check:

* Acceptance Criteria are satisfied
* No scope creep
* No unnecessary file changes
* No secrets or API keys
* README/docs are consistent
* CI is expected to pass

### 5. Verify

Run relevant checks:

* lint
* typecheck
* test
* build
* Docker check if the Issue involves Docker

### 6. PR

Create a PR with:

* Summary
* Changes
* Test Plan
* Out of Scope
* Follow-up Tasks
* Related Issue with `Closes #issue_number`

Use Japanese for PR title and body.
Request `@claude` as a reviewer.
Claude Review runs automatically when the PR is opened or marked ready for review.
If re-review is needed, comment `@claude review`.
Do not merge.

---

## MVP Scope

MVP includes:

* Image upload
* OCR result display
* Markdown generation
* Markdown editing
* Markdown preview
* `.md` download

---

## Out of Scope for MVP

Do not implement these in MVP Issues:

* Google Drive save
* Web supplement
* Company comparison
* Interview preparation mode
* User accounts
* Multi-device sync
* Calendar integration
* Full applicant tracking

---

## Tech Direction

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Vitest
* Docker / Docker Compose
* Next.js API Routes for server-side API handling

Do not create a separate Express backend unless an Issue explicitly requires it.

---

## API / Secret Rules

* Never expose API keys to the client
* Use server-side API routes for OpenAI and Google Drive
* Do not commit `.env`
* Commit `.env.example` only
* Do not log uploaded images, OCR text, generated Markdown, or secrets unnecessarily
* Do not use real OpenAI or Google Drive secrets in MVP Issues unless the selected Issue explicitly requires it

---

## LLM Output Rules

When using LLMs:

* Prefer structured JSON before Markdown
* Validate LLM output
* Do not invent company facts
* Mark uncertain information as `要確認`
* Separate paper-note information from web-derived information
* Keep generated Markdown editable by the user

---

## GitHub Actions / CI Rules

CI should check:

* install
* lint
* typecheck
* test
* build

Rules:

* Do not merge failing CI
* Do not add deployment until explicitly requested
* Do not expose secrets in CI logs
* Use GitHub Secrets only when necessary

---

## AI Automation Triggers

AI-assisted development is driven by GitHub mentions and PR events:

* `@claude ...` on an Issue or PR starts the Claude workflow for design, questions, or interactive review
* Opening a non-draft PR or marking it ready for review starts Claude Review automatically
* `@claude review` on a PR requests a manual re-review when needed
* `@codex ...` on an Issue or PR, or assignment from Codex Cloud, starts Codex implementation work

Claude Code handles Phase / Issue design and PR review through GitHub Actions.
Codex handles implementation and PR creation through Codex Cloud.
Do not add `ANTHROPIC_API_KEY`; use `CLAUDE_CODE_OAUTH_TOKEN` from GitHub Repository Secrets for Claude Actions.

---

## PR Review Rules

After PR creation:

* Use Claude Code mainly for review, summary, and small fixes
* Do not let Claude Code make large design decisions
* Scope-related decisions belong to the human and Codex
* Fix only review comments that are within the current Issue scope

---

## Documentation

Current docs:

* `docs/product.md`
* `docs/requirements.md`
* `docs/user-flow.md`
* `docs/architecture.md`
* `docs/generated-issues/`
* `docs/codex/`

Phase 0 docs being prepared:

* `docs/output-format.md`
* `docs/roadmap.md`

Keep docs consistent with implementation.

---

## Default User Prompt

If the user says:

```txt
Issue #X を進めて
```

interpret it as:

```txt
Read AGENTS.md, docs/, and Issue #X (body and all Claude design comments).
If design files exist at docs/codex/phase-{number}/, read them too.
If any design sources conflict, stop and ask the human.
Plan first.
Do not edit files until approval.
After approval, implement using 1 Issue = 1 Branch = 1 PR.
Run self-review and checks, create PR, and stop before merge.
```

If the Issue belongs to Phase 00, treat it as a fix or correction task.
Do not add new features in Phase 00 Issues.
