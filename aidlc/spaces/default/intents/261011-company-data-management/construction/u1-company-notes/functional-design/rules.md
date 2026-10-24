# U1：企業・メモ管理の業務規則

## Rules

以下のYAMLが判断規則の正本。上流契約の条件を具体化する。Q1=AはFR6／FR7の本人編集と既存の任意構造化保存の範囲で扱い、新しい自動生成・要求形式を追加しない。

```yaml
{
  "rules": [
    {
      "id": "BR1.1",
      "statement": "全保護操作は検証した本人と対象所有者を照合する",
      "category": "authorization",
      "applies_to": "Principal、Company、Memo",
      "trigger": "読取・作成・更新・削除・比較参照・既存生成／復習",
      "logic": "IF 未認証または失効 THEN 401。IF 他所有者または不存在 THEN 同じ404で内容を非開示",
      "violation_behaviour": "保護内容と変更を返さない",
      "source": [
        "FR1.1",
        "FR1.2",
        "FR1.3",
        "NFR1"
      ]
    },
    {
      "id": "BR1.2",
      "statement": "ログアウト・失効で保護表示と古い応答を無効化する",
      "category": "policy",
      "applies_to": "AppSession、EditDraft",
      "trigger": "ログアウトまたは401",
      "logic": "IF 現在sessionの失効が確定 THEN 成功。UIの要求世代を変え、古い応答を破棄。入力は端末の一時領域へ隔離し同じ本人再認証後のみ復帰",
      "violation_behaviour": "失効書込結果不明なら成功を断定せず確認する",
      "source": [
        "FR1.3",
        "NFR1",
        "NFR3"
      ]
    },
    {
      "id": "BR1.3",
      "statement": "変更要求は同一Originと秘密のサーバー保持を守る",
      "category": "authorization",
      "applies_to": "認証と保護操作",
      "trigger": "ログイン・ログアウト・POST・PATCH",
      "logic": "IF Origin欠如／不一致 THEN 403。本人IDは認証から取得しownerId等の入力指定を拒否。token・鍵・passwordを返却／ログしない",
      "violation_behaviour": "変更なし、公開healthは内容を漏らさない",
      "source": [
        "FR1.2",
        "NFR1"
      ]
    },
    {
      "id": "BR2.1",
      "statement": "企業名だけで未応募の企業を作り、名前では統合しない",
      "category": "validation",
      "applies_to": "Company",
      "trigger": "企業作成",
      "logic": "IF trim後nameが1〜200 code points THEN 安定IDで作成。任意欄null、状態not_applied、同名でも別ID",
      "violation_behaviour": "空名・上限超過は欄別エラー、入力保持",
      "source": [
        "FR2.1",
        "FR2.2"
      ]
    },
    {
      "id": "BR2.2",
      "statement": "企業項目・暦日・URLを検証して明示更新する",
      "category": "validation",
      "applies_to": "Company",
      "trigger": "企業更新",
      "logic": "IF 許可項目・実在日・絶対http/httpsかつ資格情報なし・上限内 THEN その項目だけ変更。未指定は保持、任意nullは消去。日付を日時へ変換しない",
      "violation_behaviour": "不正を拒否しID・所属・以前の有効データを維持",
      "source": [
        "FR2.3",
        "NFR5"
      ]
    },
    {
      "id": "BR2.3",
      "statement": "企業自由メモ・企業志望度・各メモの理由は独立する",
      "category": "policy",
      "applies_to": "Company、Memo",
      "trigger": "保存と再取得",
      "logic": "IF 本人が明示変更 THEN 指定正本のみ更新。interestLevelは企業共通、comparisonReasonは選択メモ、personalNoteは本人記入。null未設定とundecided未定を区別",
      "violation_behaviour": "本文・構造化された事実へ自動転記しない",
      "source": [
        "FR2.4",
        "FR7.2",
        "FR8.1"
      ]
    },
    {
      "id": "BR3.1",
      "statement": "8状態を保存し通常は6状態だけを表示する",
      "category": "constraint",
      "applies_to": "Company、BoardSnapshot",
      "trigger": "ボード取得・表示切替・状態更新",
      "logic": "IF showEnded=false THEN withdrawn/rejectedを隠す。状態選択は8種類間の明示変更を許す。保存確定後だけ状態列へ反映し終了企業の再表示を案内",
      "violation_behaviour": "不正状態は拒否、表示切替で保存内容を変更しない",
      "source": [
        "FR3.1",
        "FR3.2"
      ]
    },
    {
      "id": "BR3.2",
      "statement": "読込・保存0件・表示対象0件・取得失敗を区別する",
      "category": "policy",
      "applies_to": "ボード・詳細・メモ一覧",
      "trigger": "読取応答",
      "logic": "IF 成功 THEN 件数の意味に応じた空表示。IF 失敗 THEN エラーと有限再取得。各企業を1回表示しIDから同じ詳細へ進む",
      "violation_behaviour": "失敗を0件／0社にしない",
      "source": [
        "FR3.3",
        "FR3.4",
        "NFR2"
      ]
    },
    {
      "id": "BR3.3",
      "statement": "主要操作はPC・スマホ・キーボードから到達でき、選考日を強調する",
      "category": "policy",
      "applies_to": "ApplicationExperience",
      "trigger": "画面表示・移動",
      "logic": "IF 日付なし THEN 未設定。次の選考日は明示ラベル付き独立領域で補助項目より大きい太字、締切別。状態・警告は文字。登録／破棄／削除dialog、tab、focus戻しはinteraction-specに従う",
      "violation_behaviour": "色・ドラッグだけを必須にしない、長文を折り返す",
      "source": [
        "FR3.4",
        "FR3.5",
        "NFR5"
      ]
    },
    {
      "id": "BR4.1",
      "statement": "対応中は応募済・書類選考・面接の企業IDだけを数える",
      "category": "calculation",
      "applies_to": "BoardSnapshot",
      "trigger": "同一保存スナップショットの読取",
      "logic": "IF 状態がapplied/screening/interview THEN 1企業=1社。countsByStatus、保存件数、表示件数、active件数を同じ読取から求める",
      "violation_behaviour": "メモ数・カード表示数で代用しない、部分集計を完全値にしない",
      "source": [
        "FR4.1",
        "FR4.2"
      ]
    },
    {
      "id": "BR4.2",
      "statement": "目標5〜15社を示し15社以上だけ警告する",
      "category": "calculation",
      "applies_to": "対応中表示",
      "trigger": "件数表示",
      "logic": "IF activeCompanyCount>=15 THEN 文字付き警告。0/4/5/14は警告なし。途中選考継続は対応中、最終結果保存で対象外。終了表示toggleは不変",
      "violation_behaviour": "16社目を拒否せず自動追加／終了しない",
      "source": [
        "FR4.3",
        "NFR7"
      ]
    },
    {
      "id": "BR5.1",
      "statement": "保存メモの構造・情報区分・出典・出自を検証する",
      "category": "validation",
      "applies_to": "Memo、GeneratedCandidate",
      "trigger": "メモ作成・項目編集",
      "logic": "IF generated THEN 本人とproviderOriginに一致する有効な出自証明と構造必須。全項目を検証し事実・印象・HR・質問・ES・Webを分離。Webはadopted・URL・取得日時必須。不明は要確認／未記載、dummyは検証用と表示",
      "violation_behaviour": "不正候補／不足出典を拒否、入力を保持。生成名で保存先を変更しない",
      "source": [
        "FR5.2",
        "FR5.3",
        "FR5.5",
        "FR7.3",
        "NFR4"
      ]
    },
    {
      "id": "BR5.2",
      "statement": "原画像を保存モデルへ含めない",
      "category": "constraint",
      "applies_to": "Memo保存契約",
      "trigger": "作成・更新",
      "logic": "IF 画像・ファイル・一時URL・画像ファイル名等の未定義保持欄 THEN 拒否。U2の一時表示／解放はU2で確認",
      "violation_behaviour": "原画像をDB・旧ブラウザ保存へ複写しない",
      "source": [
        "FR5.3",
        "FR5.4",
        "NFR4"
      ]
    },
    {
      "id": "BR6.1",
      "statement": "同じ企業に手入力メモを明示作成して再取得する",
      "category": "constraint",
      "applies_to": "Company、Memo",
      "trigger": "手入力作成",
      "logic": "IF 本人所有の親が存在し本文が空白だけでなく上限内 THEN 安定memoIdでmanual、providerOrigin=null、structuredContent未追加ならnullで保存。企業数を増やさない",
      "violation_behaviour": "自由本文をLLM処理・事実化しない",
      "source": [
        "FR6.1",
        "FR6.2"
      ]
    },
    {
      "id": "BR6.2",
      "statement": "本文と構造化項目を別々に明示保存する",
      "category": "constraint",
      "applies_to": "Memo、EditDraft",
      "trigger": "メモ編集／比較用項目の追加",
      "logic": "IF 本人が比較用項目を追加 THEN 全項目の空の編集枠を用意し、本人記入を検証して明示保存。本文・OCR・企業項目を自動変更しない。originはmanualのまま",
      "violation_behaviour": "nullと空の有効構造を区別、不正を拒否し以前の有効データと入力を保持",
      "source": [
        "FR6.1",
        "FR6.2",
        "FR7.1",
        "FR7.2",
        "FR7.3"
      ]
    },
    {
      "id": "BR6.3",
      "statement": "未保存入力・結果不明・破棄確認・安全な本文出力を維持する",
      "category": "policy",
      "applies_to": "EditDraft、ApplicationExperience",
      "trigger": "保存・移動・プレビュー・出力",
      "logic": "IF dirty THEN アプリ内移動で破棄確認、取消は保持。成功は確定後、拒否／unknownは入力保持。本文出力は表示中の保存／未保存本文と同じで区分・出典を保持。HTML等を実行せず安全なリンクだけ使用",
      "violation_behaviour": "ブラウザ終了後の完全復元・自動保存・比較JSON再生成なし",
      "source": [
        "FR6.3",
        "FR9.1",
        "NFR2",
        "NFR5"
      ]
    },
    {
      "id": "BR6.4",
      "statement": "旧版の更新を原子的に拒否する",
      "category": "constraint",
      "applies_to": "Company、Memo",
      "trigger": "企業項目・状態・本文・構造化項目の更新",
      "logic": "IF expectedVersion=currentVersion THEN 指定変更と新server版と操作結果を一緒に確定。ELSE version_conflictで入力保持、最新読取後の明示再編集を待つ",
      "violation_behaviour": "自動マージ／無言上書きなし。メモ変更でchildrenVersionも増加",
      "source": [
        "FR6.2",
        "NFR2",
        "NFR3"
      ]
    },
    {
      "id": "BR6.5",
      "statement": "同じ書込要求は一度だけ確定し結果不明を照合する",
      "category": "constraint",
      "applies_to": "WriteOperation",
      "trigger": "全作成・更新・削除",
      "logic": "IF 同じ本人＋operationId＋検証後の正規化要求 THEN 元の確定結果を返す。IF 内容違い THEN operation_reused。成功済み照合は存在／確認期限より先。新規変化と結果記録を原子的に行う",
      "violation_behaviour": "結果unknownは未実行を断定しない。同じ要求・IDを本人再試行時に使用。対象ID再利用なし",
      "source": [
        "FR2.2",
        "FR6.2",
        "NFR2"
      ]
    },
    {
      "id": "BR6.6",
      "statement": "削除は本人が確認した対象・版・子集合だけへ適用する",
      "category": "constraint",
      "applies_to": "DeletionSnapshot、Company、Memo",
      "trigger": "確認取得・削除確定",
      "logic": "IF 本人・10分期限・対象版・企業子集合が一致 THEN 一つの変更で対象を削除。企業削除は全所属メモ、単体はその1メモ。全メモ書込と企業削除は同じ親を先に直列化",
      "violation_behaviour": "確認後変更はconfirmation_changed、期限切れ410、最新取得失敗は実行禁止、再確認必須、部分削除なし",
      "source": [
        "FR6.4",
        "NFR2",
        "NFR3"
      ]
    },
    {
      "id": "BR6.7",
      "statement": "削除後の参照を無効化し旧ブラウザ保存を変更しない",
      "category": "policy",
      "applies_to": "Company、Memo、比較参照",
      "trigger": "削除結果・再読取",
      "logic": "IF 削除確定 THEN ボード・件数・詳細を再取得し対象参照を無効化。比較UIの無効化／出力停止はU3へ。対象不存在は他対象で代用しない",
      "violation_behaviour": "旧localStorageの移行・自動削除をしない",
      "source": [
        "FR6.4",
        "FR8.4"
      ]
    },
    {
      "id": "BR8.1",
      "statement": "比較へ本人の各企業1つの有効な保存メモを返す",
      "category": "constraint",
      "applies_to": "ComparisonSnapshot",
      "trigger": "比較参照読取",
      "logic": "IF 選択1〜20社・重複companyIdなし・本人所有・所属一致・有効なstructuredContentあり THEN 一つの読取で選択順の企業／メモ／版を返す。理由はメモ、志望度は企業",
      "violation_behaviour": "対象なし・欠損・失敗は有効な比較結果で代用しない。7観点組立て・出力版確認はU3",
      "source": [
        "FR7.1",
        "FR8.1",
        "FR8.2",
        "FR8.3"
      ]
    },
    {
      "id": "BR9.1",
      "statement": "既存の生成・復習・出力を本人確認後に維持する",
      "category": "policy",
      "applies_to": "C5、C6、ApplicationExperience",
      "trigger": "共通入口接続",
      "logic": "IF 既存保護処理 THEN 本人・Origin確認後に既存処理とHTTP写像を維持。structureの例外はbolt-plan通り。healthは公開のstatus/serviceだけ",
      "violation_behaviour": "新DB復習連携・復習結果保存・範囲外既知修正を追加しない",
      "source": [
        "FR9.1",
        "FR9.2",
        "NFR1"
      ]
    },
    {
      "id": "BR10.1",
      "statement": "項目上限と有限要求時間を超えて切り詰め／再送しない",
      "category": "validation",
      "applies_to": "全新保存境界",
      "trigger": "要求検証・通信",
      "logic": "IF 新JSON>1 MiBまたは項目上限超過 THEN 拒否・入力保持。新要求は15秒／処理10秒／保存全体8秒、取消しと後始末あり。GETネットワーク失敗／503は500ms後1回まで、書込自動再送なし",
      "violation_behaviour": "413または該当エラー。待ち続け／無限polling／要求変更による勝手な再実行なし",
      "source": [
        "NFR2",
        "NFR7"
      ]
    }
  ]
}
```

