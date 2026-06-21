# Security and Privacy Notes for MVP

This document records the MVP security and privacy checks for handling company briefing note images, OCR text, and generated Markdown.

## MVP data handling policy

- The MVP runs the upload, dummy OCR, Markdown generation, editing, preview, and `.md` download flow in the browser.
- The MVP does not send uploaded images, OCR text, or generated Markdown to OpenAI, Google Drive, or any other external service.
- The MVP does not save uploaded images, OCR text, or generated Markdown on a server.
- The MVP does not provide user accounts, authentication, cross-device sync, or cloud persistence.
- Users should download Markdown files locally when they want to keep generated notes.

## Logging policy

- Do not log uploaded image content, OCR full text, generated Markdown, or personally identifiable job-hunting information.
- If debugging logs become necessary, log only non-sensitive metadata such as feature names or success/failure states.
- Before adding server-side API integrations, review logs again to ensure request bodies and secrets are not emitted.

## Secret management policy

- Do not commit real API keys, OAuth secrets, `.env`, or other credential files.
- Commit `.env.example` only with empty placeholder values.
- Keep real local credentials in `.env`, which is ignored by Git and Docker build context.
- Use GitHub Secrets only when a future Issue explicitly requires external API integration in CI or deployment.

## Verification performed for Issue #30

The following checks were performed as part of the Issue #30 implementation:

- Confirmed `git ls-files` tracks `.env.example` but not `.env` or `.env.*` files.
- Confirmed `.gitignore` and `.dockerignore` exclude `.env` and `.env.*` while allowing `.env.example`.
- Confirmed application and test source files do not contain `console.*` calls that would log images, OCR text, Markdown, or personal notes.
- Confirmed the current MVP source does not call `fetch`, `XMLHttpRequest`, or `navigator.sendBeacon` from application code for uploaded note data.

## Re-check timing

Re-run this review before implementing OpenAI, Google Drive, web supplement, authentication, or any server-side persistence feature.
