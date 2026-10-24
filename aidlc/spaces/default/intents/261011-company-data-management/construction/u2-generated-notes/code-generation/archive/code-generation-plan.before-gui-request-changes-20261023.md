## Summary

- Builds: 同じ生成候補のOCR・復習往復後も保存確定を保持し、重複メモを防ぐ修正とnative200%の実操作確認。
- Touches: BriefingNoteFlow、GenerationSavePanel、U2のUI回帰試験と補助、生成保存の確認資料。U1・U3・API・DB・設定は変更しない。
- Tests: 新規8件のFrontend回帰と既存U2全9ファイル・生成回帰、実PG結合、CUA実画面確認。全アプリline coverage80%以上を維持。

## Approval and Scope

U2 revision-02の修正計画。現在の公式directiveはcode-generation／u2-generated-notes、plan_approval.status=revise、feedbackは人間の「じゃあやって」。全U1〜U3既知不具合への変更希望に沿い、U2のR-01（同じ候補の再マウント後の重複保存）とR-02（native200%操作未確認）だけを扱う。新しい実際の人間のCode Generation Plan Approvalを取得するまで実装・試験実行を開始しない。旧計画の完了印を新しい実行証拠として引き継がず、以下はすべて未完了とする。

既存機能を作り直さず、承認済みFR5／FR6.2〜3／FR9、US5.1／US5.2／US6.2／US9.1／US9.2、BR1.2／BR4.1〜3／BR5.1〜2、NFR1.4／NFR2.3〜4／NFR5.2／NFR6.3〜4の履行を修復する。C1／C2／C3／C4／C5、HTTP写像、schema、受入基準、公式checkpointの検証コマンドを変更しない。

同じIntent／release Bolt002を継続し、dirtyな変更と既存worktreeを保全する。U1は修正後の正式レビューとcheckpointが完了し、凍結された依存として読む。旧設計・旧記録の「U1既知3不備は未修正」という記述は当時の履歴であり、現在のU1完了状態を上書きしない。U1 source／produces、U3、共有handoff、認証／DB／外部provider／設定／依存は本修正で変更しない。

実Auth・Bsession・実Supabase・実外部API・Vercelの設定／公開確認は後回しのまま。ローカルdummy Auth/providerと使い捨てPostgreSQL17の検査に実秘密値を要求しない。commit／push／merge／deploy、guard／公式framework変更は含めない。lifecycle・正式承認・review・Step5成果物はroot所有。

## Existing Evidence and Repair Decision

[既存レビュー](reviews/review-01.md)R-01は、保存後にOCR確認→最後の候補へ戻る、または復習→閉じることでGenerationSavePanelが再マウントし、パネル内のintent refが失われreadyに戻る点を指摘する。成功時pendingは消えるため元の確定結果も復元されず、新しいoperationId／memoIdを発行できる。既存限定callback再現のPOST2／distinctMemoIds2は過去の証拠であり、今回のRed／Green実行結果とはしない。

保存意図を画面パネルの寿命から、既存GenerationWorkspaceに相当するBriefingNoteFlowの本人・企業・有効生成候補の寿命へ移す。Flowが一時メモリ内で保持するGenerationSaveIntentをパネルへ渡し、同じ候補のOCR／復習往復では同じ確定結果・安定ID・凍結要求を利用する。既存GenerationSaveIntent、U1 clientとpending復元を再利用し、別DTO、ブラウザ永続領域、DB記録やサーバー全体のgenerationId一意制約を作らない。

