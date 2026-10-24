# U1：採用技術と検証の前提

## Decisions

| ID | 採用／維持 | 理由・成立条件 |
|---|---|---|
| NFR6.3 | Next.js／React／TypeScript strict／Tailwind／API Routes、既存Vercel GitHub integration | 現行単一アプリへUI・API・保存を一緒に届ける。Express・別公開経路・第二デプロイworkflowなし |
| NFR1.8 | Supabase Authと専用非公開保存領域、server Auth client候補@supabase/supabase-js、DB driver候補pg／@types/pg | 承認済みbolt-planの選定。通常処理の管理者／service_role全権使用を避け、最小権限＋所有者RLS。実設定は未準備／未検証 |
| NFR2.9 | PostgreSQLの原子的トランザクション、版・親直列化・操作結果、同majorローカルSQL試験DB／CI service | 偽DBだけで整合性を証明せず、実migrationとアダプタを検証。ORM・独立保存サービスを追加しない |
| NFR6.4 | 既存Vitestと手動UI確認、coverage-v8はVitest 4.1.8との一致を承認コード計画で固定 | 現行node／純粋関数／API fake／SSRを基礎とし、新ブラウザ自動テスト依存を追加しない。アプリ全コードlines>=80 |
| NFR5.2 | 既存構造検証とMarkdown表示／出力を維持し、共通正本を参照 | 本文と比較JSONを別に編集し、文字列を安全表示。schemaを勝手に別形式へ置換しない |

## Compatibility and Preconditions

technology-stack.mdのlock解決値は現状調査の記録であり、最新／安全性／実インストールの証拠ではない。現在のNode／Next／依存の互換と新しい選定依存の版はコード計画で公式情報・lockfileと照合して承認する。ここではインストールやアプリ設定変更を行わない。

既存structureルートは未設定500、StructureError 422、429は429、その他provider例外／現在のabortは502というbolt-planの例外を維持する。他の既存ルートのerrors.ts写像を巻き込んで統一しない。本人／Origin追加401／403は別。

導入Boltの人間マージと実SHA公開確認、最新mainのrelease/bolt-002-company-data-management、専用Supabase・本人・鍵／接続／DB版確認、詳細設計・コード計画承認をアプリ実装着手条件として維持する。Q1のバックアップ方針は、アカウントや鍵を用意したという承認・証拠ではない。

## Sources

- ../functional-design/functional-spec.md、rules.md — U1の操作順序・規則。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜NFR7。
- ../../../inception/contract-design/contract-summary.md — C1〜C6・有限再試行・版と原子性。
- ../../../inception/delivery-planning/bolt-plan.md — 選定・入力上限・性能／容量と検証条件。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行構成の静的記録。最新性・稼働証明ではない。
- nfr-requirements-questions.md Q1の本人回答a — 利用して変更した日の終了時と配置／保存形式変更前の手動バックアップ。

