# Team-Level Rules

> This team's affirmed practices and corrections. Loaded after `org.md` as
> strict-additive guidance; contradictions with broader policy are rejected.
> Populated by the practices-discovery affirmation gate. Edit at the gate,
> not directly.

## Way of Working

- Classic / strict Guard Policy と公式承認ゲートを使い、実際のInception計画承認およびCode Generation Plan Approval後にアプリ実装を開始する。
- 1 Intent = 1 release Bolt。UI・API・データ処理・検証を含む利用可能な改善を届け、依存Unitsをunit-major / serialで公式チェックポイント付きで実行する。
- mainを基点・最終対象とし、release/bolt-{number}-{short-description}で日本語PRを1つ作る。次の連番をdelivery planに記録する。内部worktreeのbolt-*名前空間と区別する。
- CI成功後に人間が最終マージする。orgのsquash-merge方針を基準とする。過去merge commitをsquashの実績と扱わない。
- 承認済み要件・設計・範囲・受入基準・検証コマンドの変更は再承認する。旧Issue/Phase文書は背景資料とする。

## Walking Skeleton

- Classicのskeleton: offとorgのscope-dependent方針に従い、最小の一連の動作を先に通す専用の開始チェックポイントは設けない。
- 各Unitの直列実行、公式チェックポイント、TDD、リリース全体の受入確認を維持する。技術層だけでリリースを分けない。
- 根拠は.codex/scopes/aidlc-classic.md。独自のチーム実績を推定した選択ではない。

## Testing Posture

- **Methodology**: tdd
- **Methodology evidence**: 2026-10-10の人間の「TDDで実装したいな」、project.mdおよびAGENTS.mdの明示方針。現行テストやcommit順からTDD実践済みと推定したものではない。
- **Ordering**: 新規・変更する振る舞いと不具合修正は各対象レイヤーのrunner確認後、受入基準に対応する失敗テストを実行するRed、最小実装で通すGreen、テストをgreenに保つRefactorの順に進める。
- 環境不備や無関係の失敗をRedとせず、コマンドと結果を公式Unit記録に残す。アサーションを弱めない。純粋な文書・設定変更は非適用理由と検証方法を承認計画に示す。
- Test StrategyはStandard。Classic/orgのline coverage 80%下限を維持する。現在はcoverage provider・設定・レポートがなく達成未確認。計測対象、provider、CI接続は後続計画・承認で解決し、この段階では新依存を追加しない。
- 現行Vitestはnode環境、純粋関数/API fake client/静的SSR中心。Q1の人間回答Aに従い、既存Vitestと手動の画面確認を受入検証の基本にする。後続の承認計画に具体的な操作、期待結果、証拠の残し方を記載する。新しいブラウザ自動テスト依存を自動採用しない。
- PR前にnpm run lint、npm run typecheck、npm test、npm run buildと承認済み受入基準を検証する。Docker変更時はDockerも確認する。
- テスト/CIはdummy providersを使い、実API秘密情報や個人メモを用いない。公式runtimeはアプリ検査から除外し、公式doctorと信頼済みセッションで確認する。

## Guard Policy

<!-- Affirmed by the team. Mode: strict, relaxed, or off. Strict here holds for every intent, whatever one person asks in chat; relaxed or off here applies to every intent whose policy came from its scope, unless project.md or the person sets another; changing this line changes it. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

- 既存Vercel GitHub integrationが人間のmainマージ後に自動公開する。別のdeployment workflowやcredentialsを追加しない。
- 本番 https://briefing-note-ai.vercel.app で実際のmerge SHAの成功とdeployment URL、公開ページ、/api/healthのstatus: ok / service: briefing-note-ai、承認済み利用導線を確認する。
- 古いdeployment、build/healthだけを機能受入証拠としない。現在リリースの失敗を承認範囲内で直し、公開確認前に次Boltを実装しない。
- Classic終了と公開確認を分け、SHA・確認結果・feedbackを次Intentへ引き継ぐ。この段階では本番照会・操作は未実施。

## Code Style

- Next.js/React/TypeScript strict/Tailwind CSS/Next.js API Routes、既存ESLintとPrettier設定に従う。.prettierrcはセミコロンあり、ダブルクォート、末尾カンマあり。
- UI、HTTP client、server service、schema/検証・変換の現行配置を出発点にする。相対import、named export等の観察を新たな絶対禁止規則にしない。
- 外部APIと秘密情報はサーバー側。構造化JSONの検証、編集可能Markdown、情報カテゴリの分離、WebのURL/取得日、不明情報の要確認を維持する。
- DB・認証・新依存・画面仕様をこの段階で選定せず、細かな既存不具合を今回のリリースへ自動採用しない。
## Forbidden

<!-- Team-specific forbidden patterns -->

## Mandated

<!-- Team-specific mandates -->

## Corrections

<!-- Self-learning loop appends here. -->