| 契機 | 保持／表示／書込 |
|---|---|
| 同じ候補のOCR／復習往復 | savedと元memoIdを保持。新規作成ボタンを出さず、既存メモの取得／表示へ。追加POSTなし |
| 確定後GET失敗からの往復 | 保存確定を失敗へ戻さない。既存memoIdへの再取得を提供。追加POSTなし |
| saving中の往復 | busy・同じ意図を保持。古いパネルcallbackから新意図を作らない。応答適用は本人／企業／候補を照合 |
| unknown／verifyingからの往復・明示再開 | 同じ凍結要求とoperationId／memoIdを保持。操作照会committedなら確定、unknownは未実行と断言せず、照会後の本人再試行だけ同じ要求で送る。自動書込再送なし |
| 本文・構造・OCR等の編集 | オブジェクト参照の変更や本文一致だけで新しい生成候補と判定しない。確定済み候補への後続編集は未保存として保持し、同じU1保存メモへ明示再編集する既存導線を維持 |
| 新しい生成が検証成功 | 本人の明示生成操作に結合した新候補として区別し、保存時だけ新しい意図・IDを割当て可能。新候補の保存を一律禁止しない。失敗した再生成は旧候補の確定結果を維持 |
| 本人／企業変更・終了 | 現在表示へ旧通知・旧候補・結果を流用しない。元本人の未確定要求は既存owner別pending回復規則を保つ。再読込越しの復元は約束しない |

generationReceiptは既存の検証成功結果に付く候補識別の手掛かりとして使えるが、証明文字列を解析して認証判断を増やさない。identityはFlowの明示生成成功と本人／企業への結合で管理する。生成名による保存先変更、単純な内容hashによる全体重複排除、明示新規保存意図の禁止は採用しない。

## Implementation Boundaries and Planned Files

将来の実装で変更を許可するapplication／test／説明資料は次の5ファイルだけ。すべて既存ファイルの変更で、新規sourceは予定しない。

| 対象 | 変更と影響 |
|---|---|
| src/components/BriefingNoteFlow.tsx | 候補寿命に結合した保存意図の所有・パネルへの受渡し、明示生成成功／本人・企業切替時の更新。呼出先は既存GenerationSavePanel／GenerationSaveIntent。中程度の画面状態への影響 |
| src/components/generation/GenerationSavePanel.tsx | 親が保持する意図の表示・購読、再マウント時の確定／pending保持。既存C2送信・照会・同メモ再取得・後続編集導線を維持 |
| tests/u2-generated-notes/ui.test.ts | 下記R1〜R8を追加。親Flowと実Panelのmount／unmountを含むcallback結合、fake HTTPのPOST数・安定ID・全要求内容をassert |
| tests/u2-generated-notes/uiHarness.tsx | 必要最小のU2専用親子mount／unmount補助。U1の共有hookHarnessは読取再利用のみで編集しない。setup失敗とアプリ失敗を区別 |
| docs/generated-notes-checks.md | 修正後の同候補往復、既存メモ再取得、新候補・編集の区別、CUA確認方法と未確認事項を実結果に合わせる |

src/lib/generation/save.ts／draft.ts／candidate.ts、GenerationCandidateFields、各step、U1共有client／schema／contracts／server、全API、DB／migration／repository、U3、package／lockfile／vitest.config.ts／CI／CSSは変更しない。旧CDP helperのbrowser操作は再採用せず、scripts/generated-notes-browser-check.mjsを実行・変更しない。既存scripts/local-workspace-preview.mjsは非browserのdummy preview準備・自身のcleanupだけをそのまま再利用する。

テスト可能な変更レイヤーはFrontend behaviorだけ。データモデル／DB、Repository、Business logicの既存GenerationSaveIntent、APIは振る舞いを変更しないため独立した人工Redを作らない。既存save単体8件、draft単体6件、API／provider／実PG結合は回帰で維持する。文書・設定の読取確認は実行可能な振る舞いがないためTDD非適用、構文・リンク・差分で確認する。5ファイルを越える修正や設計・契約変更が必要ならrootへ返し、計画変更と必要な再承認を先に行う。

今回の計画担当の書込は本書とunit-test-instructions.md、その旧版2本だけ。後続実装の記録更新はrootが現在attemptの正式手順で行い、本担当はStep5／state／audit／reviewを編集しない。

## Sequential Steps and Story Traceability

