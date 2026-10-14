# 企業メモ管理のデータ受渡し契約 v1

## Purpose and Approval Basis

contract-design-questions.md Q1の実回答aに従い、承認済みの3 Unitを同じNext.jsアプリへ接続する契約を定める。これは実装前の仕様であり、API・認証・DBが稼働済みという意味ではない。1 Intent＝1リリースBolt、直列Unit、正式なInception計画とCode Generation Plan Approvalを維持する。

Unit間は型付きの同一プロセス呼出し。ブラウザとサーバーの境界は同一サイトのHTTP。別サービス・メッセージ基盤・一般公開の連携API・直接DB書込は追加しない。以下のTypeScriptブロックは正式な共有モデル／呼出し／HTTPルート契約で、アプリへコードを追加する指示ではない。型だけでは入力を検証できないため、外部入力は実行時に検証する。後続設計はこの契約を具体的な保存製品・認証製品へ写す。

## Contracts

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---|---|---|---|
| C1 | U1 / AccessControl | U1、U2、U3の保護サーバー処理 | 同期・信頼済み本人コンテキスト | U1 |
| C2 | U1 / CompanyWorkspace | U2 / MemoGeneration | 同期・保存先確認と確認済み候補保存 | U1 |
| C3 | U1 / CompanyWorkspace | U3 / CompanyComparison | 同期・参照スナップショット、版、明示更新 | U1 |
| C4 | U1 | External: 本人のブラウザ | 同一サイトHTTP＋JSON、型付きルート契約 | U1 |
| C5 | U2 | External: 本人のブラウザ | 既存生成HTTP、生成候補共有モデル、既存復習 | U2 |
| C6 | U1 | External: 公開health利用者 | 既存GET /api/health | U1 |

U2→U1とU3→U1の2依存辺をC1〜C3が満たす。U2↔U3の辺は作らない。新比較の組立て・Markdown生成はU3のブラウザ内の派生処理で、独自のDB／別の比較APIは不要。C4の保存正本を取得し、C3のルールで選択版を扱う。旧localStorage比較は従来モデルのまま別入口とする。

## Shared Data Specification

このブロックの型は後続ブロックでも参照する。既存の構造化項目、イベント、採用Web補足を型参照で正確に引き継ぐ。`companyMemoSchema`の全項目（overview、facts、emphasizedPoints、business、strengths、idealCandidate、impressions、concerns、questions、esPoints、nextResearch）を維持する。

