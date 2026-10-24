// Dedicated local resources only. Existing Edge/CDP; no browser runner dependency.
import { spawn, execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
const results = [];
function check(name, passed, details = {}) {
  results.push({ check: name, passed: !!passed, ...details });
}
if (process.argv.includes("--self-test-failure")) {
  check("intentional helper failure", false);
  console.log(JSON.stringify({ results }));
  process.exit(1);
}
const origin = "http://127.0.0.1:3000";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let preview,
  edge,
  socket,
  profile,
  previewLog = "",
  serial = 0;
const pending = new Map();
async function stopTree(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolve, reject) =>
      execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], (error) =>
        error && child.exitCode === null ? reject(error) : resolve(),
      ),
    );
  } else child.kill("SIGTERM");
}
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
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
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error("browser evaluation failed");
  return response.result?.value;
}
async function until(expression, label) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await pause(250);
  }
  throw new Error(`browser control not reached: ${label}`);
}
async function click(selector) {
  if (
    !(await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return false;e.focus();e.click();return true})()`,
    ))
  )
    throw new Error("enabled control missing");
}
async function button(label, partial = false) {
  const find = `[...document.querySelectorAll('button')].find(e=>e.textContent.trim()${partial ? ".includes(" : "==="}${JSON.stringify(label)}${partial ? ")" : ""})`;
  if (
    !(await evaluate(
      `(()=>{const e=${find};if(!e||e.disabled)return false;e.focus();e.click();return true})()`,
    ))
  )
    throw new Error(`enabled button missing: ${label}`);
}
async function input(selector, value) {
  await evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error();e.focus();e.select()})()`,
  );
  await send("Input.insertText", { text: value });
}
async function key(name, code, modifiers = 0) {
  for (const type of ["rawKeyDown", "keyUp"])
    await send("Input.dispatchKeyEvent", {
      type,
      key: name,
      code: name,
      windowsVirtualKeyCode: code,
      nativeVirtualKeyCode: code,
      modifiers,
    });
}
async function attachImage() {
  await evaluate(
    `(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>65536)throw Error();const transfer=new DataTransfer();transfer.items.add(new File([bytes],'u2-fictional.png',{type:'image/png'}));const e=document.querySelector('#memo-image-input');e.files=transfer.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  );
}
async function prepareCandidate(checkImages = false) {
  await until("!!document.querySelector('#memo-image-input')", "upload");
  await attachImage();
  if (checkImages) {
    await click("button[aria-label='ページ 1 を削除']");
    check(
      "image removal releases the selected File preview",
      await evaluate("window.__u2.images.size===0"),
    );
    await attachImage();
    await attachImage();
    await click("button[aria-label='ページ 1 を削除']");
    check(
      "image replacement leaves only its current object reference",
      await evaluate("window.__u2.images.size===1"),
    );
  }
  await button("OCR を実行する");
  await until("!!document.querySelector('#ocr-result-text')", "OCR");
  await input("#ocr-result-text", "再確認した架空OCR");
  await button("Markdown を生成する");
  await until("!!document.querySelector('#web-supplement-heading')", "Web");
  await button("スキップ（補足なしで続ける）");
  await until(
    "!!document.querySelector('[data-testid=generation-markdown],#markdown-editor')",
    "generated editor",
  );
}
const watchdog = setTimeout(() => {
  socket?.close();
  void stopTree(edge);
  preview?.stdin?.write("stop\n");
}, 240000);
try {
  // Refuse to adopt an already running server or CDP process.
  for (const url of [
    origin + "/api/health",
    "http://127.0.0.1:9224/json/version",
  ]) {
    const occupied = await fetch(url, {
      signal: AbortSignal.timeout(1000),
    }).then(
      () => true,
      () => false,
    );
    if (occupied) throw new Error("dedicated local port already occupied");
  }
  preview = spawn(process.execPath, ["scripts/local-workspace-preview.mjs"], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    env: { ...process.env, WEB_SUPPLEMENT_ENABLED: "true" },
  });
  preview.stdout.on("data", (data) => {
    previewLog = (previewLog + String(data)).slice(-50000);
  });
  preview.stderr.on("data", (data) => {
    previewLog = (previewLog + String(data)).slice(-50000);
  });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    ready = await fetch(origin + "/api/health", {
      signal: AbortSignal.timeout(3000),
    }).then(
      (r) => r.ok,
      () => false,
    );
    if (ready) break;
    if (preview.exitCode !== null)
      throw new Error("dedicated preview exited before readiness");
    await pause(250);
  }
  if (!ready) throw new Error("dedicated preview not ready");
  profile = await mkdtemp(join(tmpdir(), "u2-edge-"));
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
        (ps) => ps.find((p) => p.type === "page"),
        () => null,
      );
    if (!page) await pause(250);
  }
  if (!page) throw new Error("dedicated Edge page unavailable");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await once(socket, "open");
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)),
      task = pending.get(message.id);
    if (task) {
      pending.delete(message.id);
      clearTimeout(task.timer);
      if (message.error) task.reject(new Error(message.error.message));
      else task.resolve(message.result);
    }
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront");
  const browser = await send("Browser.getVersion");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: origin });
  await until("!!document.querySelector('[data-testid=login-email]')", "login");
  await input("[data-testid=login-email]", "owner@example.test");
  await input("[data-testid=login-password]", "local-preview-only");
  await click("[data-testid=login-submit]");
  await until(
    "!!document.querySelector('[data-testid=create-company]')",
    "board",
  );
  await click("[data-testid=create-company]");
  await until(
    "!!document.querySelector('dialog[open] input')",
    "company dialog",
  );
  await input("dialog input", "U2架空固定企業");
  await click("[data-testid=dialog-confirm]");
  await until(
    "!!document.querySelector('[data-testid=company-name]')",
    "company detail",
  );
  const companyPath = await evaluate("location.pathname");
  const instrumentation = `(()=>{
    const original=window.fetch.bind(window), create=URL.createObjectURL.bind(URL), revoke=URL.revokeObjectURL.bind(URL);
    window.__u2={mode:'',requests:0,writes:[],images:new Set(),downloads:[],readFail:false};
    URL.createObjectURL=b=>{const u=create(b);if(b instanceof File)window.__u2.images.add(u);return u};
    URL.revokeObjectURL=u=>{window.__u2.images.delete(u);revoke(u)};
    HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){original(this.href).then(r=>r.text()).then(t=>window.__u2.downloads.push(t));return}this.dispatchEvent(new MouseEvent('click',{bubbles:true}))};
    window.fetch=async(input,init={})=>{
      const p=String(input),s=window.__u2;if(p.includes('/api/'))s.requests++;
      if(p.includes('/memos')&&init.method==='POST'){
        s.writes.push(init.body);
        if(s.mode==='unknownNotCommitted'){s.mode='';throw new TypeError('dummy interruption before dispatch')}
        if(s.mode==='rejectSave'){s.mode='';return Response.json({error:{code:'invalid_input'}},{status:400})}
        if(s.mode==='tamperSave'){s.mode='';const b=JSON.parse(init.body);b.candidate.generationReceipt+='x';return original(input,{...init,body:JSON.stringify(b)})}
        const r=await original(input,init);
        if(s.mode==='lostCommit'){s.mode='';throw new TypeError('dummy committed response lost')}
        return r;
      }
      if(s.readFail&&p.includes('/memos/')&&p.split('?')[0].split('/').length===7&&(!init.method||init.method==='GET'))return Response.json({error:{code:'unavailable'}},{status:503});
      const r=await original(input,init);
      if(p==='/api/structure'&&r.ok&&['badProof','invalidStructure'].includes(s.mode)){
        const b=await r.json();if(s.mode==='badProof')b.generationReceipt+='x';else b.memo.facts='invalid';s.mode='';return Response.json(b);
      }
      return r;
    };
  })()`;
  await send("Page.addScriptToEvaluateOnNewDocument", { source: instrumentation });
  await evaluate(instrumentation);
  await button("画像・OCRからこの企業のメモを作成");
  await until(
    "!!document.querySelector('#memo-image-input')",
    "target generation",
  );
  check(
    "target entry moves keyboard focus to its heading",
    await evaluate("document.activeElement?.tagName==='H2'"),
  );
  await evaluate(
    `(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>65536)throw Error();const transfer=new DataTransfer();transfer.items.add(new File([bytes],'u2-fictional.png',{type:'image/png'}));const e=document.querySelector('#memo-image-input');e.files=transfer.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  );
  await input("#company-name-input", "生成名は別企業");
  await input("#event-name-input", "架空説明会");
  await button("OCR を実行する");
  await until("!!document.querySelector('#ocr-result-text')", "OCR review");
  await input("#ocr-result-text", "本人が訂正した架空OCR");
  await button("Markdown を生成する");
  await until(
    "!!document.querySelector('#web-supplement-heading')",
    "Web selection",
  );
  // Dummy-only Web results still require explicit adoption.
  await evaluate(
    "[...document.querySelectorAll('button')].filter(e=>e.textContent.trim()==='採用する').forEach(e=>e.click())",
  );
  await button("件で Markdown 生成へ", true);
  await until(
    "!!document.querySelector('[data-testid=generation-markdown]')",
    "candidate",
  );
  check(
    "fixed company mismatch and dummy origin are visible",
    await evaluate(
      "document.body.textContent.includes('保存先と生成結果の企業名が異なります')&&document.body.textContent.includes('検証用dummyの生成候補')",
    ),
  );
  await input("[data-testid=generation-overview-eventDate]", "2026-10-17");
  const facts = await evaluate(
    "document.querySelector('[data-testid=generation-facts-0]')?.value",
  );
  await input(
    "[data-testid=generation-markdown]",
    " 本人の自由本文\n<script>window.__unsafe=true</script>\n",
  );
  check(
    "typing does not steal focus back to the entry heading",
    await evaluate(
      "document.activeElement===document.querySelector('[data-testid=generation-markdown]')",
    ),
  );
  check(
    "body edit keeps structured canonical facts and safe HTML",
    await evaluate(
      `document.querySelector('[data-testid=generation-facts-0]')?.value===${JSON.stringify(facts)}&&window.__unsafe!==true`,
    ),
  );
  await button("候補の.mdを出力");
  await until("window.__u2.downloads.length===1", "candidate download");
  check(
    "candidate download matches displayed body",
    await evaluate(
      "window.__u2.downloads[0]===document.querySelector('[data-testid=generation-markdown]').value",
    ),
  );
  await button("この生成を終了");
  await until("!!document.querySelector('dialog[open]')", "dirty confirmation");
  check(
    "dirty confirmation focuses cancel",
    await evaluate(
      "document.activeElement===document.querySelector('[data-testid=dialog-cancel]')",
    ),
  );
  await key("Escape", 27);
  await until("!document.querySelector('dialog[open]')", "Escape cancellation");
  check(
    "cancel preserves candidate input",
    await evaluate(
      "document.querySelector('[data-testid=generation-markdown]').value.includes('本人の自由本文')",
    ),
  );
  for (const width of [320, 390, 767, 768, 1366]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width === 390 ? 844 : 768,
      deviceScaleFactor: 1,
      mobile: width === 390,
    });
    check(
      `candidate width ${width} avoids horizontal overflow`,
      await evaluate(
        "document.documentElement.scrollWidth<=document.documentElement.clientWidth+1",
      ),
    );
  }
  for (const scale of [2, 4]) {
    await send("Emulation.setPageScaleFactor", { pageScaleFactor: scale });
    check(
      `visual viewport magnification ${scale * 100}% keeps labelled editor available`,
      await evaluate(
        "!!document.querySelector('label textarea[data-testid=generation-markdown]')",
      ),
    );
  }
  await send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  for (const scale of [2, 4]) {
    const width = Math.floor(1366 / scale);
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: Math.floor(768 / scale),
      deviceScaleFactor: scale,
      mobile: false,
    });
    const metrics = await evaluate(
      "({width:innerWidth,dpr:devicePixelRatio,noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,editor:!!document.querySelector('label textarea[data-testid=generation-markdown]')})",
    );
    check(
      `zoom-equivalent CSS viewport reflow ${scale * 100}%`,
      metrics.width === width &&
        metrics.dpr === scale &&
        metrics.noOverflow &&
        metrics.editor,
      metrics,
    );
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(
    "document.querySelector('[data-testid=generation-markdown]').focus()",
  );
  await key("Tab", 9);
  check(
    "Tab reaches labelled corrected OCR from candidate body",
    await evaluate(
      "document.activeElement===document.querySelector('[data-testid=generation-corrected-ocr]')",
    ),
  );
  await key("Tab", 9, 8);
  check(
    "Shift+Tab returns to candidate body",
    await evaluate(
      "document.activeElement===document.querySelector('[data-testid=generation-markdown]')",
    ),
  );
  // Use the dedicated profile's real browser zoom setting, then verify CSS pixels.
  const settings = await send("Target.createTarget", {
    url: "edge://settings/appearance",
  });
  const attached = await send("Target.attachToTarget", {
    targetId: settings.targetId,
    flatten: true,
  });
  let zoomApi = false;
  for (let i = 0; i < 40 && !zoomApi; i++) {
    const probe = await send(
      "Runtime.evaluate",
      {
        expression:
          "typeof chrome!=='undefined'&&typeof chrome.settingsPrivate?.setDefaultZoom==='function'",
        returnByValue: true,
      },
      attached.sessionId,
    );
    zoomApi = probe.result?.value === true;
    if (!zoomApi) await pause(100);
  }
  if (zoomApi) {
    let baseWidth;
    for (const zoom of [1, 2, 4]) {
      const result = await send(
        "Runtime.evaluate",
        {
          expression: `chrome.settingsPrivate.setDefaultZoom(${zoom});true`,
          returnByValue: true,
        },
        attached.sessionId,
      );
      if (result.exceptionDetails)
        throw new Error("native zoom setting rejected");
      await pause(100);
      // A fresh non-emulated tab avoids the mobile emulation zoom override.
      const tab = await send("Target.createTarget", { url: origin + companyPath });
      const session = await send("Target.attachToTarget", { targetId: tab.targetId, flatten: true });
      let metrics;
      for (let i = 0; i < 250; i++) {
        const observed = await send("Runtime.evaluate", {
          expression: `(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='画像・OCRからこの企業のメモを作成');if(b)b.click();return {width:innerWidth,dpr:devicePixelRatio,noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,editor:!!document.querySelector('#company-name-input')}})()`,
          returnByValue: true,
        }, session.sessionId);
        metrics = observed.result?.value;
        if (metrics?.editor) break;
        await pause(100);
      }
      if (zoom === 1) baseWidth = metrics?.width;
      else check(`native browser zoom ${zoom * 100}% reflows labelled generation entry`,
        !!metrics && Math.abs(metrics.width * zoom - baseWidth) <= 4 && Math.abs(metrics.dpr - zoom) < 0.1 && metrics.noOverflow && metrics.editor,
        { baseWidth, ...metrics });
      await send("Target.closeTarget", { targetId: tab.targetId });
    }
    await send(
      "Runtime.evaluate",
      { expression: "chrome.settingsPrivate.setDefaultZoom(1);true" },
      attached.sessionId,
    );
  } else {
    check("native browser zoom 200/400% available for verification", false, {
      kind: "browser capability unverified; viewport emulation is separate",
    });
  }
  await send("Target.closeTarget", { targetId: settings.targetId });
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate("window.__u2.mode='unknownNotCommitted'");
  await button("この企業へ保存");
  await until(
    "document.body.textContent.includes('保存結果が不明')",
    "unknown save",
  );
  await button("操作結果を確認");
  await until(
    "[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='同じ要求を再試行'&&!e.disabled)",
    "lookup before retry",
  );
  await evaluate("window.__u2.readFail=true");
  await button("同じ要求を再試行");
  await until(
    "document.body.textContent.includes('保存済みメモの再取得に失敗')",
    "committed read failure",
  );
  check(
    "unknown retry uses exactly the frozen request and preserves committed status",
    await evaluate(
      "window.__u2.writes.length===2&&window.__u2.writes[0]===window.__u2.writes[1]&&document.body.textContent.includes('保存は確定しました')",
    ),
  );
  check(
    "committed generation releases image object references",
    await evaluate(
      "window.__u2.images.size===0&&!document.querySelector('img[src^=blob]')",
    ),
  );
  await evaluate("window.__u2.readFail=false");
  await button("保存メモを再取得");
  await until(
    "[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='保存メモを開く')",
    "read saved memo",
  );
  const persistence = await evaluate(
    `(async()=>{const body=JSON.parse(window.__u2.writes[0]),base='/api/v1'+location.pathname;const m=await(await fetch(base+'/memos/'+body.memoId)).json();const c=await(await fetch(base)).json();const list=await(await fetch(base+'/memos')).json();return {same:m.memoId===body.memoId&&m.companyId===location.pathname.split('/').pop(),fields:['markdown','structuredContent','correctedOcr','event','adoptedWebSources','providerOrigin'].every(k=>JSON.stringify(m[k])===JSON.stringify(body.candidate[k])),one:list.items.length===1,fixed:c.name==='U2架空固定企業',noImage:!JSON.stringify(m).includes('u2-fictional.png')&&!JSON.stringify(m).includes('blob:')}})()`,
  );
  check(
    "saved memo round trips all fields under the fixed company without images",
    Object.values(persistence).every(Boolean),
    persistence,
  );
  const idleStart = await evaluate("window.__u2.requests");
  await pause(2000);
  const idleRequests = (await evaluate("window.__u2.requests")) - idleStart;
  check(
    "idle candidate has no request loop in two seconds",
    idleRequests === 0,
    { additionalApiRequests: idleRequests },
  );
  await button("保存メモを開く");
  await until(
    "!!document.querySelector('[data-testid=memo-markdown]')",
    "existing saved memo editor",
  );
  check(
    "saved generated memo opens existing editor",
    (await evaluate("location.pathname")) === companyPath,
  );
  await button("編集を閉じる");
  await button("画像・OCRからこの企業のメモを作成");
  await prepareCandidate();
  await input("[data-testid=generation-overview-eventDate]", "2026-10-17");
  await evaluate("window.__u2.mode='tamperSave'");
  await button("この企業へ保存");
  await until(
    "document.body.textContent.includes('保存を完了できません')",
    "actual tampered proof rejection",
  );
  check(
    "tampered proof is rejected by actual HTTP while candidate input stays editable",
    await evaluate(
      "!!document.querySelector('[data-testid=generation-markdown]')&&!document.querySelector('[data-testid=generation-markdown]').disabled",
    ),
  );
  await button("画像・OCR確認へ戻る");
  await button("Markdown を生成する");
  await until(
    "!!document.querySelector('#web-supplement-heading')",
    "regeneration Web",
  );
  await evaluate("window.__u2.mode='invalidStructure'");
  await button("スキップ（補足なしで続ける）");
  await until(
    "!!document.querySelector('dialog[open]')",
    "regeneration discard confirmation",
  );
  await click("[data-testid=dialog-confirm]");
  await until(
    "document.body.textContent.includes('生成または出自確認に失敗')",
    "invalid structure rejection",
  );
  check(
    "invalid new structure keeps corrected OCR and last valid candidate",
    await evaluate(
      "document.querySelector('[data-testid=generation-corrected-ocr]')?.value==='再確認した架空OCR'&&!!document.querySelector('[data-testid=generation-markdown]')",
    ),
  );
  await evaluate("window.__u2.mode='lostCommit'");
  await button("この企業へ保存");
  await until(
    "document.body.textContent.includes('保存結果が不明')",
    "lost committed response",
  );
  await button("操作結果を確認");
  await until(
    "document.body.textContent.includes('保存は確定しました')",
    "committed operation lookup",
  );
  check(
    "lost committed response resolves without another POST",
    await evaluate("window.__u2.writes.length===4"),
  );
  await until("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='保存メモを開く')", "committed memo read completes");
  await button("保存メモを開く");
  await until(
    "!!document.querySelector('[data-testid=memo-markdown]')",
    "second saved memo",
  );
  await evaluate(
    "[...document.querySelectorAll('a')].find(e=>e.textContent==='既存の画像・メモ生成').click()",
  );
  await until(
    "!!document.querySelector('#memo-image-input')",
    "standalone entry",
  );
  check(
    "standalone entry explains company saving",
    await evaluate(
      "document.body.textContent.includes('企業へ保存する場合は企業詳細から')",
    ),
  );
  const standalonePosts = await evaluate("window.__u2.writes.length");
  await prepareCandidate(true);
  await input("#markdown-editor", "単発の本人編集本文");
  const downloadsBefore = await evaluate("window.__u2.downloads.length");
  await button(".md をダウンロード");
  await until(
    `window.__u2.downloads.length===${downloadsBefore + 1}`,
    "standalone download",
  );
  check(
    "standalone download matches its edited body",
    await evaluate("window.__u2.downloads.at(-1)==='単発の本人編集本文'"),
  );
  await button("面接前復習メモを生成");
  await until(
    "!!document.querySelector('#interview-review-heading')",
    "standalone review",
  );
  await button("復習用 Markdown を出力");
  await until(
    `window.__u2.downloads.length===${downloadsBefore + 2}`,
    "review download",
  );
  check(
    "review exports corresponding review content without a new DB write",
    await evaluate(
      `window.__u2.downloads.at(-1).includes('面接')&&window.__u2.writes.length===${standalonePosts}`,
    ),
  );
  await evaluate(
    "[...document.querySelectorAll('a')].find(e=>e.textContent==='企業ボード').click()",
  );
  await until(
    "!!document.querySelector('[data-testid=create-company]')",
    "standalone exit",
  );
  check(
    "leaving standalone flow releases image references",
    await evaluate("window.__u2.images.size===0"),
  );
  console.log(
    JSON.stringify({
      browser: browser.product,
      protocol: browser.protocolVersion,
      platform: process.platform,
      fixture: "dummy 2x2 PNG under64KiB",
      magnification:
        "Visual scale and CSS viewport emulation reported separately; native zoom uses dedicated-profile settings and fresh non-emulated tabs with measured CSS pixels/DPR",
      results,
    }),
  );
  process.exitCode = results.every((r) => r.passed) ? 0 : 1;
} catch (error) {
  console.log(
    JSON.stringify({
      results,
      error:
        error instanceof Error ? error.message : "local browser check failed",
    }),
  );
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  if (socket?.readyState === WebSocket.OPEN)
    await send("Browser.close").catch(() => {});
  socket?.close();
  for (const task of pending.values()) clearTimeout(task.timer);
  await stopTree(edge).catch(() => {
    process.exitCode = 1;
  });
  if (preview?.exitCode === null) {
    preview.stdin.write("stop\n");
    await Promise.race([once(preview, "exit"), pause(15000)]);
  }
  const cleanup = {
    previewStopped: !!preview && preview.exitCode === 0,
    schemaDropped: previewLog.includes('"dedicatedSchemaDropped":true'),
    edgeStopped: !edge || edge.exitCode !== null,
  };
  if (profile && cleanup.edgeStopped)
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  console.log(JSON.stringify({ dedicatedCleanup: cleanup }));
  if (!cleanup.previewStopped || !cleanup.schemaDropped || !cleanup.edgeStopped)
    process.exitCode = 1;
}