- [ ] **Step 1 — baseline・runner・設定確認。** 差分と5対象ファイル／凍結依存を読取り、Node22と既存Vitest node／v8／include全app/src／lines80、dummy設定を確認。承認後に変更前の全suiteとunit-test-instructions.mdの既存U2 readiness exact commandを実行し、件数／exitを記録する。新依存・設定変更なし。準備・収集失敗をRedにしない。US5.1／US6.2、NFR6.3〜4。
- [ ] **Step 2 — Frontend Red。** R1〜R8を先に追加し、実Flow・実Panelの往復とmountをU2専用補助で実行。少なくともR1／R2の同候補往復で新規保存が再提示されPOSTが増える実失敗をexact UI commandで記録する。既存8件を単に言い換えず、失敗理由・実出力・exitを記録。現在実装でも通る保全ケースはRedと称さない。US5.1／US5.2／US6.2／US9.2、AC5.1.1／5、AC6.2.2〜4、AC9.2.1〜3、BR4.1〜3。
- [ ] **Step 3 — Frontend Green。** Flowに本人・企業・候補に結合した保存意図を保持しPanelへ渡す最小変更を行う。再マウントでreadyへ戻さず、元の安定IDと確定／unknownを維持。検証成功した明示新候補だけ新しい意図を許可し、後続編集は同じ保存メモへ渡す。R1〜R8と既存UIを同exact commandで通す。US5.1／US6.2／US9.2、BR1.2／BR4.1〜3、NFR1.4／NFR2.3〜4。
- [ ] **Step 4 — Frontend Refactor。** 対象2部品とU2補助内の状態責務・cleanupを整理し、同UI commandとmodel exact commandをgreenに保つ。assertion／timeout／設定／閾値を弱めない。U1・API・保存modelへ変更を広げない。US5.1／US5.2／US6.2／US9.2、NFR6.3〜4。
- [ ] **Step 5 — CUA実画面・native200%の有限確認。** 下記手順で同候補保存→OCR往復→復習往復を実操作し、同企業のメモ件数と既存メモ表示を確認。native200%は100%基準・実倍率・生成入口到達・OCR訂正・生成確認・保存／再取得まで確認する。旧CDP／Playwright／browser fetch操作は使わない。倍率未反映・setup／未到達を製品Redへ読み替えない。US5.1／US9.2、AC5.1.1／5、AC9.2.1〜2、BR4.1／BR5.1〜2、NFR5.2。
- [ ] **Step 6 — 実画面で製品不備が確定した場合の修復。** native200%で実倍率と正しい入口到達を確定後、期待操作の実失敗が対象2部品に起因する場合だけその受入対応Redを先に記録し、再現可能なFrontend回帰を追加してRed→最小Green→Refactor、同CUA操作を再実行する。追加試験数は必要な最小数を実結果へ明記する。問題なしなら修正非適用と実画面の結果を記録。設定不備や5ファイル外の変更が必要ならrootへ返し、無期限試行や別ファイル修正へ進まない。US5.1／US6.2／US9.2、NFR5.2／NFR6.3。
- [x] **Step 7 — 文書・全体検証・自己点検。** docs/generated-notes-checks.mdを実結果へ更新し、U2全9file／既存生成回帰／実PG結合、全体lint・typecheck・test・coverage・build・diff検査を行う。line>=80と既存全suiteを維持し、実DOM・callback・DBの証拠を区別する。失敗／未実施を合格へ昇格しない。US5.1／US5.2／US6.2／US9.1／US9.2、NFR6.4。
- [x] **Step 8 — 公式記録への引継ぎ。** rootが実結果からTDD／手動／verification記録、Step5のcode-summary／traceability／source-manifestと実際の変更範囲を整備する。旧Step14のDB Red順序逸脱とnative200%未達の履歴は消さず、今回証拠を区別して残す。実装完了後の正式review・Unit checkpoint・次段階はroot担当。新Plan Approvalなしの実装やレビュー先行なし。US5.1／US6.2／US9.2、NFR6.3〜4。

## Regression Scenarios and Test Volume

新規は次の8件。変更するFrontend部品は既存の各5〜8件相当のケースを保持し、8件の追加回帰で主要境界を補う。旧132件を新規件数へ含めない。UI既存34件＋8件＝42件、U2全体は既存132件＋8件＝140件を目安とし、実収集数は承認後に記録する。native実不備が別途確定した場合の最小追加分はこの見積りへ混同しない。