```typescript
import type { CompanyMemoStructured } from "src/lib/structure/schema";
import type { CompanyEventInfo, WebSupplementItem } from "src/lib/types";
import type { InterestLevel } from "src/lib/comparison";

type Id = string;         // UUID。名前・表示順・端末には依存しない
type Version = string;    // サーバー発行の不透明な版。クライアントは等値比較のみ
type DateOnly = string;   // 実在する暦日 YYYY-MM-DD。日時へ変換しない
type Instant = string;    // UTC ISO 8601日時
type OperationId = Id;
type SelectionStatus =
  | "not_applied" | "considering" | "applied" | "screening"
  | "interview" | "offer" | "withdrawn" | "rejected";

interface CompanyFields {
  name: string;
  industry: string | null;
  interestLevel: InterestLevel | null;
  personalNote: string | null;
  selectionStatus: SelectionStatus;
  nextSelectionDate: DateOnly | null;
  applicationDeadline: DateOnly | null;
  officialUrl: string | null;
}
interface Company extends CompanyFields {
  companyId: Id;
  version: Version;
  createdAt: Instant;
  updatedAt: Instant;
}
interface AdoptedWebSource extends WebSupplementItem {
  status: "adopted";
}
interface MemoFields {
  markdown: string;
  structuredContent: CompanyMemoStructured | null;
  correctedOcr: string | null;
  event: CompanyEventInfo | null;
  adoptedWebSources: AdoptedWebSource[];
  comparisonReason: string | null;
}
interface Memo extends MemoFields {
  memoId: Id;
  companyId: Id;
  origin: "manual" | "generated";
  providerOrigin: "dummy" | "openai" | null;
  version: Version;
  createdAt: Instant;
  updatedAt: Instant;
}
type MemoSummary = Pick<Memo,
  "memoId" | "companyId" | "origin" | "providerOrigin" |
  "version" | "createdAt" | "updatedAt"> & { hasStructuredContent: boolean };
type CompanyCard = Pick<Company,
  "companyId" | "name" | "industry" | "interestLevel" | "selectionStatus" |
  "nextSelectionDate" | "applicationDeadline" | "version" | "updatedAt">
  & { memoCount: number };
interface BoardSnapshot {
  snapshotVersion: Version;
  cards: CompanyCard[];
  countsByStatus: Record<SelectionStatus, number>;
  savedCompanyCount: number;
  visibleCompanyCount: number;
  activeCompanyCount: number;
  showEnded: boolean;
}
interface Page<T> { items: T[]; nextCursor: string | null }

type ErrorCode =
  | "invalid_input" | "payload_too_large" | "unauthenticated"
  | "origin_forbidden" | "not_found" | "version_conflict"
  | "confirmation_changed" | "confirmation_expired"
  | "operation_reused" | "operation_unknown"
  | "rate_limited" | "unavailable" | "internal_error";
interface ContractError {
  error: {
    code: ErrorCode;
    message: string;
    requestId: Id;
    fields?: Record<string, string>;
    retryAfterSeconds?: number;
  };
}
type Result<T> = { ok: true; value: T } | { ok: false; problem: ContractError };
interface MutationOutcome {
  operationId: OperationId;
  action: "company_create" | "company_update" | "memo_create" |
          "memo_update" | "company_delete" | "memo_delete";
  companyId: Id;
  memoId: Id | null;
  resultingVersion: Version | null; // 削除ならnull
  committedAt: Instant;
}
type OperationLookup =
  | { state: "committed"; outcome: MutationOutcome }
  | { state: "unknown" }; // 失敗・未実行と断定できない
interface DeleteSnapshot {
  confirmationId: Id;
  companyId: Id;
  memoId: Id | null;              // nullなら企業全体
  companyName: string;
  targetVersion: Version;
  affectedMemos: Array<{ memoId: Id; version: Version }>;
  displayedMemoCount: number;
  expiresAt: Instant;
}
interface DeleteRequest {
  operationId: OperationId;
  confirmationId: Id;
}
```

### Values and Validation

- 状態と日本語の対応: not_applied＝未応募、considering＝検討中、applied＝応募済、screening＝書類選考、interview＝面接、offer＝内定、withdrawn＝辞退、rejected＝不採用。名前だけの作成はnot_applied、任意項目null。未設定の志望度nullは表示上「未設定」、undecidedは本人が選んだ「未定」。high／medium／lowは既存ラベルを使う。
- 名前は前後空白を除いた後で空を拒否する。本文は勝手にtrim／再生成しない。任意の文字欄の空欄はnull、比較配列は空配列、手入力の構造化項目なしはnullで表す。構造化項目ありの場合は既存全項目が必要で、欠損を架空の値で補わない。
- `DateOnly`は書式だけでなく実在日を検証する。日付表示をUTC日時経由にしない。イベントの既存空文字は許容し、非空eventDateは同じ暦日検証。`Instant`は出典の取得日時・保存日時に用い、採用Web出典のfetchedAtは検証可能な取得日時とする。
- リンク化するURLはhttp／httpsの絶対URLだけ。javascript等、資格情報入りURLを拒否する。公式URLとWeb出典は別項目。HTML風入力は文字として保持し、画面・Markdown表示で実行しない。取得URLを保存しただけでは、そのURLをサーバーから取りに行かない。
- 永続保存入力に画像バイナリ、base64画像、ファイル、一時object URL、画像ファイル名の保持欄はない。未定義キーを持つ新しい書込要求は拒否する。ownerId、version、日時、生成名によるcompanyId変更を本文から受け付けない。
- 志望度はCompany、比較理由はMemoだけで更新する。MemoのoriginとproviderOrigin、companyIdは作成後に編集しない。本文、構造化項目、OCR、イベント、出典の更新は明示した項目に限定する。
- 100企業／1000メモ／約10000字／1社50メモは代表fixtureであって保存上限ではない。文字数・配列数・要求bytesの具体上限はDelivery Planningで容量とともに確定し、未確定のまま実装を許可しない。15社警告はAPIの登録制限にしない。

