# Technology Stack

## Languages and Runtime
TypeScript strict、TSX/React、CSS、JSON/YAML、Node.js。CI/DockerはNode 22。ローカル実行runtimeバージョンは今回調べていない。`tsconfig.json:2`, `Dockerfile:1`, `.github/workflows/ci.yml:37`。

## Direct Dependencies
宣言はpackage.json、解決値はpackage-lock.jsonのnode_modules項目を読んだ結果。最新バージョン、安全性、実インストール状態を示すものではない。

| package | 宣言 | lock解決 | 用途 |
|---|---|---|---|
| next | ^15.3.0 | 15.5.19 | App Router/API Routes/build |
| react / react-dom | ^19.0.0 | 19.2.7 / 19.2.7 | UI/hooks/static SSR |
| zod | ^4.0.0 | 4.0.0 | runtime schema |
| tailwindcss / @tailwindcss/postcss | ^4.3.0 | 4.3.0 / 4.3.0 | styles/PostCSS |
| typescript | ^5.8.0 | 5.9.3 | typecheck |
| vitest | ^4.1.8 | 4.1.8 | unit tests |
| eslint | ^9.39.4 | 9.39.4 | lint |
| eslint-config-next | ^15.5.19 | 15.5.19 | Next lint rules |
| prettier | ^3.8.4 | 3.8.4 | formatter |
| @types/node | ^22.0.0 | 22.19.20 | Node types |
| @types/react / @types/react-dom | ^19.0.0 | 19.2.17 / 19.2.3 | React types |

## Build and Test Commands
package.json: dev=next dev, build=next build, start=next start, lint=eslint ., typecheck=tsc --noEmit, test=vitest run --passWithNoTests, format/format:check=prettier。
Vitest node environment、coverage設定なし。AI-DLC内部はlint/typecheck/formatter除外。Docker Composeはdev server、volume/cache、3000port。`vitest.config.ts:1`, `docker-compose.yml:1`。

## Hosting and Integrations
運用文書は既存Vercel GitHub integrationによるmain自動公開を指定。本調査はデプロイを照会していない。外部providerはOpenAI Responsesをnative fetchで呼び、OpenAI SDK packageはない。DB/ORM/auth/Drive/E2E browser runnerの直接依存はない。

## Provider Configuration
機能ごとのOCR_PROVIDER/STRUCTURE_PROVIDER/WEB_SUPPLEMENT_PROVIDER/INTERVIEW_REVIEW_PROVIDERのdummy/openaiを優先し、不明値はキー有無で決める。WebにはWEB_SUPPLEMENT_ENABLED=trueが別途必要。`src/lib/openai/provider.ts:11`。
ソース既定モデルはOCR gpt-4.1-mini、structure gpt-4o-mini。Web/復習は専用model envが必須。これらはコード値の記録で、現在の提供可否/推奨選定ではない。実キー/環境実値は読んでいない。
