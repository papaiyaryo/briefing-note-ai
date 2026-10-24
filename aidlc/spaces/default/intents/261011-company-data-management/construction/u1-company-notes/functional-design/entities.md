# U1：企業・所属メモの論理モデル

## Model

以下のYAMLがデータ形状の正本。物理配置・索引・権限の実設定とSQLは後続設計／コード計画で扱う。

```yaml
{
  "entities": [
    {
      "name": "Principal",
      "description": "認証の検証結果。入力から本人を指定できない",
      "owner": "AccessControl",
      "attributes": [
        {
          "name": "userId",
          "type": "UUID",
          "required": true,
          "unique": true
        },
        {
          "name": "authenticationState",
          "type": "verified",
          "required": true
        }
      ],
      "constraints": [
        "全保護要求で有効性を再確認",
        "永続企業データと認証トークンを返さない"
      ]
    },
    {
      "name": "Company",
      "description": "本人の企業項目の正本",
      "owner": "CompanyWorkspace",
      "attributes": [
        {
          "name": "companyId",
          "type": "UUID",
          "required": true,
          "unique": true,
          "constraints": [
            "名称変更でも不変",
            "削除後も再利用しない"
          ]
        },
        {
          "name": "ownerId",
          "type": "UUID",
          "required": true,
          "references": "Principal.userId",
          "constraints": [
            "認証由来"
          ]
        },
        {
          "name": "name",
          "type": "text",
          "required": true,
          "min": 1,
          "max": 200,
          "constraints": [
            "前後空白除去後に必須",
            "名称一意制約なし"
          ]
        },
        {
          "name": "industry",
          "type": "text",
          "required": false,
          "max": 200,
          "default": null
        },
        {
          "name": "interestLevel",
          "type": "enum",
          "required": false,
          "allowed_values": [
            "high",
            "medium",
            "low",
            "undecided"
          ],
          "default": null
        },
        {
          "name": "personalNote",
          "type": "text",
          "required": false,
          "max": 5000,
          "default": null
        },
        {
          "name": "selectionStatus",
          "type": "enum",
          "required": true,
          "allowed_values": [
            "not_applied",
            "considering",
            "applied",
            "screening",
            "interview",
            "offer",
            "withdrawn",
            "rejected"
          ],
          "default": "not_applied"
        },
        {
          "name": "nextSelectionDate",
          "type": "DateOnly",
          "required": false,
          "default": null
        },
        {
          "name": "applicationDeadline",
          "type": "DateOnly",
          "required": false,
          "default": null
        },
        {
          "name": "officialUrl",
          "type": "URL",
          "required": false,
          "max": 2048,
          "default": null,
          "constraints": [
            "絶対http/https",
            "資格情報なし"
          ]
        },
        {
          "name": "version",
          "type": "opaque-version",
          "required": true
        },
        {
          "name": "childrenVersion",
          "type": "integer",
          "required": true,
          "min": 0,
          "default": 0,
          "constraints": [
            "所属メモの全作成・更新・削除で増加",
            "外部非公開"
          ]
        },
        {
          "name": "createdAt",
          "type": "Instant",
          "required": true
        },
        {
          "name": "updatedAt",
          "type": "Instant",
          "required": true
        }
      ],
      "constraints": [
        "CompanyWorkspaceだけが書込",
        "ownerId＋companyIdを親参照キーにする",
        "版照合・変更・操作結果は原子的",
        "日付は実在する暦日で日時へ変換しない"
      ]
    },
    {
      "name": "Memo",
      "description": "本文・構造化項目・原文・出典を分離した所属メモ",
      "owner": "CompanyWorkspace",
      "attributes": [
        {
          "name": "memoId",
          "type": "UUID",
          "required": true,
          "unique": true,
          "constraints": [
            "削除後も再利用しない"
          ]
        },
        {
          "name": "ownerId",
          "type": "UUID",
          "required": true,
          "references": "Principal.userId"
        },
        {
          "name": "companyId",
          "type": "UUID",
          "required": true,
          "references": "Company.companyId"
        },
        {
          "name": "origin",
          "type": "enum",
          "required": true,
          "allowed_values": [
            "manual",
            "generated"
          ]
        },
        {
          "name": "providerOrigin",
          "type": "enum",
          "required": false,
          "allowed_values": [
            "dummy",
            "openai"
          ],
          "default": null
        },
        {
          "name": "markdown",
          "type": "text",
          "required": true,
          "max": 50000,
          "constraints": [
            "本文を勝手にtrim・再生成しない",
            "手入力は空白だけを拒否"
          ]
        },
        {
          "name": "structuredContent",
          "type": "StructuredContent",
          "required": false,
          "default": null
        },
        {
          "name": "correctedOcr",
          "type": "text",
          "required": false,
          "max": 50000,
          "default": null
        },
        {
          "name": "event",
          "type": "Event",
          "required": false,
          "default": null
        },
        {
          "name": "adoptedWebSources",
          "type": "AdoptedWebSource[]",
          "required": true,
          "max": 50,
          "default": []
        },
        {
          "name": "comparisonReason",
          "type": "text",
          "required": false,
          "max": 5000,
          "default": null
        },
        {
          "name": "version",
          "type": "opaque-version",
          "required": true
        },
        {
          "name": "createdAt",
          "type": "Instant",
          "required": true
        },
        {
          "name": "updatedAt",
          "type": "Instant",
          "required": true
        }
      ],
      "constraints": [
        "所有者と親企業の所有者が一致",
        "所属・origin・providerOriginは作成後不変",
        "manualのproviderOriginはnull",
        "generatedは検証した出自証明が必須",
        "画像・一時URL・ファイル名の保存欄なし",
        "本文変更と構造化項目変更は独立"
      ]
    },
    {
      "name": "WriteOperation",
      "description": "同じ操作を一度だけ確定する記録",
      "owner": "CompanyWorkspace",
      "attributes": [
        {
          "name": "ownerId",
          "type": "UUID",
          "required": true,
          "references": "Principal.userId"
        },
        {
          "name": "operationId",
          "type": "UUID",
          "required": true
        },
        {
          "name": "requestFingerprint",
          "type": "SHA-256",
          "required": true
        },
        {
          "name": "action",
          "type": "enum",
          "required": true,
          "allowed_values": [
            "company_create",
            "company_update",
            "memo_create",
            "memo_update",
            "company_delete",
            "memo_delete"
          ]
        },
        {
          "name": "companyId",
          "type": "UUID",
          "required": true
        },
        {
          "name": "memoId",
          "type": "UUID",
          "required": false
        },
        {
          "name": "resultingVersion",
          "type": "opaque-version",
          "required": false
        },
        {
          "name": "committedAt",
          "type": "Instant",
          "required": true
        }
      ],
      "constraints": [
        "ownerId＋operationIdが一意",
        "対象削除に連動削除しない",
        "本文・OCR・完全要求を複写しない",
        "本人保存領域が存続する間保持",
        "対象への存続必須参照を作らない"
      ]
    },
    {
      "name": "DeletionSnapshot",
      "description": "本人が確認した対象と所属集合",
      "owner": "CompanyWorkspace",
      "attributes": [
        {
          "name": "confirmationId",
          "type": "UUID",
          "required": true,
          "unique": true
        },
        {
          "name": "ownerId",
          "type": "UUID",
          "required": true,
          "references": "Principal.userId"
        },
        {
          "name": "companyId",
          "type": "UUID",
          "required": true
        },
        {
          "name": "memoId",
          "type": "UUID",
          "required": false
        },
        {
          "name": "companyName",
          "type": "text",
          "required": true
        },
        {
          "name": "targetVersion",
          "type": "opaque-version",
          "required": true
        },
        {
          "name": "childrenVersion",
          "type": "integer",
          "required": false
        },
        {
          "name": "affectedMemos",
          "type": "(memoId,version)[]",
          "required": true
        },
        {
          "name": "displayedMemoCount",
          "type": "integer",
          "required": true,
          "min": 0
        },
        {
          "name": "issuedAt",
          "type": "Instant",
          "required": true
        },
        {
          "name": "expiresAt",
          "type": "Instant",
          "required": true
        }
      ],
      "constraints": [
        "10分有効、現在時刻がexpiresAt以上なら期限切れ",
        "企業削除は全子集合、単体メモ削除は対象1件",
        "確認後変更・期限切れ・取得失敗なら削除禁止",
        "確定済み同操作の再送は確認期限より先に照合"
      ]
    },
    {
      "name": "AppSession",
      "description": "認証境界の内部保存。本人への公開モデルではない",
      "owner": "AccessControl",
      "attributes": [
        {
          "name": "sessionHash",
          "type": "digest",
          "required": true,
          "unique": true
        },
        {
          "name": "userId",
          "type": "UUID",
          "required": true,
          "references": "Principal.userId"
        },
        {
          "name": "authSessionId",
          "type": "opaque-id",
          "required": true
        },
        {
          "name": "encryptedTokens",
          "type": "encrypted-value",
          "required": true
        },
        {
          "name": "absoluteExpiresAt",
          "type": "Instant",
          "required": true
        },
        {
          "name": "lastUsedAt",
          "type": "Instant",
          "required": true
        },
        {
          "name": "revokedAt",
          "type": "Instant",
          "required": false,
          "default": null
        },
        {
          "name": "refreshVersion",
          "type": "opaque-version",
          "required": true
        }
      ],
      "constraints": [
        "絶対7日・非操作24時間",
        "暗号鍵は別管理",
        "tokenはブラウザ非公開",
        "refreshを直列化",
        "終了後の不要tokenを消去"
      ]
    },
    {
      "name": "EditDraft",
      "description": "ApplicationExperienceが保つ端末内の未保存入力",
      "owner": "ApplicationExperience",
      "attributes": [
        {
          "name": "draftId",
          "type": "opaque-id",
          "required": true
        },
        {
          "name": "ownerUserId",
          "type": "UUID",
          "required": true
        },
        {
          "name": "selectedCompanyId",
          "type": "UUID",
          "required": false
        },
        {
          "name": "selectedMemoId",
          "type": "UUID",
          "required": false
        },
        {
          "name": "baselineVersions",
          "type": "version-map",
          "required": true
        },
        {
          "name": "draftValues",
          "type": "input-values",
          "required": true
        },
        {
          "name": "dirty",
          "type": "boolean",
          "required": true
        },
        {
          "name": "saveState",
          "type": "enum",
          "required": true,
          "allowed_values": [
            "clean",
            "dirty",
            "saving",
            "saved",
            "rejected",
            "unknown",
            "conflict",
            "reauthentication"
          ]
        },
        {
          "name": "pendingOperation",
          "type": "immutable-request",
          "required": false
        }
      ],
      "constraints": [
        "永続ストア・auditへ書かない",
        "失効中は表示しない",
        "同じ本人の再認証後だけ復帰可",
        "要求途絶では同じ操作IDと要求を保持"
      ]
    }
  ],
  "value_objects": [
    {
      "name": "StructuredContent",
      "fields": {
        "overview": [
          "companyName",
          "eventName",
          "eventDate",
          "speakers"
        ],
        "arrays": [
          "facts",
          "emphasizedPoints",
          "business",
          "strengths",
          "idealCandidate",
          "impressions",
          "concerns",
          "questions",
          "esPoints",
          "nextResearch"
        ]
      },
      "constraints": [
        "全項目必須、空は空文字／空配列",
        "各配列100要素、各文字項目5000 code points、全体256 KiB",
        "overviewの非空eventDateは実在日",
        "本文から自動生成しない",
        "要確認を保持、紙・印象・HR・質問・ESを別項目にする"
      ]
    },
    {
      "name": "Event",
      "fields": [
        "companyName",
        "eventName",
        "eventDate"
      ],
      "constraints": [
        "文字各500 code points",
        "空eventDate可、非空は実在暦日",
        "生成名でCompany.nameを書き換えない"
      ]
    },
    {
      "name": "AdoptedWebSource",
      "fields": [
        "id",
        "category",
        "content",
        "sourceUrl",
        "fetchedAt",
        "confidence",
        "status"
      ],
      "constraints": [
        "status=adopted",
        "confidence=high/medium/low/requires_check",
        "category200、content5000、URL2048 code points",
        "絶対http/https、資格情報なし、取得日時必須",
        "紙の事実と別区分"
      ]
    }
  ],
  "relationships": [
    {
      "from": "Principal",
      "to": "Company",
      "cardinality": "1-to-0..many",
      "direction": "Company.ownerIdからPrincipal.userIdを参照"
    },
    {
      "from": "Company",
      "to": "Memo",
      "cardinality": "1-to-0..many",
      "direction": "MemoのownerId＋companyIdからCompanyを参照"
    },
    {
      "from": "Principal",
      "to": "WriteOperation",
      "cardinality": "1-to-0..many",
      "direction": "WriteOperation.ownerIdからPrincipal.userIdを参照"
    },
    {
      "from": "Principal",
      "to": "DeletionSnapshot",
      "cardinality": "1-to-0..many",
      "direction": "DeletionSnapshot.ownerIdからPrincipal.userIdを参照"
    },
    {
      "from": "Principal",
      "to": "AppSession",
      "cardinality": "1-to-0..many",
      "direction": "AppSession.userIdからPrincipal.userIdを参照"
    }
  ]
}
```