## C1 — Trusted Principal and Protected Operations

```typescript
declare const verifiedPrincipal: unique symbol;
interface Principal {
  readonly userId: Id;
  readonly [verifiedPrincipal]: true;
}
interface AccessControlV1 {
  authenticate(request: Request): Promise<Result<Principal>>;
}
```

Principalはサーバーの認証アダプタだけが作る。型の印は権限判定の代替にならず、全要求で認証検証する。CompanyWorkspaceが対象の保存ownerIdとPrincipal.userIdを照合する。全一覧・詳細・更新・削除・比較参照、既存OCR／生成／Web補足／復習を保護する。認証なしは401。本人に見えない対象と存在しない対象は同じ404で内容・他人の件数を返さない。

新保存APIと保護された応答は`Cache-Control: private, no-store`。ブラウザ認証はサーバーが検証する安全なセッションを用い、秘密値をJavaScriptへ渡さない。Cookie利用時はHttpOnly／本番Secure／適切なSameSiteとCSRF対策を設定する。新旧の変更POST／PATCHと生成POSTはOriginを同一サイトへ限定し、欠如・不一致を403で拒否する。本人ログインの方式・入口・セッション期限／更新／失効の実設定は認証製品の選定と一緒にDelivery Planningで承認する。Originだけで本人確認を代用しない。

401／ログアウト後は保護画面のメモ・比較キャッシュを消し、古い要求を中止または応答を破棄する。未保存の入力はその端末の一時メモリに保ち、別アカウントへ再表示・自動保存しない。同じ本人の再ログイン後に最新を読み、古い版を勝手に上書きしない。画面の再読込・端末終了を越える未保存入力の永続保持は約束しない。

## C2 — Generation Candidate to Workspace

```typescript
interface GeneratedCandidate extends MemoFields {
  origin: "generated";
  structuredContent: CompanyMemoStructured;
  correctedOcr: string;
  event: CompanyEventInfo;
  providerOrigin: "dummy" | "openai";
  generationReceipt: string;
}
interface ManualCandidate extends MemoFields {
  origin: "manual";
  providerOrigin: null;
}
type CreateMemo = {
  operationId: OperationId;
  memoId: Id;
  candidate: GeneratedCandidate | ManualCandidate;
};
interface GenerationWorkspaceV1 {
  requireCompany(principal: Principal, companyId: Id): Promise<Result<Company>>;
  createMemo(principal: Principal, companyId: Id,
             input: CreateMemo): Promise<Result<MutationOutcome>>;
  readMemo(principal: Principal, companyId: Id, memoId: Id): Promise<Result<Memo>>;
}
```

U2は選択企業をIDで確認し、候補の内容を本人が確認した後、明示保存でC4を経由して同じU1のcreateMemoを呼ぶ。生成した企業名は候補のoverviewに留め、保存先企業や名前を変更しない。生成処理開始時に存在しても、保存時に再度所有者・企業の存在を検査する。既存単発生成は保存先なしでも使え、保存は選択企業が必要。

generationReceiptはU2が検証済み生成に付ける署名付きの出自証明。本人ID、generationId、providerOriginだけを結び、画像・本文・キーを含めない。U1が署名と本人・providerOriginの一致を検証して出自を保存し、ブラウザがdummy表示をopenaiへ書き換えるだけでは通らない。これは内容の事実性や編集後の正しさの証明ではない。本文・構造化項目の本人編集は認める。署名鍵はサーバー側のみ、保持・ローテーション設定は後続の認証／秘密設定に含める。検証不能な証明はinvalid_inputとし、候補を失わず知らせる。

原画像は生成中の一時参照だけ。U1の保存DTOへ入れず、原画像がなくても保存メモを再取得できる。出典は採用した項目だけをadoptedWebSourcesへ渡す。未採用候補・Web本文を紙の事実へ混ぜない。ManualCandidateの自由本文から構造化項目を自動生成しない。

