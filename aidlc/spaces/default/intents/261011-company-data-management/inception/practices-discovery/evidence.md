# 開発慣行の根拠

## Sources

lead aidlc-pipeline-deploy-agentによる静的確認。collaborators offのためsupport reviewなし。基点HEAD: 8e528e2f983479805e27f601dbd4683dade323e0。インストール、テスト、CI照会、本番確認、実provider呼出しは未実施。

| 上流資料 | 観察と開発慣行への反映 |
| --- | --- |
| aidlc/spaces/default/codekb/briefing-note-ai/code-structure.md | 単一npm package、page/API→UI→lib、機能別lib、テスト同居/分離混在。現行配置を出発点にする。 |
| aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md | Next/React/TS/Vitest、Node22 CI、4検査、coverage/ブラウザrunner依存なし。現行ツールを起点に未計測を明記。 |
| aidlc/spaces/default/codekb/briefing-note-ai/dependencies.md | client/server/schema分離、fake client、localStorage、DB/auth/E2E契約なし。dummy境界を維持し新依存を決めない。 |
| aidlc/spaces/default/codekb/briefing-note-ai/code-quality-assessment.md | Vitest21 files、静的SSR、保存→reload等の統合/E2E不足、coverage測定なし。成功件数・80%達成を推定しない。 |
| aidlc/spaces/default/codekb/briefing-note-ai/architecture.md | Next API Routes、server provider、JSON検証/Markdown変換、ブラウザ保存。DB/認証は後続設計へ残す。 |
| aidlc/spaces/default/codekb/briefing-note-ai/business-overview.md | 企業メモ/選考状況/進行中社数の改善意図、細かなバグ後回し。機能採用や受入承認を推定しない。 |

## 人間指定と既存規則

- AGENTS.md、aidlc/spaces/default/memory/project.md、aidlc/spaces/default/knowledge/aidlc-shared/bolt-001-adoption.md: Classic/strict、1Intent=1release Bolt、直列Unit、release branch、日本語PR、人間マージ、TDD、4 checks、dummy、Vercel対象SHA公開確認。継続方針であり今回のアプリ承認ではない。
- aidlc/spaces/default/memory/org.md: trunk/main/squash、Classicの80% line coverage下限、scope-dependent skeleton、repo linter/formatter優先。80%下限を弱めない。
- aidlc/spaces/default/memory/team.md: 5章は空コメントテンプレート。例文を実際の慣行としない。
- aidlc-state.md: Brownfield、Standard depth/test strategy、practices-discovery進行中、次requirements-analysis、unit-major/serial/checkpoints enabled。sensors/learnings/plan approval on、collaborators/summary confirmation off。
- .codex/scopes/aidlc-classic.md: skeleton: off。guard_policyのscope既定offではなく実状態とprojectのstrictを維持する。専用skeleton儀式を追加する再質問は不要。

## 限定した設定・履歴観察

- .github/workflows/ci.yml: PR/main push、Node22、lock優先install、lint/typecheck/test/build逐次。実API secrets注入なし。実行成功は照会していない。
- .github/workflows/claude.yml: 明示@claude条件で任意に動く。PRイベントだけの必須reviewではない。
- package.json、vitest.config.ts: vitest run --passWithNoTests、node環境、coverage provider/閾値/scriptなし、browser runner依存なし。無テスト成功を受入証拠にしない。
- eslint.config.mjs、tsconfig.json、.prettierrc: Next lint、TS strict、セミコロン/ダブルクォート/末尾カンマ、公式runtime除外。
- git log -8: TDD設定8e528e2、導入c067d06、旧PR merge commit。merge履歴はorg squash実践済みの証拠でもTDD Red/Green実行の証拠でもない。

## Interview Decisions

practices-discovery-questions.md Q1の人間記入は `[Answer]:a`。選択肢A（既存Vitestと手動の画面確認を基本にする）として統合した。後続の承認計画に具体的な操作・期待結果・証拠の残し方を記載する。新しいブラウザ自動テスト依存をこの選択から自動導入しない。TDD、4つのnpm検査、80% line coverage下限、対象SHAの本番利用導線確認は維持する。

既知のTDD・ブランチ・承認・公開方法とreverse-engineering回答済み製品方向は再質問しない。leadのみで最終統合し、support reviewは行っていない。

## Assumptions & Open Questions

- coverage計測対象・provider・CI接続は未設計。80%下限を維持し後続計画/検証で解決する。達成宣言や依存導入はしない。
- DB・認証・画面・具体的な受入導線は要件/設計/delivery planで決める。
- Q1の回答統合は完了。アプリ計画・追加依存・検証コマンドの承認を代替しない。learnings、段階の最終承認、affirmation/promoteはこの統合作業の対象外であり、親の公式手順で行う。
