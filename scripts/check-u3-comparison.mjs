// Local dummy / real PostgreSQL / dedicated Edge only. No browser runner dependency.
import { spawn, execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir, platform, release } from "node:os";
import { join } from "node:path";
import { once, EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
const results = [];
const check = (name, passed, detail = {}) =>
  results.push({ check: name, passed: !!passed, ...detail });
const origin = "http://127.0.0.1:3000",
  owner = "11111111-1111-4111-8111-111111111111",
  pause = (ms) => new Promise((r) => setTimeout(r, ms));
const connection =
  process.env.U1_TEST_DATABASE_URL ??
  "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test";
const local = new URL(connection);
if (
  !["localhost", "127.0.0.1"].includes(local.hostname) ||
  local.pathname !== "/workspace_test"
)
  throw Error("local disposable database required");
let preview,
  edge,
  socket,
  profile,
  admin,
  schema,
  previewLog = "",
  previewMetadata,
  serial = 0,
  currentSession,
  step = "setup",
  performanceEvidence;
const pending = new Map();
const actionTrace = [];
let activeAction = "setup";
let securityExternalRequests = 0;
const securityExternalEvidence=[];
async function action(name, run) {
  activeAction = name;
  const started = performance.now();
  console.log(JSON.stringify({action:name, phase:"start"}));
  try { const value = await run(); console.log(JSON.stringify({action:name,phase:"complete",ms:Math.round(performance.now()-started)})); return value; }
  catch(error) { console.log(JSON.stringify({action:name,phase:"failed",ms:Math.round(performance.now()-started)})); throw error; }
}

const cdpEvidence = { messages: 0, responses: 0, events: 0, closed: false };
async function stopTree(child, stopCommand = execFile, exitWaitMs = 1500) {
  const exited = () => child.exitCode != null || child.signalCode != null;
  if (!child?.pid || exited()) return;
  if (process.platform === "win32") {
    const error = await new Promise((resolve) =>
      stopCommand("taskkill", ["/PID", String(child.pid), "/T", "/F"], resolve),
    );
    if (error && !exited()) {
      // Browser.close may finish before the child exit notification is delivered.
      // A failed kill alone never proves that an owned child has stopped.
      await Promise.race([once(child, "exit"), pause(exitWaitMs)]);
      if (!exited()) throw error;
    }
  } else child.kill("SIGTERM");
}
if (
  process.argv.includes("--self-test") ||
  process.argv.includes("--self-test-failure")
) {
  check("helper false is a failing exit", !process.argv.includes("--self-test-failure"));
  if (process.platform === "win32") {
    const makeChild = () => Object.assign(new EventEmitter(), {pid: 1, exitCode: null, signalCode: null});
    const exitedChild = makeChild();
    await stopTree(exitedChild, (_command, _args, done) => {
      done(Object.assign(new Error("fictional stop failure"), {code: 128}));
      setTimeout(() => {exitedChild.exitCode = 0; exitedChild.emit("exit", 0);}, 1);
    }, 50);
    check("owned child exit after failed kill is confirmed", exitedChild.exitCode === 0);
    let refused = false;
    await stopTree(makeChild(), (_command, _args, done) => done(Object.assign(new Error("fictional still running"), {code: 128})), 5).catch(() => {refused = true;});
    check("failed kill without child exit remains failure", refused);
  }
  console.log(JSON.stringify({results}));
  process.exit(results.every(result => result.passed) ? 0 : 1);
}
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++serial,
      timer = setTimeout(() => {
        pending.delete(id);
        reject(Error(`CDP timeout ${method}`));
      }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  });
}
async function evaluate(expression, sessionId = currentSession) {
  const result = await send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) throw Error("browser evaluation failed");
  return result.result?.value;
}
async function until(expression, label, attempts = 100) {
  for (let i = 0; i < attempts; i++) {
    if (await evaluate(expression)) return;
    await pause(150);
  }
  throw Error(`control not reached: ${label}`);
}
async function click(selector) {
  await until(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});return !!e&&!e.disabled})()`,
    `enabled ${selector}`,
  );
  const passed = await evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.scrollIntoView({block:'center'});e.focus();e.click();return true})()`,
  );
  if (!passed) throw Error(`enabled control missing: ${selector}`);
}
async function button(label) {
  const expression = `[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)})`;
  await until(
    `(()=>{const e=${expression};return !!e&&!e.disabled})()`,
    `button ${label}`,
  );
  await evaluate(
    `(()=>{const e=${expression};e.scrollIntoView({block:'center'});e.focus();e.click()})()`,
  );
}
async function input(selector, value) {
  await evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error();e.focus();e.select()})()`,
  );
  await send("Input.insertText", { text: value }, currentSession);
}
async function key(name, code, modifiers = 0) {
  for (const type of ["rawKeyDown", "keyUp"])
    await send(
      "Input.dispatchKeyEvent",
      {
        type,
        key: name,
        code: name,
        windowsVirtualKeyCode: code,
        nativeVirtualKeyCode: code,
        modifiers,
      },
      currentSession,
    );
}
const instrumentation = `(()=>{
 if(window.__u3)return;const original=window.fetch.bind(window);window.__u3={original,requests:0,writes:[],downloads:[],mode:'',lastSelected:[],operations:0};
 const s=window.__u3;
 const nativeAnchorClick=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){original(this.href).then(r=>r.text()).then(t=>s.downloads.push(t));return;}return nativeAnchorClick.call(this);};
 window.fetch=async(input,init={})=>{const path=String(input),method=init.method??'GET',started=performance.now();if(path.includes('/api/'))s.requests++;if(path.includes('/operations/'))s.operations++;if(method==='GET'&&/^\\/api\\/v1\\/companies\\/[^/]+\\/memos\\/[^/?]+$/.test(path))s.lastMemoPath=path;
 if(path==='/api/v1/comparison-sources'){s.lastSelected=JSON.parse(init.body).selected;if(s.mode==='readFail'){s.mode='';throw TypeError('dummy read failure');}if(s.mode==='read401'){s.mode='';return Response.json({error:{code:'unauthenticated'}},{status:401});}if(s.mode==='readInvalid'){s.mode='';return Response.json({snapshotVersion:'invalid',sources:[]});}if(s.mode==='delayRead'){s.mode='';await new Promise(resolve=>{s.releaseRead=resolve;});}}
 if(method==='PATCH'){s.writes.push({path,body:init.body});if(s.mode==='unknown'){s.mode='';throw TypeError('dummy interruption before dispatch');}if(s.mode==='reject'){s.mode='';return Response.json({error:{code:'invalid_input'}},{status:400});}if(s.mode==='holdWrite'){s.mode='';await new Promise(resolve=>s.releaseWrite=resolve);}const lost=s.mode==='lostCommit';if(lost)s.mode='';const r=await original(input,init);if(lost)throw TypeError('dummy response lost after commit');return r;}
 if(s.mode==='readbackFail'&&method==='GET'&&/^\\/api\\/v1\\/companies\\/[^/]+(?:\\/memos\\/[^/]+)?$/.test(path))return Response.json({error:{code:'unavailable'}},{status:503});
 const response=await original(input,init);if(path==='/api/v1/comparison-sources'){const value=await response.clone().json();s.readResponses??=[];s.readResponses.push({status:response.status,code:value.error?.code??null,sources:value.sources?.length??null,aborted:!!init.signal?.aborted,ms:Math.round(performance.now()-started)});s.completedReads=(s.completedReads??0)+1;if(s.unsafeUrl){value.sources[0].memo.adoptedWebSources[0].sourceUrl=s.unsafeUrl;s.unsafeUrl='';s.securityDelivered=(s.securityDelivered??0)+1;return Response.json(value);}}return response;};
})()`;
async function selectCompany(companyId) {
  const scope = `[...document.querySelectorAll('[data-testid=comparison-load-memos]')].find(b=>b.closest('section').textContent.includes(${JSON.stringify(companyId)}))`;
  if (
    !(await evaluate(
      `(()=>{const b=${scope};if(!b)return false;b.scrollIntoView({block:'center'});b.click();return true})()`,
    ))
  )
    throw Error("company fixture missing");
  await until(
    `(()=>{const b=${scope};return !!b?.closest('section').querySelector('input:not(:disabled)')})()`,
    "structured candidate",
  );
  await evaluate(
    `(()=>{const b=${scope},i=b.closest('section').querySelector('input:not(:disabled)');i.scrollIntoView({block:'center'});i.click()})()`,
  );
  await until(
    "document.body.textContent.includes('選択した保存版の比較')",
    "comparison ready",
  );
}
async function chooseMemo(companyId, memoId) {
  const scope = `[...document.querySelectorAll('[data-testid=comparison-load-memos]')].find(b=>b.closest('section').textContent.includes(${JSON.stringify(companyId)})).closest('section')`;
  await evaluate(`${scope}.querySelector('[data-testid=comparison-load-memos]').click()`);
  await until(`!${scope}.querySelector('[data-testid=comparison-load-memos]').disabled&&${scope}.querySelectorAll('input').length>0`, "completed memo page for switch");
  const target = `[...${scope}.querySelectorAll('label')].find(e=>e.textContent.includes(${JSON.stringify(memoId)}))?.querySelector('input:not(:disabled)')`;
  for (let page = 0; page < 3 && !(await evaluate(`!!(${target})`)); page++) {
    const count = await evaluate(`${scope}.querySelectorAll('input').length`);
    await until(`!!${scope}.querySelector('[data-testid=comparison-more-memos]')&&!${scope}.querySelector('[data-testid=comparison-more-memos]').disabled`, "enabled owned memo page");
    await evaluate(`${scope}.querySelector('[data-testid=comparison-more-memos]').click()`);
    await until(`${scope}.querySelectorAll('input').length>${count}`, "next owned memo page");
  }
  if (!(await evaluate(`!!(${target})`))) throw Error("switch fixture not reached");
  await evaluate(`(()=>{const e=${target};e.scrollIntoView({block:'center'});e.click()})()`);
  await until(`window.__u3.lastSelected.some(s=>s.companyId===${JSON.stringify(companyId)}&&s.memoId===${JSON.stringify(memoId)})&&document.body.textContent.includes('選択した保存版の比較')`, "switched memo snapshot");
}
async function login() {
  await until("!!document.querySelector('[data-testid=login-email]')", "login");
  await input("[data-testid=login-email]", "owner@example.test");
  await input("[data-testid=login-password]", "local-preview-only");
  await click("[data-testid=login-submit]");
  await until(
    "!!document.querySelector('[data-testid=comparison-load-memos]')",
    "comparison companies",
  );
}
async function originalRequest(path, method = "GET", body) {
  return evaluate(
    `(async()=>{const r=await window.__u3.original(${JSON.stringify(path)},{method:${JSON.stringify(method)},headers:{'Content-Type':'application/json'},${body === undefined ? "" : `body:${JSON.stringify(JSON.stringify(body))},`}});return {status:r.status,value:await r.json()}})()`,
  );
}
async function diagnoseSwitch(fixture) {
  step = "finite supplemental switch diagnostic";
  for (const company of fixture.companies.slice(0, 20))
    await selectCompany(company.company_id);
  const first = (await evaluate("window.__u3.lastSelected"))[0];
  const alternate = fixture.memos.find(m => m.company_id === first.companyId && m.structured_content && m.memo_id !== first.memoId);
  await chooseMemo(first.companyId, alternate.memo_id);
  await evaluate("(()=>{const e=document.querySelector('select[data-testid=comparison-field-input]');e.value='high';e.dispatchEvent(new Event('change',{bubbles:true}));window.__u3.mode='readbackFail'})()");
  await click("select[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("document.body.textContent.includes('保存成功。最新の取得に失敗しました')", "diagnostic committed GET failure");
  await evaluate("window.__u3.mode=''");
  await click("[data-testid=comparison-field-latest]");
  await input("textarea[data-testid=comparison-field-input]", "架空の送信値");
  await evaluate("window.__u3.mode='holdWrite'");
  await click("textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("typeof window.__u3.releaseWrite==='function'", "diagnostic held write");
  await input("textarea[data-testid=comparison-field-input]", "架空の追加入力");
  await evaluate("window.__u3.releaseWrite();delete window.__u3.releaseWrite");
  await until("document.querySelector('textarea[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')", "diagnostic committed reason");
  await click("[data-testid=comparison-legacy-entry]");
  await click("[data-testid=comparison-discard]");
  await click("[data-testid=comparison-server-entry]");
  await until("document.body.textContent.includes('選択した保存版の比較')||document.body.textContent.includes('比較参照の取得に失敗')", "diagnostic terminal comparison state");
  console.log(JSON.stringify({switchDiagnostics:await evaluate("({mode:window.__u3.mode,reads:window.__u3.readResponses?.slice(-4),server:!!document.querySelector('[data-testid=comparison-refresh]'),loading:document.body.textContent.includes('比較参照を読み込んでいます'),readError:document.body.textContent.includes('比較参照の取得に失敗'),login:!!document.querySelector('[data-testid=login-email]')})")}));
  const direct = await originalRequest("/api/v1/comparison-sources", "POST", {selected:await evaluate("window.__u3.lastSelected")});
  console.log(JSON.stringify({directComparison:{status:direct.status,code:direct.value.error?.code??null,sources:direct.value.sources?.length??null}}));
  console.log(JSON.stringify({comparisonTimings:[...previewLog.matchAll(/POST \/api\/v1\/comparison-sources (\d+) in (\d+)ms/g)].slice(-4).map(m=>({status:Number(m[1]),ms:Number(m[2])}))}));
  const writes = await evaluate("window.__u3.writes.length");
  if (await evaluate("document.body.textContent.includes('比較参照の取得に失敗')")) await click("[data-testid=comparison-refresh]");
  await until("document.body.textContent.includes('選択した保存版の比較')", "explicit read recovery after switch");
  check("M4/M7 explicit read recovery retains committed result without duplicate write", await evaluate(`window.__u3.writes.length===${writes}&&document.querySelector('textarea[data-testid=comparison-field-input]').value==='架空の送信値'&&document.body.textContent.includes('保存成功')`));
  throw Error("finite diagnostic only; remaining acceptance intentionally not run");
}
async function readyComparison(label) {
  await until("document.body.textContent.includes('選択した保存版の比較')||document.body.textContent.includes('比較参照の取得に失敗')", label);
  if (await evaluate("document.body.textContent.includes('比較参照の取得に失敗')")) {
    const before = await evaluate("({writes:window.__u3.writes.length,read:window.__u3.readResponses?.at(-1)})");
    check(label + ": observed read failure blocks output", await evaluate("document.querySelector('[data-testid=comparison-export]').disabled"), {read:before.read});
    await click("[data-testid=comparison-refresh]");
    await until("document.body.textContent.includes('選択した保存版の比較')", label + " explicit read recovery");
    check(label + ": explicit recovery creates no write", (await evaluate("window.__u3.writes.length"))===before.writes);
  }
}
async function remainingChecks(fixture, first) {
  const reasonSelector = "textarea[data-testid=comparison-field-input]";
  step = "supplemental memo and field boundaries";
  await readyComparison("supplemental ready");
  const alternate = fixture.memos.find(m => m.company_id === first.companyId && m.structured_content && m.memo_id !== first.memoId);
  await chooseMemo(first.companyId, alternate.memo_id);
  check("M2 switching memo uses its own reason and same saved company interest", await evaluate(`document.querySelector(${JSON.stringify(reasonSelector)}).value===${JSON.stringify(alternate.comparison_reason ?? "")}&&document.querySelector('select[data-testid=comparison-field-input]').value==='medium'`));
  const memoPath = `/api/v1/companies/${first.companyId}/memos/${alternate.memo_id}`;
  let currentMemo = (await originalRequest(memoPath)).value;
  const changedStructure = {...currentMemo.structuredContent, strengths:["M2別client保存の構造"]};
  const structureUpdate = await originalRequest(memoPath, "PATCH", {operationId:randomUUID(),expectedVersion:currentMemo.version,changes:{structuredContent:changedStructure}});
  await click("[data-testid=comparison-refresh]");
  await until("document.body.textContent.includes('M2別client保存の構造')", "changed saved structure");
  currentMemo = (await originalRequest(memoPath)).value;
  const bodyUpdate = await originalRequest(memoPath, "PATCH", {operationId:randomUUID(),expectedVersion:currentMemo.version,changes:{markdown:"M2自由本文を企業事実へ補完しない"}});
  await click("[data-testid=comparison-refresh]");
  await readyComparison("body-only update snapshot");
  const bodyReadback = (await originalRequest(memoPath)).value;
  check("M2 structure refresh and body-only update preserve distinct canonical values", structureUpdate.status===200&&bodyUpdate.status===200&&bodyReadback.version!==currentMemo.version&&JSON.stringify(bodyReadback.structuredContent)===JSON.stringify(changedStructure)&&await evaluate("document.body.textContent.includes('M2別client保存の構造')&&!document.body.textContent.includes('M2自由本文を企業事実へ補完しない')"));
  await evaluate("(()=>{const e=document.querySelector('select[data-testid=comparison-field-input]');e.value='high';e.dispatchEvent(new Event('change',{bubbles:true}));window.__u3.mode='readbackFail'})()");
  await click("select[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("document.body.textContent.includes('保存成功。最新の取得に失敗しました')", "committed with failed GET");
  const afterInterest = (await originalRequest(memoPath)).value;
  check("M3 committed interest survives GET failure and changes no memo fields", JSON.stringify(afterInterest)===JSON.stringify(bodyReadback)&&await evaluate("Object.keys(JSON.parse(window.__u3.writes.at(-1).body).changes).join(',')==='interestLevel'"));
  await evaluate("window.__u3.mode=''");
  await click("[data-testid=comparison-field-latest]");
  await input(reasonSelector, "M3凍結した送信理由");
  await evaluate("window.__u3.mode='holdWrite'");
  await click("textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("typeof window.__u3.releaseWrite==='function'", "held write");
  await input(reasonSelector, "M3送信後の追加入力");
  await evaluate("window.__u3.releaseWrite();delete window.__u3.releaseWrite");
  await until("document.querySelector('textarea[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')", "sent reason commit");
  check("M3 additional input survives commit and prevents output", (await originalRequest(memoPath)).value.comparisonReason==="M3凍結した送信理由"&&await evaluate("document.querySelector('textarea[data-testid=comparison-field-input]').value==='M3送信後の追加入力'&&document.querySelector('[data-testid=comparison-export]').disabled"));
  await click("[data-testid=comparison-legacy-entry]");
  await click("[data-testid=comparison-discard]");
  await click("[data-testid=comparison-server-entry]");
  await readyComparison("discard extra draft only");
  await input(reasonSelector, "M4確定直後に応答途絶");
  await evaluate("window.__u3.mode='lostCommit'");
  await click("textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("!!document.querySelector('[data-testid=comparison-retained-lookup]')", "lost committed outcome");
  const lostWrites = await evaluate("window.__u3.writes.length");
  await click("[data-testid=workspace-board-link]");
  await click("[data-testid=dialog-confirm]");
  await until("location.pathname==='/'&&!document.querySelector('[data-testid=comparison-heading]')", "real board route");
  await click("[data-testid=workspace-comparison-link]");
  await until("location.pathname==='/compare'||!!document.querySelector('[data-testid=dialog-confirm]')", "return route guard");
  if (await evaluate("!!document.querySelector('[data-testid=dialog-confirm]')")) await click("[data-testid=dialog-confirm]");
  await until("!!document.querySelector('[data-testid=comparison-retained-lookup]')", "retained unknown after route remount");
  check("M4 true route remount retains unknown without a new write", (await evaluate("window.__u3.writes.length"))===lostWrites);
  await click("[data-testid=comparison-retained-lookup]");
  await until("!document.querySelector('[data-testid=comparison-retained-lookup]')", "same ID committed lookup");
  check("M4 lost committed response resolves without duplicate PATCH", (await evaluate("window.__u3.writes.length"))===lostWrites&&(await originalRequest(memoPath)).value.comparisonReason==="M4確定直後に応答途絶");
  await click("[data-testid=comparison-refresh]");
  await readyComparison("after retained lookup");
  for (const mode of ["readInvalid", "delayRead"]) {
    const count = await evaluate("window.__u3.downloads.length");
    await evaluate(`window.__u3.mode=${JSON.stringify(mode)}`);
    await click("[data-testid=comparison-export]");
    await until("document.body.textContent.includes('参照を確認できないため出力していません')", `bounded output ${mode}`, 150);
    check(`M6 ${mode==='delayRead'?'15-second deadline':'invalid response'} creates zero files`, (await evaluate("window.__u3.downloads.length"))===count);
    if(mode==='delayRead') await evaluate("window.__u3.releaseRead();delete window.__u3.releaseRead");
    await click("[data-testid=comparison-refresh]");
    await readyComparison("output error recovery");
  }
  const beforeLate = await evaluate("({files:window.__u3.downloads.length,reads:window.__u3.completedReads??0})");
  await evaluate("window.__u3.mode='delayRead'");
  await click("[data-testid=comparison-export]");
  await until("typeof window.__u3.releaseRead==='function'", "delayed confirmation");
  await input(reasonSelector, "M6確認中に追加した本人入力");
  await evaluate("window.__u3.releaseRead();delete window.__u3.releaseRead");
  await until(`window.__u3.completedReads>${beforeLate.reads}`, "late read completed");
  await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
  check("M6 input generation rejects late output and retains draft", await evaluate(`window.__u3.downloads.length===${beforeLate.files}&&document.querySelector('textarea[data-testid=comparison-field-input]').value==='M6確認中に追加した本人入力'`));
  await click("[data-testid=comparison-legacy-entry]");await click("[data-testid=comparison-discard]");await click("[data-testid=comparison-server-entry]");
  await readyComparison("clean before legacy fixture");
  step = "supplemental legacy states";
  const legacyKey = "briefingNoteAi.savedCompanyMemos.v1", legacyRecord = {id:"legacy-fallback-id",memo:fixture.memos[1].structured_content,markdown:"架空旧本文",interestNote:{level:"undecided",memo:"旧理由"},savedAt:"2024/1/2",updatedAt:"2024/1/2"};
  await evaluate(`localStorage.setItem(${JSON.stringify(legacyKey)},${JSON.stringify(JSON.stringify([legacyRecord]))})`);
  const legacyRequests = await evaluate("window.__u3.requests");
  await click("[data-testid=comparison-legacy-entry]");
  await until("!!document.querySelector('[data-testid=legacy-comparison-reason]:not(:disabled)')", "normal legacy record");
  await input("[data-testid=legacy-comparison-reason]", "本人の旧比較編集");
  const legacyFiles = await evaluate("window.__u3.downloads.length");
  await click("[data-testid=legacy-comparison-export]");
  await until(`window.__u3.downloads.length===${legacyFiles+1}`, "legacy download");
  check("M8 normal legacy edit/output preserves fallback ID and original date without server traffic", await evaluate(`(()=>{const a=JSON.parse(localStorage.getItem(${JSON.stringify(legacyKey)}));return a[0].id==='legacy-fallback-id'&&a[0].savedAt==='2024/1/2'&&a[0].interestNote.memo==='本人の旧比較編集'&&window.__u3.downloads.at(-1)===document.querySelector('[data-testid=legacy-comparison-markdown]').value&&window.__u3.requests===${legacyRequests}})()`));
  await click("[data-testid=comparison-server-entry]");
  const mixed = JSON.stringify([legacyRecord,{invalid:true}]);
  await evaluate(`localStorage.setItem(${JSON.stringify(legacyKey)},${JSON.stringify(mixed)})`);
  await click("[data-testid=comparison-legacy-entry]");
  await until("document.body.textContent.includes('旧データに安全に読めない記録')", "mixed legacy corruption");
  check("M8 mixed corruption is readable and cannot drop original records", await evaluate(`document.querySelectorAll('[data-testid=legacy-comparison-select]').length===1&&document.querySelector('[data-testid=legacy-comparison-reason]').disabled&&localStorage.getItem(${JSON.stringify(legacyKey)})===${JSON.stringify(mixed)}`));
  await click("[data-testid=comparison-server-entry]");
  await evaluate(`window.__u3.storageRead=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key===${JSON.stringify(legacyKey)})throw Error('fictional unavailable');return window.__u3.storageRead.call(this,key)}`);
  await click("[data-testid=comparison-legacy-entry]");
  await until("document.body.textContent.includes('旧データを読み取れません。0件とは判断していません')", "unavailable legacy storage");
  check("M8 unavailable is distinct from zero records", await evaluate("!document.body.textContent.includes('保存済みメモがありません')"));
  await evaluate(`Storage.prototype.getItem=window.__u3.storageRead;delete window.__u3.storageRead;localStorage.removeItem(${JSON.stringify(legacyKey)})`);
  await click("[data-testid=comparison-server-entry]");
  await readyComparison("before auth restoration");
  step = "supplemental controlled 401 restoration";
  await input(reasonSelector, "M7本人Aの保持入力");
  const authWrites = await evaluate("window.__u3.writes.length");
  await evaluate("window.__u3.mode='read401'");
  await click("[data-testid=comparison-refresh]");
  await until("!!document.querySelector('[data-testid=login-email]')", "controlled 401 hides workspace");
  check("M7 controlled 401 hides protected fields", await evaluate("!document.querySelector('[data-testid=comparison-field-input]')&&!document.body.textContent.includes('M7本人Aの保持入力')"));
  await login();
  await until("!!document.querySelector('[data-testid=comparison-restore]')", "same owner restoration gate");
  await click("[data-testid=comparison-restore-refresh]");
  await click("[data-testid=comparison-restore]");
  check("M7 same owner explicit fresh restoration retains draft and sends no new write", await evaluate(`document.querySelector('textarea[data-testid=comparison-field-input]').value==='M7本人Aの保持入力'&&window.__u3.writes.length===${authWrites}`));
  await click("[data-testid=comparison-legacy-entry]");await click("[data-testid=comparison-discard]");await click("[data-testid=comparison-server-entry]");
  await readyComparison("restored clean comparison");
  await evaluate("document.querySelector('[data-testid=comparison-table-scroll]').focus()");
  await key("ArrowRight",39);
  await until("document.querySelector('[data-testid=comparison-table-scroll]').scrollLeft>0", "keyboard table scroll");
  check("M10 labelled table scroll region is keyboard reachable", await evaluate("document.activeElement===document.querySelector('[data-testid=comparison-table-scroll]')&&!!document.activeElement.getAttribute('aria-label')"));
}
async function diagnoseM4(fixture) {
  step = "M3 to M4 narrow diagnostic";
  check("helper anchor preventDefault preserves location",await evaluate("(async()=>{const before=location.href,a=document.createElement('a');a.href='/?helper-cancel-boundary';let cancelable=false;a.addEventListener('click',event=>{cancelable=event.cancelable;event.preventDefault()});document.body.appendChild(a);a.click();a.remove();await new Promise(resolve=>requestAnimationFrame(resolve));return cancelable&&location.href===before})()"));
  await selectCompany(fixture.companies[0].company_id);
  const reason = "textarea[data-testid=comparison-field-input]";
  await input(reason,"架空の送信理由");
  await evaluate("window.__u3.mode='holdWrite'");
  await click("textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]");
  await until("typeof window.__u3.releaseWrite==='function'","held M3 write");
  await input(reason,"架空の送信後追加入力");
  await evaluate("window.__u3.releaseWrite();delete window.__u3.releaseWrite");
  await until("document.querySelector('textarea[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')","committed M3");
  check("M3 narrow prerequisite retains additional input",await evaluate("document.querySelector('textarea[data-testid=comparison-field-input]').value==='架空の送信後追加入力'&&document.querySelector('[data-testid=comparison-export]').disabled"));
  await action("M3-open-custom-discard",()=>click("[data-testid=comparison-legacy-entry]"));
  await action("M3-confirm-custom-discard",()=>click("[data-testid=comparison-discard]"));
  await action("M3-reenter-comparison",()=>click("[data-testid=comparison-server-entry]"));
  await action("M3-read-ready-or-explicit-recovery",()=>readyComparison("M3 diagnostic reentry"));
  await action("M4-input-reason",()=>input(reason,"架空の確定応答途絶理由"));
  await evaluate("window.__u3.mode='lostCommit'");
  await action("M4-send-and-lose-response",()=>click("textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]"));
  await action("M4-wait-unknown",()=>until("!!document.querySelector('[data-testid=comparison-retained-lookup]')","M4 unknown"));
  const writes = await evaluate("window.__u3.writes.length");
  await action("M4-open-board-route",()=>click("[data-testid=workspace-board-link]"));
  check("M4 custom guard blocks route before explicit confirmation",await evaluate("location.pathname==='/compare'&&!!document.querySelector('[data-testid=dialog-confirm]')"));
  await action("M4-confirm-custom-route-dialog",()=>click("[data-testid=dialog-confirm]"));
  await action("M4-wait-board-route",()=>until("location.pathname==='/'&&!document.querySelector('[data-testid=comparison-heading]')","M4 board route"));
  await action("M4-return-route",()=>click("[data-testid=workspace-comparison-link]"));
  await until("location.pathname==='/compare'||!!document.querySelector('[data-testid=dialog-confirm]')","M4 return guard");
  if(await evaluate("!!document.querySelector('[data-testid=dialog-confirm]')"))await click("[data-testid=dialog-confirm]");
  await until("!!document.querySelector('[data-testid=comparison-retained-lookup]')","M4 retained unknown after remount");
  check("M4 unknown survives route remount with no new write",(await evaluate("window.__u3.writes.length"))===writes);
  await click("[data-testid=comparison-retained-lookup]");
  await until("!document.querySelector('[data-testid=comparison-retained-lookup]')","M4 committed lookup");
  const first=(await evaluate("window.__u3.lastSelected"))[0];
  const memo=(await originalRequest(`/api/v1/companies/${first.companyId}/memos/${first.memoId}`)).value;
  check("M4 committed response loss resolves same ID without duplicate PATCH",memo.comparisonReason==="架空の確定応答途絶理由"&&(await evaluate("window.__u3.writes.length"))===writes);
  check("helper native beforeunload is not auto-accepted or raised",!actionTrace.some(event=>event.event==="native-dialog-open"));
  if(process.argv.includes("--m4-diagnostic"))throw Error("finite diagnostic only; M4 checks completed");
}
async function independentCheck(fixture, section) {
 const reasonSelector="textarea[data-testid=comparison-field-input]";
 if(section==="m6") {
  step="m6 independent";
  for (const mode of ["readInvalid", "delayRead"]) {
    const count = await evaluate("window.__u3.downloads.length");
    await evaluate(`window.__u3.mode=${JSON.stringify(mode)}`);
    await click("[data-testid=comparison-export]");
    await until("document.body.textContent.includes('参照を確認できないため出力していません')", `bounded output ${mode}`, 150);
    check(`M6 ${mode==='delayRead'?'15-second deadline':'invalid response'} creates zero files`, (await evaluate("window.__u3.downloads.length"))===count);
    if(mode==='delayRead') await evaluate("window.__u3.releaseRead();delete window.__u3.releaseRead");
    await click("[data-testid=comparison-refresh]");
    await readyComparison("output error recovery");
  }
  const beforeLate = await evaluate("({files:window.__u3.downloads.length,reads:window.__u3.completedReads??0})");
  await evaluate("window.__u3.mode='delayRead'");
  await click("[data-testid=comparison-export]");
  await until("typeof window.__u3.releaseRead==='function'", "delayed confirmation");
  await input(reasonSelector, "M6確認中に追加した本人入力");
  await evaluate("window.__u3.releaseRead();delete window.__u3.releaseRead");
  await until(`window.__u3.completedReads>${beforeLate.reads}`, "late read completed");
  await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
  check("M6 input generation rejects late output and retains draft", await evaluate(`window.__u3.downloads.length===${beforeLate.files}&&document.querySelector('textarea[data-testid=comparison-field-input]').value==='M6確認中に追加した本人入力'`));
  await click("[data-testid=comparison-legacy-entry]");await click("[data-testid=comparison-discard]");await click("[data-testid=comparison-server-entry]");
  await readyComparison("clean before legacy fixture");

 }
 if(section==="m8") {
  step="m8 independent";
  step = "supplemental legacy states";
  const legacyKey = "briefingNoteAi.savedCompanyMemos.v1", legacyRecord = {id:"legacy-fallback-id",memo:fixture.memos[1].structured_content,markdown:"架空旧本文",interestNote:{level:"undecided",memo:"旧理由"},savedAt:"2024/1/2",updatedAt:"2024/1/2"};
  await evaluate(`localStorage.setItem(${JSON.stringify(legacyKey)},${JSON.stringify(JSON.stringify([legacyRecord]))})`);
  const legacyRequests = await evaluate("window.__u3.requests");
  await click("[data-testid=comparison-legacy-entry]");
  await until("!!document.querySelector('[data-testid=legacy-comparison-reason]:not(:disabled)')", "normal legacy record");
  await input("[data-testid=legacy-comparison-reason]", "本人の旧比較編集");
  const legacyFiles = await evaluate("window.__u3.downloads.length");
  await click("[data-testid=legacy-comparison-export]");
  await until(`window.__u3.downloads.length===${legacyFiles+1}`, "legacy download");
  check("M8 normal legacy edit/output preserves fallback ID and original date without server traffic", await evaluate(`(()=>{const a=JSON.parse(localStorage.getItem(${JSON.stringify(legacyKey)}));return a[0].id==='legacy-fallback-id'&&a[0].savedAt==='2024/1/2'&&a[0].interestNote.memo==='本人の旧比較編集'&&window.__u3.downloads.at(-1)===document.querySelector('[data-testid=legacy-comparison-markdown]').value&&window.__u3.requests===${legacyRequests}})()`));
  await click("[data-testid=comparison-server-entry]");
  const mixed = JSON.stringify([legacyRecord,{invalid:true}]);
  await evaluate(`localStorage.setItem(${JSON.stringify(legacyKey)},${JSON.stringify(mixed)})`);
  await click("[data-testid=comparison-legacy-entry]");
  await until("document.body.textContent.includes('旧データに安全に読めない記録')", "mixed legacy corruption");
  check("M8 mixed corruption is readable and cannot drop original records", await evaluate(`document.querySelectorAll('[data-testid=legacy-comparison-select]').length===1&&document.querySelector('[data-testid=legacy-comparison-reason]').disabled&&localStorage.getItem(${JSON.stringify(legacyKey)})===${JSON.stringify(mixed)}`));
  await click("[data-testid=comparison-server-entry]");
  await evaluate(`window.__u3.storageRead=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key===${JSON.stringify(legacyKey)})throw Error('fictional unavailable');return window.__u3.storageRead.call(this,key)}`);
  await click("[data-testid=comparison-legacy-entry]");
  await until("document.body.textContent.includes('旧データを読み取れません。0件とは判断していません')", "unavailable legacy storage");
  check("M8 unavailable is distinct from zero records", await evaluate("!document.body.textContent.includes('保存済みメモがありません')"));
  await evaluate(`Storage.prototype.getItem=window.__u3.storageRead;delete window.__u3.storageRead;localStorage.removeItem(${JSON.stringify(legacyKey)})`);
  await click("[data-testid=comparison-server-entry]");
  await until("document.body.textContent.includes('比較対象が選択されていません')", "M8 independent returns to unselected server");
  check("M8 return preserves zero selection without creating comparison",await evaluate("document.querySelector('[data-testid=comparison-export]').disabled"));

 }
 if(section==="m7") {
  step="m7 independent";
  step = "supplemental controlled 401 restoration";
  await input(reasonSelector, "M7本人Aの保持入力");
  const authWrites = await evaluate("window.__u3.writes.length");
  await evaluate("window.__u3.mode='read401'");
  await click("[data-testid=comparison-refresh]");
  await until("!!document.querySelector('[data-testid=login-email]')", "controlled 401 hides workspace");
  check("M7 controlled 401 hides protected fields", await evaluate("!document.querySelector('[data-testid=comparison-field-input]')&&!document.body.textContent.includes('M7本人Aの保持入力')"));
  await login();
  await until("!!document.querySelector('[data-testid=comparison-restore]')", "same owner restoration gate");
  await click("[data-testid=comparison-restore-refresh]");
  await click("[data-testid=comparison-restore]");
  check("M7 same owner explicit fresh restoration retains draft and sends no new write", await evaluate(`document.querySelector('textarea[data-testid=comparison-field-input]').value==='M7本人Aの保持入力'&&window.__u3.writes.length===${authWrites}`));
  await click("[data-testid=comparison-legacy-entry]");await click("[data-testid=comparison-discard]");await click("[data-testid=comparison-server-entry]");
  await readyComparison("restored clean comparison");

 }
 if(section==="m10") {
  step="m10 independent";
  await evaluate("document.querySelector('[data-testid=comparison-table-scroll]').focus()");
  await key("ArrowRight",39);
  await until("document.querySelector('[data-testid=comparison-table-scroll]').scrollLeft>0", "keyboard table scroll");
  check("M10 labelled table scroll region is keyboard reachable", await evaluate("document.activeElement===document.querySelector('[data-testid=comparison-table-scroll]')&&!!document.activeElement.getAttribute('aria-label')"));
 }
}
async function extraCheck(fixture, section) {
 if(section==="m6-versions") {
  const selected=(await evaluate("window.__u3.lastSelected"))[0], cp=`/api/v1/companies/${selected.companyId}`,mp=`${cp}/memos/${selected.memoId}`,files=await evaluate("window.__u3.downloads.length");
  const during=process.argv.includes('--m6-during');
  async function holdConfirmation() {
   const before=await evaluate('window.__u3.completedReads??0');
   await evaluate("window.__u3.mode='delayRead'");await click('[data-testid=comparison-export]');
   await until("typeof window.__u3.releaseRead==='function'&&document.body.textContent.includes('保存参照の版を確認しています')&&!document.body.textContent.includes('参照が変わりました')",'new C3 confirmation is held');
   return before;
  }
  async function releaseConfirmation(before,status) {
   await evaluate('window.__u3.releaseRead();delete window.__u3.releaseRead');
   await until(`window.__u3.completedReads>${before}&&window.__u3.readResponses.at(-1).status===${status}`,'this C3 confirmation completed');
  }
  for(const kind of ["structure","interest","reason"]) {
   step="M6 version "+kind; const path=kind==="interest"?cp:mp,current=(await originalRequest(path)).value;
   const before=during?await holdConfirmation():null;
   const changes=kind==="structure"?{structuredContent:{...current.structuredContent,strengths:["架空の別client構造"]}}:kind==="interest"?{interestLevel:"high"}:{comparisonReason:"架空の別client理由"};
   if((await originalRequest(path,"PATCH",{operationId:randomUUID(),expectedVersion:current.version,changes})).status!==200)throw Error("M6 fixture update rejected");
   if(during)await releaseConfirmation(before,200);else await click("[data-testid=comparison-export]");
   await until("document.body.textContent.includes('参照が変わりました')","changed "+kind);
   check("M6 changed "+kind+" version creates zero files",(await evaluate("window.__u3.downloads.length"))===files,{duringConfirmation:during,completedAfterBaseline:during?await evaluate(`window.__u3.completedReads>${before}`):null});
  }
  for(const kind of ["memo","company"]) {
   step="M6 delete "+kind;const before=during?await holdConfirmation():null;
   const confirmation=await originalRequest("/api/v1/deletion-confirmations","POST",{companyId:selected.companyId,memoId:kind==="memo"?selected.memoId:null});
   if(confirmation.status!==200||(await originalRequest("/api/v1/deletions","POST",{operationId:randomUUID(),confirmationId:confirmation.value.confirmationId})).status!==200)throw Error("M6 fixture delete rejected");
   if(during)await releaseConfirmation(before,404);else await click("[data-testid=comparison-export]");
   await until("document.body.textContent.includes('参照を確認できないため出力していません')","deleted "+kind);
   check("M6 deleted "+kind+" creates zero files",(await evaluate("window.__u3.downloads.length"))===files,{duringConfirmation:during,completedAfterBaseline:during?await evaluate(`window.__u3.completedReads>${before}`):null});
   if(kind==="memo")await chooseMemo(selected.companyId,fixture.memos.find(m=>m.company_id===selected.companyId&&m.structured_content&&m.memo_id!==selected.memoId).memo_id);
  }
 }
 if(section==="m12") {
  step="M12 detail body";await send("Page.navigate",{url:origin+"/companies/"+fixture.companies[0].company_id});
  await until("[...document.querySelectorAll('li button')].some(e=>e.textContent.includes('構造化項目あり'))","existing structured memo");
  await evaluate("[...document.querySelectorAll('li button')].find(e=>e.textContent.includes('構造化項目あり')).click()");
  await until("!!document.querySelector('[data-testid=memo-markdown]')&&!!window.__u3.lastMemoPath","existing editor");
  const path=await evaluate("window.__u3.lastMemoPath"),before=(await originalRequest(path)).value,body=process.argv.includes("--structure-only")?before.markdown:"M12本人編集の保存本文";
  if(!process.argv.includes("--structure-only")){await input("[data-testid=memo-markdown]",body);await button("本文を保存");}
  await until(`(async()=>{const r=await window.__u3.original(${JSON.stringify(path)});return r.ok&&(await r.json()).markdown===${JSON.stringify(body)}})()`,"body persisted");
  const afterBody=(await originalRequest(path)).value;
  if(!process.argv.includes("--structure-only"))check("M12 body save preserves structure",afterBody.version!==before.version&&JSON.stringify(afterBody.structuredContent)===JSON.stringify(before.structuredContent));
  step="M12 detail structure";await click("#memo-tab-1");
  await until("!document.querySelector('#memo-panel-1').hidden","M12 visible structure tab");
  await evaluate("(()=>{const e=[...document.querySelectorAll('#memo-panel-1 fieldset')].find(e=>e.querySelector('legend')?.textContent==='強み')?.querySelector('textarea');if(!e)throw Error();e.dataset.u3HelperStrength='true'})()");
  await input("[data-u3-helper-strength]","M12本人編集の構造");
  check("helper M12 structure input is focused and visible",await evaluate("document.activeElement===document.querySelector('[data-u3-helper-strength]')&&document.activeElement.value==='M12本人編集の構造'&&!document.querySelector('#memo-panel-1').hidden"));
  await button("比較用項目を保存");
  await until(`(async()=>{const r=await window.__u3.original(${JSON.stringify(path)});return r.ok&&(await r.json()).structuredContent.strengths[0]==='M12本人編集の構造'})()`,"structure persisted");
  const afterStructure=(await originalRequest(path)).value;
  check("M12 structure save preserves body",afterStructure.version!==afterBody.version&&afterStructure.markdown===body);
  await click("#memo-tab-0");const files=await evaluate("window.__u3.downloads.length");await button("Markdownを出力");
  await until(`window.__u3.downloads.length===${files+1}`,"saved body output");
  check("M12 saved body outputs corresponding Markdown",await evaluate(`window.__u3.downloads.at(-1)===${JSON.stringify(body)}&&document.querySelector('[data-testid=memo-markdown]').value===${JSON.stringify(body)}`));
 }
}
async function m9Check(fixture) {
 const reason="textarea[data-testid=comparison-field-input]",save="textarea[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]";
 const keyboard=process.argv.includes('--m9-keyboard');
 const tabCounts=[];
 async function tabTo(selector) {
  const target=`[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length&&!e.disabled&&getComputedStyle(e).visibility!=='hidden')`;
  for(let count=0;count<250;count++) {
   if(await evaluate(`document.activeElement===(${target})`)){tabCounts.push(count);return;}
   await key('Tab',9);
  }
  throw Error('keyboard target not reached within finite Tab traversal');
 }
 async function enterReason(value) {
  if(!keyboard)return input(reason,value);
  await tabTo(reason);
  const event={key:'a',code:'KeyA',windowsVirtualKeyCode:65,nativeVirtualKeyCode:65,modifiers:2};
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',...event},currentSession);
  await send('Input.dispatchKeyEvent',{type:'keyUp',...event},currentSession);
  await send('Input.insertText',{text:value},currentSession);
 }
 async function activationKey(space=false) {
  const event={key:space?' ':'Enter',code:space?'Space':'Enter',windowsVirtualKeyCode:space?32:13,nativeVirtualKeyCode:space?32:13};
  await send('Input.dispatchKeyEvent',{type:'keyDown',...event,text:space?' ':'\r',unmodifiedText:space?' ':'\r'},currentSession);
  await send('Input.dispatchKeyEvent',{type:'keyUp',...event},currentSession);
 }
 if(keyboard) {
  for(const radio of [false,true]) {
   await evaluate(`(()=>{const e=document.createElement(${JSON.stringify(radio?'input':'button')});${radio?"e.type='radio';":"e.textContent='helper keyboard delivery';"}e.dataset.u3KeyProbe='true';window.__u3.keyProbe=[];for(const type of ['keydown','keypress','keyup','click'])e.addEventListener(type,event=>window.__u3.keyProbe.push({type,trusted:event.isTrusted}));document.body.appendChild(e);e.focus()})()`);
   await activationKey(radio);
   const probe=await evaluate("(()=>{const events=window.__u3.keyProbe;document.querySelector('[data-u3-key-probe]').remove();return {types:events.map(e=>e.type),trusted:events.every(e=>e.trusted)}})()");
   const passed=probe.trusted&&['keydown','keypress','keyup','click'].every(type=>probe.types.includes(type));
   check('helper trusted '+(radio?'Space radio':'Enter button')+' delivery',passed,probe);
   if(!passed)throw Error('helper keyboard activation not delivered');
  }
 }
 async function layout(label) {
  const expected=["強み・特徴","懸念・気になった点","自分との接点・印象","HR・社員の強調点","求める人物像","ES・面接で使える材料","次に聞きたい質問"];
  const result=await evaluate(`(()=>{const table=document.querySelector('[data-testid=comparison-table-scroll]'),mobile=document.querySelector('[data-testid=comparison-mobile-points]'),desktop=innerWidth>=768,shown=desktop?table:mobile,hidden=desktop?mobile:table;if(!shown||!hidden)return {ok:false};shown.scrollIntoView({block:'start'});const r=shown.getBoundingClientRect(),labels=[...shown.querySelectorAll(desktop?'tbody tr th':'section > h3')].map(e=>e.textContent.trim());return {ok:shown.getClientRects().length>0&&hidden.getClientRects().length===0&&r.top<innerHeight&&r.bottom>0&&JSON.stringify(labels)===${JSON.stringify(JSON.stringify(expected))},width:innerWidth,mode:desktop?'PC table':'mobile points',points:labels.length}})()`);
  check("M9 "+label+" visible layout and fixed seven-point order",result.ok,{width:result.width,mode:result.mode,points:result.points});
  if(!result.ok)throw Error('M9 visible layout not confirmed');
 }
 async function activate(selector) {
  const visible=`[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length&&!e.disabled&&getComputedStyle(e).visibility!=='hidden')`;
  await until(`!!(${visible})`,"visible enabled keyboard control");
  if(keyboard)await tabTo(selector);
  const point=await evaluate(`(()=>{const e=${visible};e.scrollIntoView({block:'center'});${keyboard?'':'e.focus();'}const r=e.getBoundingClientRect(),x=Math.min(innerWidth-1,Math.max(1,r.x+r.width/2)),y=Math.min(innerHeight-1,Math.max(1,r.y+r.height/2)),hit=document.elementFromPoint(x,y);if(document.activeElement!==e||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth||!(hit===e||e.contains(hit)))throw Error('control outside viewport');window.__u3.lastActivationTrusted=false;e.addEventListener('click',event=>{window.__u3.lastActivationTrusted=event.isTrusted},{once:true});return {x,y}})()`);
  if(keyboard)await activationKey(await evaluate("document.activeElement.matches('input[type=radio]')"));
  else {
   await send("Input.dispatchMouseEvent",{type:"mousePressed",...point,button:"left",clickCount:1},currentSession);
   await send("Input.dispatchMouseEvent",{type:"mouseReleased",...point,button:"left",clickCount:1},currentSession);
  }
  if(!(await evaluate("window.__u3.lastActivationTrusted===true")))throw Error('trusted click not delivered');
 }
 async function selectVisibleCompany() {
  await evaluate(`(()=>{const b=[...document.querySelectorAll('[data-testid=comparison-load-memos]')].find(e=>e.closest('section').textContent.includes(${JSON.stringify(fixture.companies[0].company_id)}));if(!b)throw Error();b.dataset.u3M9Load='true'})()`);
  await activate('[data-u3-m9-load]');
  await until("!!document.querySelector('[data-u3-m9-load]').closest('section').querySelector('input:not(:disabled)')","M9 visible candidate");
  await evaluate("document.querySelector('[data-u3-m9-load]').closest('section').querySelector('input:not(:disabled)').dataset.u3M9Candidate='true'");
  await activate('[data-u3-m9-candidate]');
  await readyComparison('M9 visible selection');
 }
 async function operations(label, reuseOutput=false) {
  step="M9 "+label;
  if(await evaluate("!!document.querySelector('[data-testid=comparison-remove-company]')"))await activate("[data-testid=comparison-remove-company]");
  await selectVisibleCompany();
  if(keyboard) {
   await tabTo('select[data-testid=comparison-field-input]');
   await key('ArrowDown',40);
   await until("document.querySelector('select[data-testid=comparison-field-input]').value==='high'",'keyboard selected interest');
   await activate('select[data-testid=comparison-field-input] ~ button[data-testid=comparison-field-save]');
   await until("document.querySelector('select[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')",'keyboard interest saved');
   await activate('[data-testid=comparison-refresh]');await readyComparison('keyboard interest comparison');
   check('M10 keyboard interest changes only its field',await evaluate("Object.keys(JSON.parse(window.__u3.writes.at(-1).body).changes).join(',')==='interestLevel'"));
  }
  const first=(await evaluate("window.__u3.lastSelected"))[0],path=`/api/v1/companies/${first.companyId}/memos/${first.memoId}`;
  await enterReason("M9長文|<script>window.__unsafe=true</script>\\n".repeat(20));
  await evaluate("window.__u3.mode='unknown'");await activate(save);
  await until("!!document.querySelector('[data-testid=comparison-retained-lookup]')","M9 unknown");
  await activate("[data-testid=comparison-retained-lookup]");
  await activate("[data-testid=comparison-retained-retry]");
  await until("!document.querySelector('[data-testid=comparison-retained-lookup]')&&document.querySelector('textarea[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')","M9 retry committed");
  // Retained-operation controls preserve the result; comparison refresh is explicit.
  await activate("[data-testid=comparison-refresh]");
  await readyComparison("M9 "+label+" retry ready");
  check("M9 "+label+" selection/comparison/independent-save/unknown visible recovery",await evaluate("window.__u3.writes.at(-1).body===window.__u3.writes.at(-2).body&&Object.keys(JSON.parse(window.__u3.writes.at(-1).body).changes).join(',')==='comparisonReason'"));
  const draft="M9保持入力 "+label,latest="M9最新 "+label;
  await enterReason(draft);const current=(await originalRequest(path)).value;
  if((await originalRequest(path,"PATCH",{operationId:randomUUID(),expectedVersion:current.version,changes:{comparisonReason:latest}})).status!==200)throw Error("M9 conflict fixture rejected");
  await activate(save);await until("document.body.textContent.includes('競合・保持入力')","M9 conflict");
  await activate("[data-testid=comparison-field-latest]");
  await until(`document.body.textContent.includes(${JSON.stringify(latest)})`,"M9 latest");
  check("M9 "+label+" conflict retains input/base/latest",await evaluate(`document.querySelector(${JSON.stringify(reason)}).value===${JSON.stringify(draft)}&&document.body.textContent.includes('元の基準')`));
  await activate("[data-testid=comparison-field-rebase]");await activate(save);
  await until("!document.body.textContent.includes('競合・保持入力')&&document.querySelector('textarea[data-testid=comparison-field-input]').closest('section').textContent.includes('保存成功')","M9 explicit rebase commit");
  await readyComparison("M9 "+label+" rebase ready");
  if(!reuseOutput) {
   const files=await evaluate("window.__u3.downloads.length");await activate("[data-testid=comparison-export]");
   await until(`window.__u3.downloads.length===${files+1}`,"M9 keyboard output");
   await activate("[data-testid=comparison-legacy-entry]");
   await until("document.body.textContent.includes('サーバーの保存企業やアカウントへ移行')","M9 keyboard legacy");
   await activate("[data-testid=comparison-server-entry]");await readyComparison("M9 "+label+" return");
  }
  check("M9 "+label+" reachable controls/long-text safety",await evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1&&window.__unsafe!==true"),{reusePriorNativeOutputLegacy:reuseOutput});
  await layout(label);
  if(keyboard) {
   await tabTo('[data-testid=comparison-table-scroll]');
   check('M10 trusted Tab reaches primary controls and labelled comparison scroll',await evaluate("document.activeElement===document.querySelector('[data-testid=comparison-table-scroll]')&&!!document.activeElement.getAttribute('aria-label')"),{traversals:tabCounts.length,totalTabs:tabCounts.reduce((sum,value)=>sum+value,0),maxTabs:Math.max(...tabCounts)});
  }
 }
 const oneWidth=process.argv.find(arg=>/^--m9-width=(1366|390|320|767|768)$/.test(arg));
 const oneNative=process.argv.find(arg=>/^--m9-native=(200|400)$/.test(arg));
 const layoutOnly=process.argv.includes('--m9-layout-only');
 if(layoutOnly)await selectVisibleCompany();
 for(const width of oneNative?[]:layoutOnly?[1366,390]:oneWidth?[Number(oneWidth.split('=')[1])]:[1366,390,320,767,768]) {
  await send("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:768,deviceScaleFactor:1,mobile:width===390});
  if(layoutOnly)await layout("viewport "+width);else await operations("viewport "+width);
 }
 await send("Emulation.clearDeviceMetricsOverride");
 if(oneWidth||layoutOnly)return;
 const setting=await send("Target.createTarget",{url:"edge://settings/appearance"}),attached=await send("Target.attachToTarget",{targetId:setting.targetId,flatten:true});
 let ready=false;
 for(let i=0;i<40&&!ready;i++){ready=(await send("Runtime.evaluate",{expression:"typeof chrome.settingsPrivate?.setDefaultZoom==='function'",returnByValue:true},attached.sessionId)).result?.value===true;if(!ready)await pause(100);}
 if(!ready)throw Error("native zoom capability unavailable");
 let baseWidth;
 try {
  for(const zoom of oneNative?[1,Number(oneNative.split('=')[1])/100]:[1,2,4]) {
   await send("Runtime.evaluate",{expression:`chrome.settingsPrivate.setDefaultZoom(${zoom});true`,returnByValue:true},attached.sessionId);
   const tab=await send("Target.createTarget",{url:origin+"/compare"}),session=await send("Target.attachToTarget",{targetId:tab.targetId,flatten:true});currentSession=session.sessionId;
   await until("!!document.querySelector('[data-testid=comparison-load-memos]')","M9 native tab");
   await evaluate(instrumentation);
   const metrics=await evaluate("({width:innerWidth,dpr:devicePixelRatio})");
   if(zoom===1)baseWidth=metrics.width;
   else {check("M9 native "+zoom*100+"% real metrics",Math.abs(metrics.width*zoom-baseWidth)<=4&&Math.abs(metrics.dpr-zoom)<0.1,{...metrics,baseWidth});await operations("native "+zoom*100+"%",true);}
   await send("Target.closeTarget",{targetId:tab.targetId});currentSession=undefined;
  }
 } finally {
  currentSession=undefined;
  await send("Runtime.evaluate",{expression:"chrome.settingsPrivate.setDefaultZoom(1);true",returnByValue:true},attached.sessionId);
  await send("Target.closeTarget",{targetId:setting.targetId});
 }
}
async function securityCheck() {
 console.log(JSON.stringify({securityBaseline:{externalRequests:securityExternalRequests,events:securityExternalEvidence}}));
 const externalBaseline=securityExternalRequests;
 const knownBaseline=securityExternalEvidence.every(event=>event.stage==='login'&&event.knownBaselineAnalytics&&event.type==='Script'&&event.method==='GET'&&!event.fixtureHost&&!event.unsafeMarker);
 const noOperationExternal=()=>knownBaseline&&securityExternalRequests===externalBaseline;
 const files=await evaluate('window.__u3.downloads.length');
 step='M9 safe text output';
 await click('[data-testid=comparison-export]');
 await until(`window.__u3.downloads.length===${files+1}`,'safe text Markdown');
 const safeText=await evaluate("({notExecuted:window.__unsafe!==true,textDisplay:document.body.textContent.includes('<img src=x onerror=window.__unsafe=true>'),noUnsafeElement:!document.querySelector('img[onerror]'),markdownScript:window.__u3.downloads.at(-1).includes('&lt;script&gt;'),markdownImage:window.__u3.downloads.at(-1).includes('&lt;img'),markdownSymbols:window.__u3.downloads.at(-1).includes('記号\\\\|'),markdownNewline:window.__u3.downloads.at(-1).includes('<br>次行')})");
 check('M9 script img and Markdown symbols remain safe text in display and output',noOperationExternal()&&Object.values(safeText).every(Boolean),{...safeText,externalRequests:securityExternalRequests,baselineRequests:externalBaseline,operationExternalRequests:securityExternalRequests-externalBaseline,events:securityExternalEvidence});
 for(const [label,url] of [["javascript","javascript:window.__unsafe=true"],["data","data:text/html,<script>window.__unsafe=true</script>"],["credentials","https://user:pass@example.test"]]) {
  step='M6/M9 contract URL '+label;
  const before=await evaluate("({files:window.__u3.downloads.length,delivered:window.__u3.securityDelivered??0})");
  await evaluate(`window.__u3.unsafeUrl=${JSON.stringify(url)}`);
  await click('[data-testid=comparison-export]');
  await until("document.body.textContent.includes('参照を確認できないため出力していません')",'contract URL rejection');
  const facts=await evaluate(`({delivered:window.__u3.securityDelivered===${before.delivered+1},noFile:window.__u3.downloads.length===${before.files},notExecuted:window.__unsafe!==true,noUnsafeLink:![...document.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===${JSON.stringify(url)})})`);
  check('M9 '+label+' contract-invalid response is delivered and creates zero files',noOperationExternal()&&Object.values(facts).every(Boolean),{...facts,externalRequests:securityExternalRequests,baselineRequests:externalBaseline,operationExternalRequests:securityExternalRequests-externalBaseline,events:securityExternalEvidence});
  await click('[data-testid=comparison-refresh]');await readyComparison('M9 contract URL recovery');
 }
 step='M6 401 during export';
 const before=await evaluate("({files:window.__u3.downloads.length,operations:window.__u3.operations})");
 await evaluate("window.__u3.mode='read401'");
 await click('[data-testid=comparison-export]');
 await until("!!document.querySelector('[data-testid=login-email]')",'export 401 hides protected view');
 check('M6 401 during output creates zero files and hides protected fields',await evaluate(`window.__u3.downloads.length===${before.files}&&window.__u3.operations===${before.operations}&&!document.querySelector('[data-testid=comparison-field-input]')`));
}
async function seed() {
  admin = new Client({ connectionString: connection });
  await admin.connect();
  if (!/^u1_preview_[a-f0-9]{32}$/.test(schema))
    throw Error("dedicated schema ownership missing");
  const companies = Array.from({ length: 100 }, (_, i) => ({
    company_id: randomUUID(),
    owner_id: owner,
    name: i < 2 ? "同名架空企業" : `U3架空企業${String(i).padStart(3, "0")}`,
    selection_status: i === 1 ? "rejected" : "not_applied",
    interest_level: i % 2 ? "undecided" : null,
  }));
  const memos = Array.from({ length: 1000 }, (_, i) => {
    const c = companies[i < 50 ? 0 : 1 + ((i - 50) % 99)],
      length = i < 880 ? 1000 : i < 980 ? 5000 : 10000,
      generated = i % 3 !== 0,
      structure = {
        overview: {
          companyName: "生成名は保存名と別",
          eventName: "架空説明会",
          eventDate: "2026-10-17",
          speakers: "架空担当",
        },
        facts: ["紙の事実"],
        emphasizedPoints: ["HR強調"],
        business: ["紙の事業"],
        strengths: [`紙の強み${i}`, "<script>window.__unsafe=true</script>", ...(process.argv.includes('--section=m6-security')?["<img src=x onerror=window.__unsafe=true>", "記号|括弧[架空]\n次行"]:[])],
        idealCandidate: ["求める人物"],
        impressions: ["本人の印象"],
        concerns: [],
        questions: ["要確認"],
        esPoints: ["ES材料"],
        nextResearch: [],
      };
    return {
      memo_id: randomUUID(),
      owner_id: owner,
      company_id: c.company_id,
      origin: generated ? "generated" : "manual",
      provider_origin: generated ? (i % 3 === 1 ? "dummy" : "openai") : null,
      markdown: "架空本文".repeat(Math.ceil(length / 4)).slice(0, length),
      structured_content: i === 0 ? null : structure,
      corrected_ocr: "架空訂正OCR".repeat(100),
      event: {
        companyName: "保存名とは別",
        eventName: "架空説明会",
        eventDate: "2026-10-17",
      },
      adopted_web_sources: Array.from({ length: 4 }, (_, j) => ({
        id: `source-${i}-${j}`,
        category: "Web区分",
        content: `Webのみ${j}`,
        sourceUrl: `https://example.test/source/${i}/${j}`,
        fetchedAt: "2026-10-17T00:00:00.000Z",
        confidence: j ? "high" : "requires_check",
        status: "adopted",
      })),
      comparison_reason: i === 1 ? "保存済み理由" : null,
    };
  });
  await admin.query("BEGIN");
  try {
    await admin.query(
      `insert into ${schema}.companies(company_id,owner_id,name,selection_status,interest_level) select company_id,owner_id,name,selection_status,interest_level from jsonb_to_recordset($1::jsonb) as x(company_id uuid,owner_id uuid,name text,selection_status text,interest_level text)`,
      [JSON.stringify(companies)],
    );
    await admin.query(
      `insert into ${schema}.memos(memo_id,owner_id,company_id,origin,provider_origin,markdown,structured_content,corrected_ocr,event,adopted_web_sources,comparison_reason) select * from jsonb_to_recordset($1::jsonb) as x(memo_id uuid,owner_id uuid,company_id uuid,origin text,provider_origin text,markdown text,structured_content jsonb,corrected_ocr text,event jsonb,adopted_web_sources jsonb,comparison_reason text)`,
      [JSON.stringify(memos)],
    );
    await admin.query(
      `insert into ${schema}.write_operations(owner_id,operation_id,request_fingerprint,action,company_id,memo_id,resulting_version) select $1,gen_random_uuid(),repeat('a',64),'memo_update',$2,$3,gen_random_uuid() from generate_series(1,10000)`,
      [owner, companies[0].company_id, memos[1].memo_id],
    );
    await admin.query("COMMIT");
  } catch (error) {
    await admin.query("ROLLBACK");
    throw error;
  }
  const size = await admin.query(
    "select pg_database_size(current_database())::bigint bytes,version() version",
  );
  return {
    companies,
    memos,
    selected: companies.slice(0, 20).map((c) => ({
      companyId: c.company_id,
      memoId: memos.find(
        (m) => m.company_id === c.company_id && m.structured_content,
      )?.memo_id,
    })),
    bytes: Buffer.byteLength(JSON.stringify({ companies, memos })),
    databaseBytes: Number(size.rows[0].bytes),
    databaseVersion: size.rows[0].version,
  };
}
async function measure(fixture, cookie) {
  const request = async () => {
    const start = performance.now();
    const r = await fetch(origin + "/api/v1/comparison-sources", {
      method: "POST",
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selected: fixture.selected }),
      signal: AbortSignal.timeout(15000),
    });
    const value = await r.json();
    return {
      ms: performance.now() - start,
      ok: r.ok && value.sources?.length === 20,
    };
  };
  const cold = await request();
  for (let i = 0; i < 5; i++) await request();
  const all = (
    await Promise.all(
      [0, 1].map(async () => {
        const values = [];
        for (let i = 0; i < 50; i++) values.push(await request());
        return values;
      }),
    )
  ).flat();
  const sorted = all.map((v) => v.ms).sort((a, b) => a - b),
    p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  performanceEvidence = {
    kind: "real TCP HTTP; local reference",
    clients: 2,
    operationsPerClient: 50,
    warmup: 5,
    p95Ms: p95,
    maxMs: sorted.at(-1),
    failures: all.filter((v) => !v.ok).length,
    coldRequestMs: cold.ms,
    fixtureBytes: fixture.bytes,
    databaseBytes: fixture.databaseBytes,
    databaseVersion: fixture.databaseVersion,
    fixtureCounts: { companies: 100, memos: 1000, operations: 10000 },
    node: process.version,
    os: `${platform()} ${release()}`,
    region: "local loopback; production unverified",
  };
  check(
    "M11 real HTTP20-company p95 <=2sec and DB <=200MiB",
    p95 <= 2000 &&
      performanceEvidence.failures === 0 &&
      fixture.databaseBytes <= 200 * 1024 * 1024,
    performanceEvidence,
  );
}
const watchdog = setTimeout(() => {
  socket?.close();
  void stopTree(edge);
  preview?.stdin?.write("stop\n");
}, 240000);
try {
  for (const url of [
    origin + "/api/health",
    "http://127.0.0.1:9224/json/version",
  ]) {
    if (
      await fetch(url, { signal: AbortSignal.timeout(1000) }).then(
        () => true,
        () => false,
      )
    )
      throw Error("dedicated port occupied; no adoption");
  }
  preview = spawn(process.execPath, ["scripts/local-workspace-preview.mjs"], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    env: { ...process.env, WEB_SUPPLEMENT_ENABLED: "true" },
  });
  const log = (data) => {
    const value = String(data);
    previewLog = (previewLog + value).slice(-50000);
    for (const line of value.split(/\r?\n/)) {
      try {
        const item = JSON.parse(line);
        if (item.schema) {
          previewMetadata = item;
          schema = item.schema;
        }
      } catch {
        /* bounded local Next output; not product data */
      }
    }
  };
  preview.stdout.on("data", log);
  preview.stderr.on("data", log);
  let ready = false;
  for (let i = 0; i < 150; i++) {
    ready = await fetch(origin + "/api/health", {
      signal: AbortSignal.timeout(3000),
    }).then(
      (r) => r.ok,
      () => false,
    );
    if (ready && schema) break;
    if (preview.exitCode !== null) throw Error("preview stopped before ready");
    await pause(200);
  }
  if (!ready || !schema) throw Error("dedicated preview not ready");
  step = "fixture";
  const fixture = await seed();
  profile = await mkdtemp(join(tmpdir(), "u3-edge-"));
  const executable = join(
    process.env["ProgramFiles(x86)"] ?? process.env.ProgramFiles ?? "",
    "Microsoft",
    "Edge",
    "Application",
    "msedge.exe",
  );
  edge = spawn(
    executable,
    [
      "--headless=new",
      "--window-size=1366,768",
      "--disable-gpu",
      "--no-first-run",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=9224",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  edge.on("error", () => {});
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    page = await fetch("http://127.0.0.1:9224/json/list", {
      signal: AbortSignal.timeout(1000),
    })
      .then((r) => r.json())
      .then(
        (p) => p.find((p) => p.type === "page"),
        () => null,
      );
    if (!page) await pause(150);
  }
  if (!page) throw Error("dedicated Edge unavailable");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await once(socket, "open");
  socket.addEventListener("message", (event) => {
    cdpEvidence.messages++;
    const message = JSON.parse(String(event.data)),
      task = pending.get(message.id);
    if(message.method==='Network.requestWillBeSent'&&process.argv.includes('--section=m6-security')) {
      const url=message.params?.request?.url;
      if(typeof url==='string'&&/^https?:/.test(url)&&new URL(url).origin!==origin) {
        securityExternalRequests++;
        const parsed=new URL(url);
        securityExternalEvidence.push({stage:step,scheme:parsed.protocol,type:message.params.type,method:message.params.request.method,fixtureHost:parsed.hostname==='example.test',loopback:['127.0.0.1','localhost'].includes(parsed.hostname),appPort:parsed.port==='3000',unsafeMarker:url.includes('__unsafe'),knownBaselineAnalytics:parsed.hostname==='va.vercel-scripts.com'&&parsed.pathname==='/v1/script.debug.js'});
      }
    }
    if (message.method === "Page.javascriptDialogOpening") {
      actionTrace.push({action:activeAction,event:"native-dialog-open",type:message.params?.type});
      console.log(JSON.stringify(actionTrace.at(-1)));
    }
    if (message.id !== undefined) cdpEvidence.responses++;
    else cdpEvidence.events++;
    if (task) {
      pending.delete(message.id);
      clearTimeout(task.timer);
      if (message.error) task.reject(Error("CDP command rejected"));
      else task.resolve(message.result);
    }
  });
  socket.addEventListener("close", () => {
    cdpEvidence.closed = true;
  });
  step = "CDP transport capability";
  await send("Browser.getVersion");
  step = "CDP Page capability";
  await send("Page.enable");
  await send("Runtime.enable");
  if(process.argv.includes('--section=m6-security'))await send('Network.enable');
  await send("Page.bringToFront");
  const browser = await send("Browser.getVersion");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: instrumentation,
  });
  await send("Page.navigate", { url: origin + "/compare" });
  step = "login";
  await login();
  check(
    "M10 comparison entry focuses h1",
    await evaluate(
      "document.activeElement===document.querySelector('[data-testid=comparison-heading]')",
    ),
  );
  const cookies = await send("Network.getCookies", { urls: [origin] });
  const cookie = cookies.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  if (process.argv.includes("--diagnose-switch")) await diagnoseSwitch(fixture);
  if (process.argv.includes("--m4-diagnostic") || process.argv.includes("--m4-check")) {
    await diagnoseM4(fixture);
    console.log(JSON.stringify({kind:"M4 only",browser:browser.product,node:process.version,results}));
    process.exitCode=results.every(result=>result.passed)?0:1;
  } else if (process.argv.some(arg=>/^--section=(?:m(?:6|7|8|9|10|12)|m6-versions|m6-security)$/.test(arg))) {
    const section=process.argv.find(arg=>arg.startsWith('--section=')).split('=')[1];
    if(section!=="m8"&&section!=="m12"&&section!=="m9") {
      if(section==='m6-security')step='M6-security selection';
      for(const company of fixture.companies.slice(0,section==="m10"?20:1)) await selectCompany(company.company_id);
    }
    await action(section+"-independent",()=>section==="m6-security"?securityCheck():section==="m9"?m9Check(fixture):["m12","m6-versions"].includes(section)?extraCheck(fixture,section):independentCheck(fixture,section));
    console.log(JSON.stringify({kind:section+" only",browser:browser.product,node:process.version,results}));
    process.exitCode=results.every(result=>result.passed)?0:1;
  } else if (process.argv.includes("--remaining")) {
    for (const company of fixture.companies.slice(0,20)) await selectCompany(company.company_id);
    const first = (await evaluate("window.__u3.lastSelected"))[0];
    const company = (await originalRequest(`/api/v1/companies/${first.companyId}`)).value;
    const update = await originalRequest(`/api/v1/companies/${first.companyId}`, "PATCH", {operationId:randomUUID(),expectedVersion:company.version,changes:{interestLevel:"medium"}});
    if(update.status!==200)throw Error("remaining fixture update rejected");
    await click("[data-testid=comparison-refresh]");
    await readyComparison("remaining fixture ready");
    await remainingChecks(fixture,first);
    console.log(JSON.stringify({kind:"remaining M checks only; prior full/native/performance evidence separate",browser:browser.product,node:process.version,results}));
    process.exitCode=results.every(result=>result.passed)?0:1;
  } else {
  step = "HTTP reference measurement";
  if (!process.argv.includes("--diagnose-switch")) await measure(fixture, cookie);
  step = "selection";
  check(
    "M1 unselected is not a fabricated comparison",
    await evaluate(
      "document.body.textContent.includes('比較対象が選択されていません')&&document.querySelector('[data-testid=comparison-export]').disabled",
    ),
  );
  await selectCompany(fixture.companies[0].company_id);
  check(
    "M1/M2 one company and fixed seven points",
    await evaluate(
      "window.__u3.lastSelected.length===1&&document.body.textContent.includes('未記載')&&document.body.textContent.includes('要確認')",
    ),
  );
  await selectCompany(fixture.companies[1].company_id);
  const companyScope = `[...document.querySelectorAll('[data-testid=comparison-load-memos]')].find(b=>b.closest('section').textContent.includes(${JSON.stringify(fixture.companies[0].company_id)})).closest('section')`;
  for (let page = 0; page < 2; page++) {
    await evaluate(
      `(()=>{const e=${companyScope}.querySelector('[data-testid=comparison-more-memos]');if(!e||e.disabled)throw Error();e.click()})()`,
    );
    await until(
      `!${companyScope}.querySelector('[data-testid=comparison-more-memos]')?.disabled`,
      "next page complete",
    );
  }
  check(
    "M1 50 owned memos use multiple pages and distinguish body-only",
    await evaluate(
      `${companyScope}.querySelectorAll('input').length===50&&${companyScope}.textContent.includes('構造化項目なし')`,
    ),
  );
  for (const company of fixture.companies.slice(2, 21))
    await selectCompany(company.company_id);
  check(
    "M1 20 selected / 21st rejected without changing saved company count",
    await evaluate(
      "window.__u3.lastSelected.length===20&&document.body.textContent.includes('1〜20社')&&document.body.textContent.includes('全保存企業 100社')",
    ),
  );
  check(
    "M1 same-name distinct IDs and ended company",
    await evaluate(
      `window.__u3.lastSelected.some(s=>s.companyId===${JSON.stringify(fixture.companies[0].company_id)})&&window.__u3.lastSelected.some(s=>s.companyId===${JSON.stringify(fixture.companies[1].company_id)})&&document.body.textContent.includes('終了企業')`,
    ),
  );
  const idle = await evaluate("window.__u3.requests");
  await pause(2000);
  check(
    "M11 idle extra API requests zero",
    (await evaluate("window.__u3.requests")) - idle === 0,
  );
  check(
    "M9 dangerous HTML remains text",
    await evaluate(
      "window.__unsafe!==true&&!document.querySelector('script:not([src])')?.textContent?.includes('window.__unsafe=true')",
    ),
  );
  step = "independent fields";
  const reasonSelector = "textarea[data-testid=comparison-field-input]";
  await input(reasonSelector, "本人の理由|改行\n次の行");
  check(
    "M10 typing keeps input focus",
    await evaluate(
      `document.activeElement===document.querySelector(${JSON.stringify(reasonSelector)})`,
    ),
  );
  await evaluate("window.__u3.mode='reject'");
  await click(
    "textarea[data-testid=comparison-field-input] + button[data-testid=comparison-field-save]",
  ).catch(async () => {
    await evaluate(
      "[...document.querySelectorAll('[data-testid=comparison-field-save]')].find(b=>b.textContent.includes('比較理由')).click()",
    );
  });
  await until(
    "document.body.textContent.includes('保存を拒否')",
    "field rejection",
  );
  check(
    "M3 rejection retains reason",
    await evaluate(
      `document.querySelector(${JSON.stringify(reasonSelector)}).value.includes('本人の理由')`,
    ),
  );
  await evaluate("window.__u3.mode='unknown'");
  await evaluate(
    "[...document.querySelectorAll('[data-testid=comparison-field-save]')].find(b=>b.textContent.includes('比較理由')).click()",
  );
  await until("document.body.textContent.includes('結果不明')", "unknown");
  const writesBefore = await evaluate("window.__u3.writes.length");
  await click("[data-testid=comparison-retained-lookup]");
  await until(
    "!document.querySelector('[data-testid=comparison-retained-retry]').disabled",
    "unknown lookup",
  );
  await click("[data-testid=comparison-retained-retry]");
  await until(
    "document.body.textContent.includes('保存成功')",
    "same request committed",
  );
  check(
    "M4 unknown retry preserves ID/body",
    await evaluate(
      "window.__u3.writes.at(-1).body===window.__u3.writes.at(-2).body",
    ),
  );
  await click("[data-testid=comparison-refresh]");
  await until(
    "document.body.textContent.includes('選択した保存版の比較')",
    "refresh after commit",
  );
  step = "export";
  const downloads = await evaluate("window.__u3.downloads.length");
  await click("[data-testid=comparison-export]");
  await until(
    `window.__u3.downloads.length===${downloads + 1}`,
    "comparison download",
  );
  check(
    "M6 output corresponds to saved fields and Web/provenance",
    await evaluate(
      "window.__u3.downloads.at(-1).includes('本人の理由')&&window.__u3.downloads.at(-1).includes('confidence')&&window.__u3.downloads.at(-1).includes('未記載')",
    ),
  );
  const selected = await evaluate("window.__u3.lastSelected"),
    first = selected[0],
    companyRead = await originalRequest(`/api/v1/companies/${first.companyId}`);
  await originalRequest(`/api/v1/companies/${first.companyId}`, "PATCH", {
    operationId: randomUUID(),
    expectedVersion: companyRead.value.version,
    changes: { interestLevel: "medium" },
  });
  await click("[data-testid=comparison-export]");
  await until(
    "document.body.textContent.includes('参照が変わりました')",
    "changed export",
  );
  check(
    "M6 version change creates zero files",
    await evaluate(`window.__u3.downloads.length===${downloads + 1}`),
  );
  await click("[data-testid=comparison-export]");
  await until(
    `window.__u3.downloads.length===${downloads + 2}`,
    "reconfirmed export",
  );
  const operationCount = await evaluate("window.__u3.operations");
  await evaluate("window.__u3.mode='readFail'");
  await click("[data-testid=comparison-refresh]");
  await until(
    "document.body.textContent.includes('比較参照の取得に失敗')",
    "read POST failure",
  );
  check(
    "M6 comparison POST failure has no operations lookup",
    (await evaluate("window.__u3.operations")) === operationCount,
  );
  await click("[data-testid=comparison-refresh]");
  await until(
    "document.body.textContent.includes('選択した保存版の比較')",
    "read recovery",
  );
  step = "conflict";
  await input(reasonSelector, "保持する競合入力");
  const memoRead = await originalRequest(
    `/api/v1/companies/${first.companyId}/memos/${first.memoId}`,
  );
  await originalRequest(
    `/api/v1/companies/${first.companyId}/memos/${first.memoId}`,
    "PATCH",
    {
      operationId: randomUUID(),
      expectedVersion: memoRead.value.version,
      changes: { comparisonReason: "別client最新理由" },
    },
  );
  await evaluate(
    "[...document.querySelectorAll('[data-testid=comparison-field-save]')].find(b=>b.textContent.includes('比較理由')).click()",
  );
  await until(
    "document.body.textContent.includes('競合・保持入力')",
    "conflict",
  );
  await click("[data-testid=comparison-field-latest]");
  await until(
    "document.body.textContent.includes('別client最新理由')",
    "latest separate",
  );
  check(
    "M5 base/draft/latest remain separate",
    await evaluate(
      "document.body.textContent.includes('保持する競合入力')&&document.body.textContent.includes('元の基準')&&document.body.textContent.includes('別client最新理由')",
    ),
  );
  await click("[data-testid=comparison-field-rebase]");
  await evaluate(
    "[...document.querySelectorAll('[data-testid=comparison-field-save]')].find(b=>b.textContent.includes('比較理由')).click()",
  );
  await until(
    "document.body.textContent.includes('保存成功')&&!document.body.textContent.includes('競合・保持入力')",
    "explicit rebase save",
  );
  await click("[data-testid=comparison-refresh]");
  await until(
    "document.body.textContent.includes('選択した保存版の比較')",
    "latest comparison",
  );
  step = "navigation cancellation";
  await input(reasonSelector, "未保存取消を確認");
  await click("[data-testid=comparison-legacy-entry]");
  await until(
    "!!document.querySelector('[data-testid=comparison-stay]')",
    "discard dialog",
  );
  await key("Tab", 9, 8);
  check("M10 ShiftTab wraps to final dialog action", await evaluate("document.activeElement===document.querySelector('[data-testid=comparison-discard]')"));
  await key("Tab", 9);
  check("M10 Tab wraps to initial dialog action", await evaluate("document.activeElement===document.querySelector('[data-testid=comparison-stay]')"));
  await key("Escape", 27);
  await until(
    "!document.querySelector('[data-testid=comparison-stay]')",
    "Escape cancel",
  );
  check(
    "M7/M10 cancel preserves input and trigger focus",
    await evaluate(
      "document.querySelector('textarea[data-testid=comparison-field-input]').value==='未保存取消を確認'&&document.activeElement===document.querySelector('[data-testid=comparison-legacy-entry]')",
    ),
  );
  await click("[data-testid=comparison-legacy-entry]");
  await click("[data-testid=comparison-discard]");
  await until(
    "document.body.textContent.includes('サーバーの保存企業やアカウントへ移行')",
    "legacy entry",
  );
  check(
    "M8 explicit legacy empty entry and no automatic migration",
    await evaluate(
      "document.body.textContent.includes('保存済みメモがありません')",
    ),
  );
  await click("[data-testid=comparison-server-entry]");
  await until(
    "!!document.querySelector('[data-testid=comparison-load-memos]')",
    "return comparison",
  );
  check(
    "M4 route projection does not create a new write",
    (await evaluate("window.__u3.writes.length")) === writesBefore + 3,
  );
  await remainingChecks(fixture, first);
  step = "responsive";
  for (const width of [1366, 390, 320, 767, 768]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width === 390 ? 844 : 768,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    check(
      `M9 viewport ${width}`,
      await evaluate(
        "document.documentElement.scrollWidth<=document.documentElement.clientWidth+1&&!!document.querySelector('[data-testid=comparison-export]')",
      ),
      { kind: "viewport emulation" },
    );
  }
  await send("Emulation.clearDeviceMetricsOverride");
  step = "native zoom";
  const settings = await send("Target.createTarget", {
      url: "edge://settings/appearance",
    }),
    attached = await send("Target.attachToTarget", {
      targetId: settings.targetId,
      flatten: true,
    });
  let zoomApi = false;
  for (let i = 0; i < 40 && !zoomApi; i++) {
    zoomApi =
      (
        await send(
          "Runtime.evaluate",
          {
            expression:
              "typeof chrome.settingsPrivate?.setDefaultZoom==='function'",
            returnByValue: true,
          },
          attached.sessionId,
        )
      ).result?.value === true;
    if (!zoomApi) await pause(100);
  }
  let baseWidth;
  if (zoomApi) {
    for (const zoom of [1, 2, 4]) {
      await send(
        "Runtime.evaluate",
        {
          expression: `chrome.settingsPrivate.setDefaultZoom(${zoom});true`,
          returnByValue: true,
        },
        attached.sessionId,
      );
      const tab = await send("Target.createTarget", {
          url: origin + "/compare",
        }),
        session = await send("Target.attachToTarget", {
          targetId: tab.targetId,
          flatten: true,
        });
      currentSession = session.sessionId;
      await until(
        "!!document.querySelector('[data-testid=comparison-load-memos]')",
        "native zoom comparison",
        150,
      );
      await evaluate(instrumentation);
      await selectCompany(fixture.companies[0].company_id);
      const metrics = await evaluate(
        "({width:innerWidth,dpr:devicePixelRatio,noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,controls:!!document.querySelector('[data-testid=comparison-field-save]')&&!!document.querySelector('[data-testid=comparison-export]')&&!!document.querySelector('[data-testid=comparison-legacy-entry]')})",
      );
      if (zoom > 1) {
        await input(
          "textarea[data-testid=comparison-field-input]",
          `native${zoom}の明示理由`,
        );
        await evaluate(
          "[...document.querySelectorAll('[data-testid=comparison-field-save]')].find(e=>e.textContent.includes('比較理由')).click()",
        );
        await until(
          "document.body.textContent.includes('保存成功')&&document.body.textContent.includes('選択した保存版の比較')",
          "native save and readback",
        );
        await click("[data-testid=comparison-export]");
        await until(
          "window.__u3.downloads.length===1",
          "native comparison output",
        );
        metrics.saved = await evaluate(
          `document.body.textContent.includes(${JSON.stringify(`native${zoom}の明示理由`)})`,
        );
        metrics.exported = await evaluate("window.__u3.downloads.length===1");
        await click("[data-testid=comparison-legacy-entry]");
        await until(
          "document.body.textContent.includes('サーバーの保存企業やアカウントへ移行')",
          "native legacy entry",
        );
        metrics.legacyOpened = true;
      }
      if (zoom === 1) baseWidth = metrics.width;
      else
        check(
          `M9 native browser zoom ${zoom * 100}%`,
          Math.abs(metrics.width * zoom - baseWidth) <= 4 &&
            Math.abs(metrics.dpr - zoom) < 0.1 &&
            metrics.noOverflow &&
            metrics.controls &&
            metrics.saved &&
            metrics.exported &&
            metrics.legacyOpened,
          {
            baseWidth,
            ...metrics,
            kind: "native dedicated-profile browser zoom; fresh non-emulated tab",
          },
        );
      await send("Target.closeTarget", { targetId: tab.targetId });
      currentSession = undefined;
    }
    await send(
      "Runtime.evaluate",
      {
        expression: "chrome.settingsPrivate.setDefaultZoom(1);true",
        returnByValue: true,
      },
      attached.sessionId,
    );
  } else
    check("M9 native zoom capability", false, {
      kind: "unverified; emulation is separate",
    });
  await send("Target.closeTarget", { targetId: settings.targetId });
  step = "final";
  check(
    "M12 existing navigation entries remain available",
    await evaluate(
      "!!document.querySelector('[data-testid=workspace-board-link]')&&!!document.querySelector('[data-testid=workspace-generation-link]')",
    ),
  );
  step = "existing standalone generation and review";
  await click("[data-testid=workspace-generation-link]");
  await until(
    "!!document.querySelector('#memo-image-input')",
    "existing standalone upload",
  );
  await evaluate(
    `(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>65536)throw Error();const transfer=new DataTransfer();transfer.items.add(new File([bytes],'u3-fictional.png',{type:'image/png'}));const e=document.querySelector('#memo-image-input');e.files=transfer.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  );
  await button("OCR を実行する");
  await until("!!document.querySelector('#ocr-result-text')", "existing OCR");
  await input("#ocr-result-text", "架空OCRの本人訂正");
  await button("Markdown を生成する");
  await until(
    "!!document.querySelector('#web-supplement-heading')",
    "existing Web step",
  );
  await button("スキップ（補足なしで続ける）");
  await until(
    "!!document.querySelector('#markdown-editor')",
    "existing Markdown editor",
  );
  await input(
    "#markdown-editor",
    "本人編集の単発本文\n<script>window.__unsafe=true</script>",
  );
  const priorDownloads = await evaluate("window.__u3.downloads.length");
  await button(".md をダウンロード");
  await until(
    `window.__u3.downloads.length===${priorDownloads + 1}`,
    "existing body download",
  );
  check(
    "M12 existing edited body outputs corresponding Markdown",
    await evaluate(
      "window.__u3.downloads.at(-1)===document.querySelector('#markdown-editor').value&&window.__unsafe!==true",
    ),
  );
  await button("面接前復習メモを生成");
  await until(
    "!!document.querySelector('#interview-review-heading')",
    "existing interview review",
  );
  await button("復習用 Markdown を出力");
  await until(
    `window.__u3.downloads.length===${priorDownloads + 2}`,
    "existing review download",
  );
  check(
    "M12 existing review outputs corresponding review Markdown",
    await evaluate("window.__u3.downloads.at(-1).includes('面接')"),
  );
  console.log(
    JSON.stringify({
      browser: browser.product,
      protocol: browser.protocolVersion,
      platform: process.platform,
      node: process.version,
      fixture:
        "fictional data only; generated origins are saved fixtures, no real provider",
      performance: performanceEvidence,
      results,
    }),
  );
  process.exitCode = results.every((r) => r.passed) ? 0 : 1;
  }
} catch (error) {
  if(process.argv.includes("--section=m12"))console.log(JSON.stringify({m12Diagnostic:await evaluate("({writes:window.__u3.writes.map(w=>({keys:Object.keys(JSON.parse(w.body).changes??{}),structureExpected:JSON.parse(w.body).changes?.structuredContent?.strengths?.[0]==='M12本人編集の構造'})),visible:!document.querySelector('#memo-panel-1')?.hidden,focused:document.activeElement===document.querySelector('[data-u3-helper-strength]'),validation:document.body.textContent.includes('文字数・日付・構造化項目'),conflict:document.body.textContent.includes('競合')})").catch(()=>({unavailable:true}))}));
  if (process.argv.includes("--m4-diagnostic")) {
    const transport = await send("Browser.getVersion").then(()=>true,()=>false);
    console.log(JSON.stringify({action:activeAction,transportResponding:transport,actionTrace}));
  }
  console.log(
    JSON.stringify({
      step,
      cdpEvidence,
      results,
      error: error instanceof Error ? error.message : "local helper failed",
    }),
  );
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  let edgeStopFailed = false,
    profileRemoved = !profile;
  const cleanupErrors = [];
  if (socket?.readyState === WebSocket.OPEN)
    await send("Browser.close").catch(() => {});
  socket?.close();
  for (const task of pending.values()) clearTimeout(task.timer);
  await stopTree(edge).catch((error) => {
    edgeStopFailed = true;
    cleanupErrors.push({
      stage: "owned-edge-stop",
      code: String(error?.code ?? "unknown"),
    });
    process.exitCode = 1;
  });
  if (preview?.exitCode === null) {
    preview.stdin.write("stop\n");
    await Promise.race([once(preview, "exit"), pause(15000)]);
  }
  await admin?.end().catch(() => {});
  const cleanup = {
    previewStopped: !!preview && preview.exitCode === 0,
    schemaDropped: previewLog.includes('"dedicatedSchemaDropped":true'),
    edgeStopped: !edge || edge.exitCode !== null,
    previewExitCode: preview?.exitCode ?? null,
    previewSignal: preview?.signalCode ?? null,
    previewStopReported: previewLog.includes(
      '"dedicatedPreviewStopConfirmed":true',
    ),
  };
  if (profile && cleanup.edgeStopped)
    await rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 150,
    })
      .then(() => {
        profileRemoved = true;
      })
      .catch((error) => {
        cleanupErrors.push({
          stage: "owned-profile-remove",
          code: String(error?.code ?? "unknown"),
        });
        process.exitCode = 1;
      });
  cleanup.edgeStopFailed = edgeStopFailed;
  cleanup.profileRemoved = profileRemoved;
  cleanup.errors = cleanupErrors;
  console.log(
    JSON.stringify({
      dedicatedCleanup: cleanup,
      dedicatedPids: {
        helper: previewMetadata?.helperPid,
        next: previewMetadata?.nextPid,
        edge: edge?.pid,
      },
    }),
  );
  if (!cleanup.previewStopped || !cleanup.schemaDropped || !cleanup.edgeStopped)
    process.exitCode = 1;
}
