# Roadmap

## Purpose

This roadmap organizes the development phases for briefing-note-ai.
Each phase should be implemented through GitHub Issues using the project workflow:

```text
Issue -> Branch -> Implementation -> Self Review -> Pull Request -> Human Merge
```

## MVP Boundary

MVP includes:

- Image upload
- OCR result display
- Markdown generation
- Markdown editing
- Markdown preview
- `.md` download

MVP does not include:

- Google Drive save
- Web supplement
- Company comparison
- Interview preparation mode
- User accounts
- Multi-device sync
- Calendar integration
- Full applicant tracking

## Phase 0: Design And Development Preparation

Goal:
Prepare the documentation and development rules needed before MVP implementation.

Main work:

- Maintain product, requirements, user flow, and architecture docs.
- Define Markdown output format.
- Define the roadmap and phase boundaries.
- Keep AGENTS.md aligned with the development workflow.
- Prepare issue list, PR template, and CI policy.

Expected outputs:

- `docs/product.md`
- `docs/requirements.md`
- `docs/user-flow.md`
- `docs/architecture.md`
- `docs/output-format.md`
- `docs/roadmap.md`
- `docs/generated-issues/`
- `.github/` templates or CI docs when relevant

## Phase 1: Project Foundation

Goal:
Prepare the minimal technical foundation for the web app.

Main work:

- Set up Next.js, React, and TypeScript.
- Add Tailwind CSS.
- Add ESLint, Prettier, and Vitest.
- Add Dockerfile and docker-compose.yml.
- Document local and Docker startup steps.

Out of scope:

- Product UI beyond minimal scaffolding.
- OCR or LLM integration.

## Phase 2: MVP UI Design

Goal:
Define the MVP screen structure and visual direction before building full UI flows.

Main work:

- Prepare Figma MCP setup notes.
- Create or import MVP UI design.
- Define design system direction for layout, spacing, form controls, and preview areas.
- Keep UI design aligned with the MVP user flow.

Out of scope:

- Production OCR and LLM behavior.
- Post-MVP features such as Drive save or company comparison.

## Phase 3: MVP Frontend UI

Goal:
Build the user-facing MVP workflow.

Main work:

- Implement the step-based screen layout.
- Implement image upload UI and preview.
- Implement company and event metadata inputs.
- Implement OCR result display UI.
- Implement Markdown editor and preview UI.
- Implement loading, empty, and error states.

Out of scope:

- Real OCR provider integration unless a specific issue includes it.
- Real LLM provider integration unless a specific issue includes it.

## Phase 4: MVP Data Flow

Goal:
Connect the MVP UI to local data boundaries and browser-side output behavior.

Main work:

- Define `CompanyMemo` or equivalent data types.
- Separate Markdown generation logic from UI components.
- Implement dummy OCR flow for MVP development.
- Implement `.md` download and file name generation.
- Prepare sample data and demo input.

Out of scope:

- Server-side persistence.
- Google Drive save.
- Web-derived supplemental information.

## Phase 5: MVP Quality And Review

Goal:
Verify the MVP workflow and prepare it for portfolio/demo use.

Main work:

- Add tests for Markdown generation.
- Add basic component tests.
- Document E2E test policy.
- Review security and privacy assumptions.
- Update README for MVP usage.
- Add demo screenshots when appropriate.

Expected checks:

- install
- lint
- typecheck
- test
- build

## Phase 6: OpenAI API Integration

Goal:
Add server-side OpenAI boundaries for OCR, image understanding, or structured Markdown generation.

Main work:

- Design server-side API routes.
- Keep API keys on the server.
- Define structured outputs or JSON schema.
- Validate LLM output before converting to Markdown.
- Add error handling, cost notes, and logging policy.

Out of scope:

- Exposing secrets to the browser.
- Logging uploaded images, full OCR text, generated Markdown, or secrets unnecessarily.

## Phase 7: Google Drive Integration

Goal:
Add optional Google Drive save behavior after MVP.

Main work:

- Document Google Cloud Project and OAuth setup.
- Implement Google login and Drive API boundaries.
- Save Markdown under company-specific folders.
- Define handling for original image save and Drive errors.

Out of scope:

- This phase is not part of MVP.

## Phase 8: Web Supplemental Information

Goal:
Support web-derived company information with clear source separation.

Main work:

- Define web supplement policy and source priority.
- Prefer official company and recruitment pages.
- Generate source-linked supplemental information.
- Add UI for confirming web information before integrating it into Markdown.

Rules:

- Web information must include source URL and retrieval date.
- Web information must not be mixed with briefing facts.

## Phase 9: Company Comparison And Interview Preparation

Goal:
Reuse structured company notes for comparison and interview preparation.

Main work:

- Design comparison data structures.
- Implement comparison tables and preference notes.
- Add interview review mode.
- Generate ES connection points from existing notes.

Out of scope for MVP:

- All work in this phase is post-MVP.

## Phase 10: Portfolio And Development Log

Goal:
Make the project understandable as a portfolio and AI-assisted development example.

Main work:

- Update README for portfolio readers.
- Add technical architecture diagrams.
- Record AI-driven development flow.
- Add Figma design links and demo videos or GIFs.
- Document Copilot PR Review and Codex development log operation.

## Scope Control

Each issue must stay within its phase and acceptance criteria.
If a feature is useful but belongs to a later phase, document it as a follow-up instead of implementing it early.

## Current MVP Definition

The MVP is complete when a user can:

1. Upload one briefing note image.
2. View the image preview.
3. View OCR text.
4. Generate structured Markdown.
5. Edit the Markdown.
6. Preview the Markdown.
7. Download the edited result as a `.md` file.
