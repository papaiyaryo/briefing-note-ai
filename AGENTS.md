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

---

## Core Workflow

Development follows:

```txt
Phase Design by Claude Code
→ Phase Approval by Human
→ Issue
→ Branch
→ Implementation
→ Self Review
→ Pull Request
→ GitHub Actions
→ Copilot Review
→ Fix if needed
→ Human Merge
```

Rules:

* Claude Code designs one Phase at a time before Codex implementation begins
* Claude Code writes the Phase-level design file exactly at `docs/codex/phase-{number}/implementation-plan.md`
* Claude Code outputs one design file per Issue as `docs/codex/phase-{number}/issue-{issue-number}.md`
* Human approves the Phase design and Phase implementation start
* Codex reads the approved Phase instructions before implementing Issues in that Phase
* Codex reads the Phase design and the target Issue design file before implementation
* Codex implements Issues in the Phase order, starting from foundation Issues
* 1 Issue = 1 Branch = 1 PR
* Do not push directly to `main`
* Do not solve multiple Issues in one PR
* Do not add MVP-out-of-scope features to MVP Issues
* Before implementation, present a short plan
* If the user explicitly says approval is not needed, proceed after presenting the plan
* Otherwise, wait for approval before editing files
* After implementation, run checks and self-review
* PR title and body should be written in Japanese
* Request GitHub Copilot review when creating a PR
* Human decides final merge

---

## Phase-Based Claude / Codex Workflow

From implementation phases onward, development is coordinated at the Phase level.

### Claude Code responsibility

Claude Code designs one Phase at a time and writes the Phase-level design file exactly at:

```txt
docs/codex/phase-{number}/implementation-plan.md
```

Claude Code must also output one Issue-level design file per target Issue exactly at:

```txt
docs/codex/phase-{number}/issue-{issue-number}.md
```

The Phase-level design file should include:

* Phase objective
* Target Issue list
* Implementation order
* Dependencies between Issues
* Shared design decisions
* Phase-wide verification policy
* Out of scope items

Each Issue-level design file should include:

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
* The target GitHub Issue
* The Phase-level design file at `docs/codex/phase-{number}/implementation-plan.md`, when working from an approved Phase design
* The Issue-level design file at `docs/codex/phase-{number}/issue-{issue-number}.md`, when working from an approved Phase design

Codex must implement from the foundation Issues in the approved order.

Codex must not implement outside:

* The approved Phase design
* The selected Issue scope
* The Issue acceptance criteria

If the Phase instructions and GitHub Issue conflict, Codex must stop and ask the human how to proceed.

---

## Standard Codex Behavior

When asked to work on an Issue, do the following.

### 1. Read context

Read:

* `AGENTS.md`
* `docs/`
* Target GitHub Issue
* Phase-level design file at `docs/codex/phase-{number}/implementation-plan.md`, when working from an approved Phase design
* Issue-level design file at `docs/codex/phase-{number}/issue-{issue-number}.md`, when working from an approved Phase design

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
* Implement only the Issue scope
* Add or update tests if needed
* Update README/docs if needed
* Do not commit secrets or `.env`

### 4. Verify

Run relevant checks:

* lint
* typecheck
* test
* build
* Docker check if the Issue involves Docker

### 5. Self review

Check:

* Acceptance Criteria are satisfied
* No scope creep
* No unnecessary file changes
* No secrets or API keys
* README/docs are consistent
* CI is expected to pass

### 6. PR

Create a PR with:

* Summary
* Changes
* Test Plan
* Out of Scope
* Follow-up Tasks
* Related Issue with `Closes #issue_number`

Use Japanese for PR title and body.
Request `@copilot` as a reviewer.
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

## PR Review Rules

After PR creation:

* Use Copilot mainly for review, summary, and small fixes
* Do not let Copilot make large design decisions
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
Read AGENTS.md, docs/, and Issue #X.
Plan first.
Do not edit files until approval.
After approval, implement using 1 Issue = 1 Branch = 1 PR.
Run checks, self-review, create PR, and stop before merge.
```
