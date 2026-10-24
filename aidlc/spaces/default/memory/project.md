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

Methodology: tdd
Ordering: For each applicable testable layer: Red, then Green, then Refactor.

- ユーザーが本プロジェクトの実装方針として TDD を選択した（2026-10-10 の会話「TDDで実装したいな」）。これは運用方針の選択であり、個々のアプリ Bolt の Inception / Code Generation Plan Approval を代替しない。
- 新規・変更する振る舞いと不具合修正は、受入基準に対応するテストを先に書き、対象の未実装／不具合による失敗を実行して確認する（Red）。実行環境の不備や unrelated failure を Red の証拠にしない。
- テストを通す最小実装を行う（Green）。その後、既存テストと新規テストを green に保って整理する（Refactor）。成功させるためだけに受入基準やアサーションを弱めない。
- 既存のテスト runner / Unit 対象コマンドを Red の前に確認する。対象レイヤー、受入基準とテストの対応、実行コマンド、Red / Green / Refactor の結果を公式 Unit 記録に残す。
- 実行可能な振る舞いを持たないドキュメント・純粋な設定変更に人工的な失敗テストは作らない。適用対象外の理由と検証方法を計画に示す。テスト量・coverage・CI の既存要件は維持する。

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

- NEVER 人間承認・hook信頼・state/audit receiptを偽造/代行したり、承認ガードを無効化して迂回したりする。 (affirmed 2026-10-12)

- NEVER mainに直接pushしたり、AIが最終マージしたり、失敗CIをマージしたりする。 (affirmed 2026-10-12)

- NEVER 成功させるためだけに受入基準やアサーションを弱める。 (affirmed 2026-10-12)

- NEVER .env・秘密情報・hook trust receipts・machine-local paths・実メモ/OCR内容を不必要に記録/コミットする。 (affirmed 2026-10-12)

- NEVER 承認計画に含まれない機能・不具合修正・Express・実外部APIテストを追加する。 (affirmed 2026-10-12)

- NEVER 旧Phase/Issue設計を現在の承認済みIntentの代替にする。 (affirmed 2026-10-12)

## Mandated

- ALWAYS keep briefing facts, impressions, HR/employee emphasis, questions, ES/interview material, and Web supplements separate. Mark uncertainty as 要確認; do not invent company facts.
- ALWAYS follow the approved Inception plan and AGENTS.md; start the next application Bolt only after production verification and renewed Inception approval.

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS Classic/strictと公式ゲートを使い、実際のInception計画承認とCode Generation Plan Approval後にアプリ実装する。 (affirmed 2026-10-12)

- ALWAYS 1 Intentを1リリースBoltとし、依存Unitsを直列・公式チェックポイント付きで実行する。 (affirmed 2026-10-12)

- ALWAYS 新規・変更する振る舞いと不具合修正を受入基準に対応するRed → Green → Refactorで実装し、runner確認と実行証拠を公式Unit記録に残す。 (affirmed 2026-10-12)

- ALWAYS PR前にlint/typecheck/test/buildと受入基準を検証し、Docker変更時はDockerも確認する。 (affirmed 2026-10-12)

- ALWAYS release/bolt-{number}-{short-description}を使い、日本語PRをBoltごとに1つ作り、CI成功後に人間が最終マージする。 (affirmed 2026-10-12)

- ALWAYS 承認済み要件・設計・範囲・受入基準・検証コマンドの変更は再承認を得る。 (affirmed 2026-10-12)

- ALWAYS 実merge SHAのVercel成功・ページ・health・承認済み利用導線を確認してから次Boltを実装する。 (affirmed 2026-10-12)

- ALWAYS テスト/CIはdummy providersを使い、外部API秘密情報をサーバーに保つ。 (affirmed 2026-10-12)

- ALWAYS 事実・印象・HR/社員強調・質問・ES/面接材料・Web補足を分け、不明情報を要確認とし、Web出典URL/取得日を保持する。 (affirmed 2026-10-12)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- 質問ファイルの回答から、現状調査の重点を企業ごとのメモ保存と選考状況・進行中企業数の可視化に向けたデータ構造へ置いた。既知の細かな不具合は調査結果に記録するが、今回のリリースへの修正採用は推定しない。DB・認証・画面の要件は後のInceptionで確認する。 (learned 2026-10-11) <!-- cid:261011-company-data-management:reverse-engineering:e22bb459455dd178d987a238a9f325bec866c325479ed029a77ebd51b62dc06a -->
