# Reverse Engineering Timestamp

## Run Record

- Date: 2026-10-12
- Commit: 8e528e2f983479805e27f601dbd4683dade323e0
- Breadth: 初回アプリ全体コード調査、Standard。現行app/src/testsとビルド/API/保存境界を読取。履歴文書/未追跡非アプリ資料は浅い確認、生成物/機密情報/AI-DLC内部は対象外。
- Verification: 静的調査のみ。lint/typecheck/test/build、Docker、production、実providerは未実行。
- Source fingerprint: engineのmint出力。HEAD commitとは別のソース指紋。

## Scope of Analysis

```yaml
scope_version: 1
kind: full
intent: company-data-management
fingerprint: 4e67d82c9a1b31ea20c2fd491bf07562aef1c8d9
analyzed:
  paths:
    - ./
  components:
    - App Shell
    - BriefingNoteFlow
    - UploadStep
    - OcrReviewStep
    - WebSupplementStep
    - MarkdownEditStep
    - InterviewReviewView
    - CompanyComparePage
    - Shared UI
    - Client API Layer
    - Structured Memo Domain
    - Web Supplement Domain
    - Interview Review Domain
    - Comparison Storage
    - Server API and Services
    - Provider and Error Infrastructure
    - Utilities and Demo Data
    - Build and Verification Configuration
shallow:
  paths:
    - docs/
    - index.html
```