## C3 — Comparison Read and Explicit Edits

```typescript
interface ComparisonSelection { companyId: Id; memoId: Id }
interface ComparisonSource {
  company: Company;
  memo: Memo & { structuredContent: CompanyMemoStructured };
}
interface ComparisonSnapshot {
  snapshotVersion: Version;
  sources: ComparisonSource[]; // 本人が選んだ順
}
interface UpdateCompany {
  operationId: OperationId;
  expectedVersion: Version;
  changes: Partial<CompanyFields>;
}
interface UpdateMemo {
  operationId: OperationId;
  expectedVersion: Version;
  changes: Partial<MemoFields>;
}
interface ComparisonWorkspaceV1 {
  readComparison(principal: Principal,
    selected: ComparisonSelection[]): Promise<Result<ComparisonSnapshot>>;
  updateCompany(principal: Principal, companyId: Id,
    input: UpdateCompany): Promise<Result<MutationOutcome>>;
  updateMemo(principal: Principal, companyId: Id, memoId: Id,
    input: UpdateMemo): Promise<Result<MutationOutcome>>;
}
```

企業ごとに1メモ。重複companyId、他企業のmemoId、不正構造は拒否する。自由本文だけのメモは比較可能な構造化メモとして返さず、UIで「構造化項目なし」を区別する。選択0件はクライアントの「対象なし」であり、readComparisonの成功結果として架空の表を返さない。APIの同時選択上限は容量計画で定める。

readComparisonは1つの整合した読取からCompanyとMemoを返す。7観点はstrengths／concerns／impressions／emphasizedPoints／idealCandidate／esPoints／questions。出典・providerOrigin・参照ID・保存版を保持し、紙由来情報とWebを別区分にする。Company.interestLevelとMemo.comparisonReasonを表示し、変更はそれぞれU1へ依頼する。2つを1画面に表示しても独立した保存操作・結果を示し、片方だけ保存できた時に両方成功と扱わない。

選択変更で以前の取得要求を中止または無効化し、遅れて返った応答を新選択へ適用しない。保存後は再取得し、比較はその版から作り直す。別端末による変更は再取得で確認する（常時配信なし）。Markdown出力の直前にも選択した参照を再取得し、表示時のcompany.version／memo.versionと比較する。変更・削除があれば古い出力を止め、最新表示を確認してもう一度出力する。取得失敗・401・参照不正の場合は成功ファイルを作らない。出力直後の別端末変更まで禁止する約束ではなく、確認した保存版を出力の基準として明示する。

## C4 — Browser HTTP Routes v1

HTTP契約を下記のmethod／path／request／response／statusで固定する。ルート型のbodyは外部入力として実行時検証する。全てC1が必要。ブラウザから認証製品の管理鍵・DB鍵は送らない。

```typescript
interface CreateCompany {
  operationId: OperationId;
  companyId: Id;
  fields: Pick<CompanyFields, "name"> & Partial<Omit<CompanyFields, "name">>;
}
type BoardQuery = { showEnded?: "true" | "false" };
type MemoPageQuery = { cursor?: string; limit?: string };
type DeleteTarget = { companyId: Id; memoId: Id | null };
interface JsonRoute<M, P, B, Q, S, R> {
  method: M; path: P; body: B; query: Q; successStatus: S; response: R;
}
type WorkspaceHttpV1 =
  | JsonRoute<"GET", "/api/v1/board", never, BoardQuery, 200, BoardSnapshot>
  | JsonRoute<"POST", "/api/v1/companies", CreateCompany, never, 201, MutationOutcome>
  | JsonRoute<"GET", "/api/v1/companies/{companyId}", never, never, 200, Company>
  | JsonRoute<"PATCH", "/api/v1/companies/{companyId}", UpdateCompany, never, 200, MutationOutcome>
  | JsonRoute<"GET", "/api/v1/companies/{companyId}/memos", never, MemoPageQuery, 200, Page<MemoSummary>>
  | JsonRoute<"POST", "/api/v1/companies/{companyId}/memos", CreateMemo, never, 201, MutationOutcome>
  | JsonRoute<"GET", "/api/v1/companies/{companyId}/memos/{memoId}", never, never, 200, Memo>
  | JsonRoute<"PATCH", "/api/v1/companies/{companyId}/memos/{memoId}", UpdateMemo, never, 200, MutationOutcome>
  | JsonRoute<"POST", "/api/v1/deletion-confirmations", DeleteTarget, never, 200, DeleteSnapshot>
  | JsonRoute<"POST", "/api/v1/deletions", DeleteRequest, never, 200, MutationOutcome>
  | JsonRoute<"GET", "/api/v1/operations/{operationId}", never, never, 200, OperationLookup>
  | JsonRoute<"POST", "/api/v1/comparison-sources", { selected: ComparisonSelection[] }, never, 200, ComparisonSnapshot>;
```