## Rule Summary

| 規則 | 意味 |
|---|---|
| BR1.1 | 全保護操作は検証した本人と対象所有者を照合する |
| BR1.2 | ログアウト・失効で保護表示と古い応答を無効化する |
| BR1.3 | 変更要求は同一Originと秘密のサーバー保持を守る |
| BR2.1 | 企業名だけで未応募の企業を作り、名前では統合しない |
| BR2.2 | 企業項目・暦日・URLを検証して明示更新する |
| BR2.3 | 企業自由メモ・企業志望度・各メモの理由は独立する |
| BR3.1 | 8状態を保存し通常は6状態だけを表示する |
| BR3.2 | 読込・保存0件・表示対象0件・取得失敗を区別する |
| BR3.3 | 主要操作はPC・スマホ・キーボードから到達でき、選考日を強調する |
| BR4.1 | 対応中は応募済・書類選考・面接の企業IDだけを数える |
| BR4.2 | 目標5〜15社を示し15社以上だけ警告する |
| BR5.1 | 保存メモの構造・情報区分・出典・出自を検証する |
| BR5.2 | 原画像を保存モデルへ含めない |
| BR6.1 | 同じ企業に手入力メモを明示作成して再取得する |
| BR6.2 | 本文と構造化項目を別々に明示保存する |
| BR6.3 | 未保存入力・結果不明・破棄確認・安全な本文出力を維持する |
| BR6.4 | 旧版の更新を原子的に拒否する |
| BR6.5 | 同じ書込要求は一度だけ確定し結果不明を照合する |
| BR6.6 | 削除は本人が確認した対象・版・子集合だけへ適用する |
| BR6.7 | 削除後の参照を無効化し旧ブラウザ保存を変更しない |
| BR8.1 | 比較へ本人の各企業1つの有効な保存メモを返す |
| BR9.1 | 既存の生成・復習・出力を本人確認後に維持する |
| BR10.1 | 項目上限と有限要求時間を超えて切り詰め／再送しない |

## Sources

- ../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md — U1責任と共同受入。
- ../../../inception/requirements-analysis/requirements.md — FR1〜FR9、NFR1〜NFR7。
- ../../../inception/domain-design/components.md — AccessControl、CompanyWorkspace、ApplicationExperienceの所有権。
- ../../../inception/contract-design/contract-summary.md — C1〜C6の値・正本・再試行・削除契約。
- ../../../inception/delivery-planning/bolt-plan.md — 保存項目、制限、認証期限、検証・着手条件。
- ../../../inception/user-stories/stories.md、../../../inception/refined-mockups/interaction-spec.md — 受入条件と画面操作。
- functional-design-questions.md Q1の本人回答a — 手入力メモへ本人が構造化項目を追加する入口。