## Entity Summary

本人が企業を所有し、企業に複数メモが所属する。CompanyWorkspaceが企業・メモ・操作結果・削除確認を一貫して扱う。AccessControlが認証と内部セッションを、ApplicationExperienceが未保存入力を所有する。企業削除は所属メモと原子的に確定するが、過去の成功操作記録は保持する。

文字上限はUnicode code points、bytes上限はUTF-8で評価する。任意文字欄の空はnull、本文の空白は保存内容を勝手に変更せず必須検査だけで判定する。名前の一致はIDの一致ではない。

## Sources

- ../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md — U1責任と共同受入。
- ../../../inception/requirements-analysis/requirements.md — FR1〜FR9、NFR1〜NFR7。
- ../../../inception/domain-design/components.md — AccessControl、CompanyWorkspace、ApplicationExperienceの所有権。
- ../../../inception/contract-design/contract-summary.md — C1〜C6の値・正本・再試行・削除契約。
- ../../../inception/delivery-planning/bolt-plan.md — 保存項目、制限、認証期限、検証・着手条件。
- ../../../inception/user-stories/stories.md、../../../inception/refined-mockups/interaction-spec.md — 受入条件と画面操作。
- functional-design-questions.md Q1の本人回答a — 手入力メモへ本人が構造化項目を追加する入口。