パスID・operationIdはUUIDとして検証する。GETにbodyなし、POST／PATCHはapplication/json。初回作成201、同じ操作の確定済み再送は200で元のMutationOutcome。削除はbody付きDELETEではなく、確認IDを伴うPOSTのみ。更新changesは1項目以上必要で、未指定は保持、明示nullは任意欄の消去を意味する。requiredなname／selectionStatus／markdown／adoptedWebSourcesをnullにできない。手入力メモの空本文の扱い・その他の入力上限は後続計画で承認する。

ボードは今回の代表量で全カードの軽量項目を1応答に返す。本文は含めない。showEndedの初期falseは終了2状態を隠すだけで保存・集計を変えない。同じ読取スナップショットから8状態の件数、全保存件数、表示対象件数、応募済／書類選考／面接の企業ID単位の社数を返す。15以上の警告は画面で導出し、APIは16社目を拒否しない。savedCompanyCount＝0とvisibleCompanyCount＝0、取得失敗を区別する。

メモ一覧は本文なしのページング（既定20、1〜100件／要求）。この件数は1ページの上限で保存上限ではない。updatedAt降順＋memoIdで順序を固定した不透明cursorを使用する。cursorは本人と企業に結び付け、別企業のcursorを拒否する。ページをまたぐ別端末変更では再取得が必要になることを示す。企業詳細の正確な所属件数を、読んだ1ページの件数から推測しない。

### Error Responses

| HTTP | code | 保存正本と画面の扱い |
|---|---|---|
| 400 | invalid_input | 書込なし。fieldエラーを表示し入力保持 |
| 413 | payload_too_large | 書込なし。承認した上限と修正方法を示す |
| 401 | unauthenticated | 認証からやり直す。保護内容・遅延応答を表示しない |
| 403 | origin_forbidden | 書込なし。本人認証済みでも変更入口を拒否 |
| 404 | not_found | 対象なし／本人に見えない。同じ応答で詳細非開示 |
| 409 | version_conflict | 最新を取り直す。入力を保持し、黙って上書きしない |
| 409 | confirmation_changed | 最新対象と所属メモを再取得し、本人が削除を再確認 |
| 409 | operation_reused | 同じIDを別内容へ使った。勝手に別操作IDで再送しない |
| 410 | confirmation_expired | 新しい確認内容を取得して再確認 |
| 429 | rate_limited | 有限の待ち時間を通知。自動書込再送なし |
| 503 | unavailable | ストア／依存先から確定できない。書込は結果不明として確認 |
| 500 | internal_error | 内容・秘密を出さない。書込結果を推測しない |

`operation_unknown`は内部処理で結果未確定を表す。HTTPの操作結果確認は200＋state:unknownで返し、「未保存確定」へ読み替えない。タイムアウト・ネットワーク切断はHTTP応答が存在しない場合もあり、同じ結果不明手順を適用する。内部例外・SQL・OCR・本文・他人のIDをmessage／fieldsへ返さない。requestIdは診断用の不透明値で、ログへ内容を複写しない。

### Atomic Writes, Versions and Operation Replay

Company.versionは企業項目更新で、Memo.versionはそのメモ更新で新しい値にする。同じDBトランザクション内で所有者・expectedVersionを検査して変更し、操作結果を記録する。更新と版照合を別トランザクションに分けない。CompanyWorkspace内部に企業の子集合の版も持ち、所属メモの作成・どの項目の編集・削除でも更新する。この内部版は企業項目のversionとは別で、メモ編集だけで無関係な企業項目編集を必ず競合させる必要はない。