| ID | 追加ケース／観測 | 対応 |
|---|---|---|
| R1 | 明示保存→OCRへ→最後の候補へ。saved／元memoIdを保持、POST1、distinctMemoIds1、新規保存なし | US5.1、AC5.1.5／AC6.2.2、BR4.1 |
| R2 | 保存→既存復習生成／表示→閉じる。同じ候補・確定結果、POST増加なし、復習出力境界不変 | US9.2、AC9.2.1〜3、BR5.2 |
| R3 | commit後GET失敗→往復→再取得。同じmemoId、saved維持、再取得だけでPOST増加なし | AC6.2.2〜3、NFR2.4 |
| R4 | 保存応答保留中に往復→応答確定。新意図・二重POSTなし、通知は現在の本人／候補だけ | AC5.1.5、BR1.2／4.1 |
| R5 | unknown→往復→lookup unknown→明示retry。元のbody／operationId／memoId完全一致、lookup前retry無効、自動POSTなし | AC5.1.5／AC6.2.3、NFR2.3 |
| R6 | owner／company切替（同一テスト内で別々に観測）と旧応答。別対象へ旧確定・内容・通知を適用しない | US1.1共同、BR1.2、NFR1.4 |
| R7 | 本人の新しい生成成功後に明示保存。新意図として別IDを許可し、旧往復と区別。失敗生成は旧確定を失わない | AC5.1.1／3、BR3.1／4.1 |
| R8 | 確定後の本文／構造編集と往復。未保存差分を保持、別正本不変、勝手な新規作成なし、同じ保存メモを開く時に既存draft引渡し | US5.2／US6.2、AC6.2.2／4、BR4.2〜3 |

単純なPanel propsだけの再renderを往復の代用にしない。親Flowに残る候補と、実Panelのunmount／remountを組み合わせ、WorkspaceClient fake transportのPOST件数とCreateMemo全内容を確認する。これはReact callback結合であり実DOMの証明ではない。DBの重複防止・原子性は既存generation.integration.test.tsの実migration／PG検査を維持し、今回の画面状態修復だけでDB layerの新Redを作らない。

## Native Zoom and Manual Acceptance

ブラウザ操作にはcomputer-use／CUAの実UIを使用する。実施担当は開始前に当該skillと有効APIの指示を読み、対象ブラウザ／タブだけ操作する。倍率・寸法の読取は許可されたCUAの観測で行い、browser評価でclick／fetchやアプリ状態注入をしない。旧CDP helper、Playwright、新依存は使わない。

1. 承認後、既存local previewの空きポートと他者processを確認し、既存試験PGとdummy previewを専用起動する。5分の既存preview上限を維持し、重いbuildとpreviewを重ねない。既存fixtureの64KiB以下架空画像と架空本人・企業だけを使う。
2. CUAで対象ブラウザの専用作業タブを開き、dummyログイン→架空企業詳細へ実操作する。ブラウザ／版、対象source版、1366×768条件、100%表示、CSS innerWidth／devicePixelRatio／overflowを読取記録する。取得できない値は未計測とする。
3. ブラウザの実UIでnative倍率を200%へ設定し、200%表示を観測する。100%比のCSS幅がおおむね半分、DPRがおおむね2倍であるかを同じウィンドウ条件で照合する。OS倍率を含むためDPR絶対値だけを2と決めない。viewport emulation／CSS scaleは使わず、倍率未反映なら未確認として切り分ける。
4. 企業詳細が読込済みで正しい企業であることを確認し、「画像・OCRからこの企業のメモを作成」を実クリックまたはTab／Enterする。生成見出し・label・focusを確認し、架空画像→OCR→訂正→Web採否→生成→内容確認→明示保存→同企業・同memoの表示まで操作する。各待機は最大30秒、生成は既存browser45秒上限を維持する。フォームの見えるスクロール操作は許可するが横overflowによる主要操作の欠落を成功扱いにしない。
5. 保存後にOCRへ戻る→最後の生成候補→復習生成／表示→閉じるを実操作し、保存確定表示と既存メモを開く導線、企業の所属メモが1件のままであることを確認する。native200%で見えている入口だけの成功を生成・保存全体の成功にしない。
6. 同一条件での確認は初回＋原因を特定した1回の再確認まで。ログイン前／別企業／fixture未投入／倍率未反映／API障害はsetupまたは未確認に分ける。正しい条件で主要操作が不能なら期待結果・実画面・再現手順をRedとして記録しStep6へ。原因未確定は未確認のままrootへ返す。
7. 既承認のPC・390×844・幅320／767／768・200／400%・PCキーボード・label／通知／安全表示条件を維持し、対象2部品に影響する代表保存導線を回帰確認する。native200%以外の過去成功は履歴と区別して参照し、今回未実行を新たな合格と記載しない。
8. finallyで当該作業タブと倍率を元へ戻し、自分が起動したpreviewへstopを送り、自身のNext停止・隔離schema削除を確認する。途中中断・期限到達でも同じcleanupを行う。他者ブラウザ／process／DB／volumeを終了・削除しない。記録には成功／失敗／未確認、実倍率／測定値、到達操作、cleanupを残し、実データ・秘密・machine-local pathsを残さない。