WriteOperationは認証本人＋operationIdを一意とし、action／対象ID／正規化した要求のSHA-256と確定結果のID・版・日時だけを保持する。本文・OCR・画像・完全要求を保存／ログに複写しない。正規化は検証後の型、キーの安定順、配列順の保持、nullと未指定の区別を含む。企業作成・メモ作成の安定IDも初回要求に含め、同じ操作で変えない。

同じoperationId・同じ要求は、元の操作結果を返し、変更をもう一度実行しない。違う要求は409。レコード変更と操作結果の確定を同じトランザクションに置き、同時再送は一意キーで直列化する。確定済み操作の照合は対象の存在検査より先に行い、削除済み対象でも元の削除結果を返せる。ただし認証確認は常に先に行う。

小さい確定操作記録は本人の保存領域が存続する間保持し、対象削除でも消さない。今回TTLで再利用可能にしない。消去・期限で古い操作が新規実行される経路を作らず、容量見積りに含める。新しい操作IDは本人が新しい明示操作を選んだ時だけ作る。結果不明ならoperationsを取得し、committedなら対象を再取得（既に削除／後続編集ならその最新状態を示す）、unknownなら本人の再試行で同じ要求・同じIDを送る。元の版を現在の内容だと表示しない。

### Confirmed Deletion

DeletionSnapshotはU1が本人・対象・企業版・全所属メモIDと版・内部子集合版・表示件数を一貫した読取で保存し、推測できないconfirmationIdを返す。有効10分。メモ単体削除では当該メモ1件を確認する。企業削除では全所属メモを対象にし、画面に企業名と正確な件数を明示する。確認作成は削除ではない。

削除確定は確認の本人と期限を検査し、対象版・子集合を**同じトランザクションで再照合して削除**する。企業内のメモ追加／編集／削除と企業削除は同じ企業のロック／直列化規則に従う。比較理由だけの更新や同数の入替も子集合版へ反映し、件数だけの照合にしない。原子性を満たすDBアダプタを選び、アプリ側の事前GETだけで代用しない。

確認後の変更はconfirmation_changedで停止し、最新を再表示して新confirmationIdで本人が再確認する。既に削除ならnot_foundとして「既に削除」を本人に伝える。取得失敗は確認ボタンを無効にする。同じ確定削除要求の再送は操作記録で元の成功を返し、期限切れを理由に成功済み削除を失敗へ戻さない。確定企業削除は所属メモも同じ変更で削除し、読取・社数・比較参照へ反映する。旧ブラウザ保存は変更しない。

### Timeouts and Retry Budget

新保存／読取／比較参照APIはブラウザ1要求15秒、サーバー処理10秒、DB操作8秒を上限案として契約に置く。DBの8秒はトランザクション全体の取消しも含み、単にPromiseを放置しない。ブラウザが先に離れた場合にもサーバーの確定有無を操作記録で扱う。これは性能目標ではなく無期限待ちを防ぐ上限であり、実測の応答目標・Vercel／DBでの実現可能性はDelivery Planningで確認する。成立しなければ実装前にこの案を改めて承認する。

GETはネットワーク失敗／503で最大1回、500ms後の自動再試行まで。401・404・検証エラー・競合は再試行しない。POST／PATCHと比較参照POSTは自動再送なし。結果確認のGETも同じ有限規則で、無限ポーリングをしない。手動再試行では書込要求を変えず同じoperationIdを使う。キャンセル後の古い応答を成功通知へ適用しない。

## C5 — Existing Generation, Candidate and Review Contracts

既存ルートの入出力は実際の型参照を継続する。新保存とは違うタイムアウト／失敗体系を持つため、共通の保存成功へ変換しない。新しい出自証明は任意追加の応答欄として既存利用側が無視できる。

```typescript
import type {
  OcrApiResponse, StructureApiRequest, StructureApiResponse,
  WebSupplementApiRequest, WebSupplementApiResponse,
  InterviewReviewApiRequest, InterviewReviewApiResponse, ApiErrorBody
} from "src/lib/openai/contracts";

interface OcrMultipart { file: File }
type AuthenticatedStructureResponse = StructureApiResponse & {
  generationReceipt?: string; // U2の新保存連携では必須
};
type ExistingGenerationHttpV1 =
  | JsonRoute<"POST", "/api/ocr", OcrMultipart, never, 200, OcrApiResponse>
  | JsonRoute<"POST", "/api/structure", StructureApiRequest, never, 200, AuthenticatedStructureResponse>
  | JsonRoute<"POST", "/api/web-supplement", WebSupplementApiRequest, never, 200, WebSupplementApiResponse>
  | JsonRoute<"POST", "/api/interview-review", InterviewReviewApiRequest, never, 200, InterviewReviewApiResponse>;
type GenerationFailure = ApiErrorBody | ContractError;
```

ocrだけmultipart/form-dataのfile、他はapplication/json。全ルートにC1の認証・Origin検査を加え、未認証／不正OriginはContractErrorを返す。既存のprovider失敗はApiErrorBodyのcode／messageを維持し、clientは両形式を判別する。現行server/errors.tsの写像はinvalid_input=400、payload_too_large=413、not_configured=503、rate_limited=429、timeout=504、provider_error=502、validation_failed=422、company_not_found=404。認証追加後もこれらを維持し、不明な例外を成功へ変換しない。

生成のproviderOriginは実際のサーバー出力から付け、dummyは生成・保存・再表示・比較の各場面で検証用と識別できる。OCR訂正と本人編集した本文・構造化項目・採用WebをC2へ渡す。出自証明は既存StructureApiRequestを変更せず、認証済みの構造検証成功時に発行する。既存復習は既存入力から作り、新DBメモ読取・復習結果保存の新しい契約を作らない。

生成POSTは自動再送しない。providerの現行既定30秒を出発点に、今回の生成はprovider30秒／サーバー40秒／ブラウザ45秒の有限上限案を置く。既存環境値で無期限・それ以上へ伸ばさず、設定変更は計画の確認対象にする。外部実成功・解約条件・画像保持・Vercelの実際の許容時間は未確認で、後続の製品／配置確認が成立するまで実装許可にしない。Web複数候補は各呼出しを有限とし、取消し後の結果を新しい選択へ適用しない。試験はdummyで実施する。

## C6 — Public Health Contract

```typescript
type PublicHealthHttp = JsonRoute<
  "GET", "/api/health", never, never, 200,
  { status: "ok"; service: "briefing-note-ai" }
>;
```

本人認証不要。企業・メモ・認証状態・秘密・provider設定を返さない。health成功をログイン・DB保存・全受入成功の証明にしない。本番は実merge SHAのVercelデプロイと承認済み利用フローを別に確認する。

## Contract Ownership and Change Rules

- C1〜C4／C6と保存共有型はU1、既存生成型・出自証明発行とC5はU2、比較の7観点・表示と対応出力はU3が所有する。書込は必ずU1を経由する。
- 参照している既存schemaを変える時は利用する全Unit・既存回帰への影響を示す。名前の同じ別DTOを各Unitで作らない。
- 応答への任意追加項目は利用側が無視できる。新しい書込要求は現行v1の厳密検証に従い、未定義項目を黙って保存しない。新しい状態・必須項目・変更された意味・削除規則は破壊的変更として扱う。
- 破壊的変更は新しい契約版と全利用側の適合確認を計画し、人間の再承認が必要な要件・設計・検証変更を勝手に適用しない。同じリリース内の全Unitを整合させ、古いクライアントへ黙って新しい意味を適用しない。
- 対応する受入試験をU1〜U3で実施し、全体の結合確認と実際の本番確認まで1 Boltで扱う。文書の型検査はTDD・DB原子性・本番成功の代わりにならない。

## Upstream Coverage and Contract Verification