## Exact Commands and Quality Targets

U2の全exact commandは[unit-test-instructions.md](unit-test-instructions.md)に記載する。既存Node22を使用し、変更前baselineと最終検証は承認後に実行する。現在は実行結果を主張しない。

| コマンド | 用途 |
|---|---|
| docker compose -f compose.test.yml up -d --wait | 既存試験専用PG17準備。別DB／volumeを変更しない |
| node scripts/local-workspace-preview.mjs | dummy Auth/provider・使い捨てschemaと既存有限cleanup。browser操作はCUAのみ |
| npm run lint | 全アプリlint |
| npm run typecheck | 全アプリ型検査 |
| npm test | 変更前baseline／最終全suite |
| npm test -- --passWithNoTests=false --coverage | 全app/srcのline>=80、既存v8／include／exclude／threshold維持 |
| npm run build | 全アプリbuild、preview停止後に実行 |
| git diff --check | 対象を含む差分の空白／競合自己点検 |

公式checkpointの登録済み `npm test -- --passWithNoTests=false` を変更しない。本書の全体コマンドはUnit単体手順へ混ぜない。Docker／configを変更しないため新しいDocker構成検査や依存upgradeは追加しない。全体失敗は隠さずrootへ返し、他Unitや設定へ修正を広げない。

## Sources and Historical Limits

- [機能と状態遷移](../functional-design/functional-spec.md)、[業務規則](../functional-design/rules.md)、[一時エンティティ](../functional-design/entities.md)、[画面責務](../functional-design/frontend-components.md)。
- ../nfr-requirements/ のperformance／security／scalability／reliability／observability／tech-stack-decisionsと、../nfr-design/ のperformance／security／scalability／reliability／observability／logical-components。NFR5.2、RD1、LC1を本修正の入力とする。
- ../../../inception/requirements-analysis/requirements.md、../../../inception/user-stories/stories.md、../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md、../../../inception/domain-design/components.md、../../../inception/contract-design/contract-summary.md、../../../inception/delivery-planning/bolt-plan.md。
- [既存レビュー](reviews/review-01.md)、[過去TDD](tdd-evidence.md)、[過去画面確認](manual-evidence.md)。旧DB Step14はfixture失敗であり新しいapp Redではなかった順序逸脱を保持する。今回修正で過去のTDD全面達成を捏造しない。
- [旧計画](code-generation-plan.before-revision-02.md)、[旧試験手順](unit-test-instructions.before-revision-02.md)は変更前内容を保管。古い承認・完了印・成功数は今回attemptの証拠にしない。