| 上流 | 契約で固定する事項 | 後続の受入例 |
|---|---|---|
| U2→U1、FR5／FR6／NFR4 | C2、C4、C5、情報区分・画像非保存・出自 | 選択名と生成名不一致、訂正して保存、dummy表示、出典付き再取得 |
| U3→U1、FR7／FR8 | C3、C4、7観点・版・企業志望度とメモ理由 | メモ切替、本文だけの更新、構造編集反映、取得失敗で出力停止 |
| FR1／NFR1 | C1と全保護ルート | 本人・未認証・別所有者、失効後の遅延応答、直接API拒否 |
| FR2／FR3／FR4 | Company、BoardSnapshot、C4 | 名前のみ、8状態／6通常、終了表示、15／16社、日付の端末一致 |
| FR6／NFR2／NFR3 | 版、WriteOperation、DeleteSnapshot | 同時再送、確定直後の切断、古い編集、同数メモ編集後の削除拒否 |
| FR9／NFR5 | C3／C5／C6、安全な表示と対応出力 | 既存復習、各Markdown、危険なURL・文字列、実SHAの公開確認 |
| NFR6／NFR7 | 後続計画の検証・容量条件 | TDD、80% line coverage、dummy、容量・無料枠・実測条件 |

契約試験ではトランザクション失敗を任意の途中点で起こし、対象・所属・操作記録の部分確定がないことを確認する。削除確認取得と実行の間へ別端末編集を挟み、版照合と変更の間の競合も検証する。同じoperationIdの異なる要求、削除成功後の再送、対象の後続編集後の結果確認を含む。DBアダプタの実際の一貫性確認は選定後の承認済み検証に追加する。

## Open Questions and Implementation Blockers

Q1の受渡し方針は回答済み。以下は後続の具体化・提供条件確認であり、成立したものと扱わない。正式なDelivery Planningで解決し、必要な追加質問と契約変更の再承認を行う。

| Contract | Question | Blocks |
|---|---|---|
| C1、C4 | 本人限定の認証製品・アカウント用意、ログイン入口、期限／更新／失効とCSRFの実設定。無料条件と休止影響 | U1と最終実装許可 |
| C2〜C4 | 保存DB・無料枠、トランザクション／ロック／読取スナップショットの実現、永続操作記録の容量、完全保存スキーマ | U1、U2、U3の実装 |
| C2、C4、C5 | 文字数・配列数・要求bytes・空手入力・同時比較数の上限、署名鍵の保持とローテーション | 該当入力・保存・比較の実装 |
| C4、C5 | 有限上限案と選定DB／Vercelの整合、代表fixtureの応答目標と測定条件・容量、全件ボード方式の適合 | 全Unitの実装許可 |
| C5 | 外部OCRの画像保持条件、既存providerの設定・入力制限・タイムアウト写像の照合 | U2と実provider利用 |
| 全契約 | 具体的なTDD・検証コマンド・手動／公開チェック・Definition of Done | Code Generation Plan Approval |

## Document Checks

2026-10-14、7つのTypeScript仕様ブロックをメモリ上で連結し、既存の型参照を解決してTypeScriptのstrict／noEmitで検査した。診断0件、ファイル出力・依存追加なし。既存server/errors.tsのHTTP写像も静的に照合した。この結果は文書の型整合の確認だけで、API動作・認証・署名・DBの原子性・タイムアウト・性能・本番の確認は未実施。

## Sources

- contract-design-questions.md Q1の実回答a。
- ../units-generation/unit-of-work.md、unit-of-work-dependency.md — 3 Unit、2依存辺、共有配置、単一リリース。
- ../domain-design/components.md、decisions.md、domain-design-questions.md — 6部品・所有者、志望度／理由、全生成認証、代表量。
- ../requirements-analysis/requirements.md — 49要件、情報区分、整合性、複数端末、無料条件。
- ../user-stories/stories.md、../refined-mockups/interaction-spec.md — 受入条件、削除再確認・未保存・表示。
- src/lib/structure/schema.ts、src/lib/types.ts、src/lib/comparison.ts、src/lib/openai/contracts.ts、app/apiの既存ルート、src/lib/server/openaiClient.ts — 現行型・7観点・provider既定30秒。静的な所見で、実際の本番成功や提供条件の証拠ではない。