native200%の過去最終結果は34中33成功／exit1の未確認。今回の実操作で確認できるまでNFR5.2を全体合格にしない。実Auth／Bsession／Supabase／外部provider／CI job／本番は別の未確認範囲として残し、dependency audit等の既存事項を今回の修正で解消済みとしない。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "tdd",
  "source": "project",
  "ordering": "For each applicable testable layer: Red, then Green, then Refactor.",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: tdd\n- **Methodology evidence**: 2026-10-10の人間の「TDDで実装したいな」、project.mdおよびAGENTS.mdの明示方針。現行テストやcommit順からTDD実践済みと推定したものではない。\n- **Ordering**: 新規・変更する振る舞いと不具合修正は各対象レイヤーのrunner確認後、受入基準に対応する失敗テストを実行するRed、最小実装で通すGreen、テストをgreenに保つRefactorの順に進める。\n- 環境不備や無関係の失敗をRedとせず、コマンドと結果を公式Unit記録に残す。アサーションを弱めない。純粋な文書・設定変更は非適用理由と検証方法を承認計画に示す。\n- Test StrategyはStandard。Classic/orgのline coverage 80%下限を維持する。現在はcoverage provider・設定・レポートがなく達成未確認。計測対象、provider、CI接続は後続計画・承認で解決し、この段階では新依存を追加しない。\n- 現行Vitestはnode環境、純粋関数/API fake client/静的SSR中心。Q1の人間回答Aに従い、既存Vitestと手動の画面確認を受入検証の基本にする。後続の承認計画に具体的な操作、期待結果、証拠の残し方を記載する。新しいブラウザ自動テスト依存を自動採用しない。\n- PR前にnpm run lint、npm run typecheck、npm test、npm run buildと承認済み受入基準を検証する。Docker変更時はDockerも確認する。\n- テスト/CIはdummy providersを使い、実API秘密情報や個人メモを用いない。公式runtimeはアプリ検査から除外し、公式doctorと信頼済みセッションで確認する。"
    },
    {
      "layer": "project",
      "text": "Methodology: tdd\nOrdering: For each applicable testable layer: Red, then Green, then Refactor.\n\n- ユーザーが本プロジェクトの実装方針として TDD を選択した（2026-10-10 の会話「TDDで実装したいな」）。これは運用方針の選択であり、個々のアプリ Bolt の Inception / Code Generation Plan Approval を代替しない。\n- 新規・変更する振る舞いと不具合修正は、受入基準に対応するテストを先に書き、対象の未実装／不具合による失敗を実行して確認する（Red）。実行環境の不備や unrelated failure を Red の証拠にしない。\n- テストを通す最小実装を行う（Green）。その後、既存テストと新規テストを green に保って整理する（Refactor）。成功させるためだけに受入基準やアサーションを弱めない。\n- 既存のテスト runner / Unit 対象コマンドを Red の前に確認する。対象レイヤー、受入基準とテストの対応、実行コマンド、Red / Green / Refactor の結果を公式 Unit 記録に残す。\n- 実行可能な振る舞いを持たないドキュメント・純粋な設定変更に人工的な失敗テストは作らない。適用対象外の理由と検証方法を計画に示す。テスト量・coverage・CI の既存要件は維持する。\n\n- Before the release PR, pass npm run lint, npm run typecheck, npm test, and npm run build; also verify the Bolt's user-facing acceptance criteria.\n- Keep the official runtime outside application lint/typecheck/format checks; validate it with aidlc doctor and trusted-session $aidlc --doctor.\n- Tests/CI use dummy providers and do not call real OpenAI/Google Drive APIs or log private notes or secrets."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "tdd",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - Red: write the failing tests and record the failing command output.",
      "Data model / database behavior - Green: implement only enough behavior to pass.",
      "Data model / database behavior - Refactor: improve the implementation while tests stay green.",
      "Repository / data access - Red: write the failing tests and record the failing command output.",
      "Repository / data access - Green: implement only enough behavior to pass.",
      "Repository / data access - Refactor: improve the implementation while tests stay green.",
      "Business logic - Red: write the failing tests and record the failing command output.",
      "Business logic - Green: implement only enough behavior to pass.",
      "Business logic - Refactor: improve the implementation while tests stay green.",
      "API / endpoint - Red: write the failing tests and record the failing command output.",
      "API / endpoint - Green: implement only enough behavior to pass.",
      "API / endpoint - Refactor: improve the implementation while tests stay green.",
      "Frontend behavior - Red: write the failing tests and record the failing command output.",
      "Frontend behavior - Green: implement only enough behavior to pass.",
      "Frontend behavior - Refactor: improve the implementation while tests stay green.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:a81ff743a3d49d0b372ca217833d3121675db14e36b6566d65f53925c5db9985",
  "contract_sha256": "sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440"
}
```



