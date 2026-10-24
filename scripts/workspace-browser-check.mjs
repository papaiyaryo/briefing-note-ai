// 既存EdgeのCDPを使うローカル確認。新しいbrowser test productは追加しない。
import { writeFile } from "node:fs/promises";
const pages = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("local Edge page missing");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let serial = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const response = JSON.parse(String(event.data));
  const task = pending.get(response.id);
  if (task) {
    pending.delete(response.id);
    clearTimeout(task.timeout);
    if (response.error) task.reject(new Error(response.error.message));
    else task.resolve(response.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 30000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
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
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(expression, label) {
  for (let attempt = 0; attempt < 180; attempt++) {
    if (await evaluate(expression)) return;
    await wait(250);
  }
  throw new Error(`browser check timed out: ${label}`);
}
async function click(selector) {
  if (
    !(await evaluate(
      `(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return false;element.focus();element.click();return true;})()`,
    ))
  )
    throw new Error("control missing");
}
async function text(selector, value) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  await send("Input.insertText", { text: value });
}
const results = [];
const keyboardOnly = process.argv.includes("--keyboard-only");
let health;
for (let attempt = 0; attempt < 80; attempt++) {
  try {
    health = await fetch("http://127.0.0.1:3000/api/health", {
      signal: AbortSignal.timeout(3000),
    });
    break;
  } catch {
    await wait(500);
  }
}
if (!health) throw new Error("local preview did not become ready");
results.push({
  check: "Next serves health with private no-store and security headers",
  passed:
    health.ok &&
    health.headers.get("x-content-type-options") === "nosniff" &&
    health.headers.get("x-frame-options") === "DENY" &&
    health.headers.get("cache-control")?.includes("no-store"),
});
let apiRequests = 0;
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (
    message.method === "Network.requestWillBeSent" &&
    message.params.request.url.includes("/api/")
  )
    apiRequests++;
});
try {
  await send("Page.enable");
  await send("Page.bringToFront");
  await send("Runtime.enable");
  await send("Network.clearBrowserCookies");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:3000" });
  await until("!!document.querySelector('[data-testid=login-email]')", "login");
  await text("[data-testid=login-email]", "owner@example.test");
  await text("[data-testid=login-password]", "local-preview-only");
  await click("[data-testid=login-submit]");
  await until(
    "!!document.querySelector('[data-testid=create-company]')",
    "authenticated board",
  );
  results.push({ check: "dummy login and protected board", passed: true });
  await click("[data-testid=create-company]");
  await until(
    "!!document.querySelector('dialog[open] input')",
    "registration dialog",
  );
  results.push({
    check: "registration initial focus is name",
    passed: await evaluate(
      "document.activeElement===document.querySelector('dialog input')",
    ),
  });
  await evaluate(
    "window.__u1Keys=[];document.addEventListener('keydown',e=>window.__u1Keys.push({key:e.key,trusted:e.isTrusted}),true);document.addEventListener('cancel',()=>window.__u1Keys.push({cancel:true}),true)",
  );
  const tabCycle = [];
  for (let n = 0; n < 3; n++) {
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    tabCycle.push(
      await evaluate(
        "document.activeElement?.getAttribute('data-testid')??document.activeElement?.tagName",
      ),
    );
  }
  results.push({
    check: "native modal Tab cycles cancel confirm name",
    passed:
      JSON.stringify(tabCycle) ===
      JSON.stringify(["dialog-cancel", "dialog-confirm", "INPUT"]),
    tabCycle,
  });
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers: 8,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers: 8,
  });
  results.push({
    check: "native modal Shift+Tab wraps to confirm",
    passed: await evaluate(
      "document.activeElement===document.querySelector('dialog[open] [data-testid=dialog-confirm]')",
    ),
  });
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
  await wait(250);
  const escapeClosed = await evaluate(
    "!document.querySelector('dialog[open]')",
  );
  results.push({
    check: "Escape closes registration and restores trigger focus",
    passed:
      escapeClosed &&
      (await evaluate(
        "document.activeElement===document.querySelector('[data-testid=create-company]')",
      )),
    keys: await evaluate("window.__u1Keys"),
  });
  // 独立した後続ACも確認する。Escapeの失敗はresultsに残し最終exit1にする。
  if (!escapeClosed) await click("dialog[open] [data-testid=dialog-cancel]");
  if (!keyboardOnly) {
    await click("[data-testid=create-company]");
    await until(
      "!!document.querySelector('dialog[open] input')",
      "registration reopened",
    );
    await text("dialog input", "架空ブラウザ確認企業");
    await click("dialog [data-testid=dialog-confirm]");
    await until(
      "location.pathname.startsWith('/companies/') && !!document.querySelector('[data-testid=company-name]')",
      "created company detail",
    );
    results.push({
      check: "name-only registration opens persisted company detail",
      passed: true,
    });
    results.push({
      check: "detail navigation focuses its heading",
      passed: await evaluate("document.activeElement?.tagName==='H1'"),
    });
    await wait(1000);
    const beforeIdle = apiRequests;
    await wait(3000);
    results.push({
      check: "idle detail has no repeated API requests in three seconds",
      passed: apiRequests === beforeIdle,
      additionalApiRequests: apiRequests - beforeIdle,
    });
    await evaluate(
      "[...document.querySelectorAll('button')].find(button=>button.textContent==='手入力メモを作成').click()",
    );
    await until(
      "!!document.querySelector('[data-testid=memo-markdown]')",
      "manual memo",
    );
    await text(
      "[data-testid=memo-markdown]",
      "架空の本人メモ\n<script>window.__unsafe=true</script>",
    );
    await evaluate(
      "[...document.querySelectorAll('button')].find(button=>button.textContent==='本文を保存').click()",
    );
    await until(
      "document.body.textContent.includes('保存メモを編集')",
      "memo persisted",
    );
    results.push({
      check: "manual memo persists and returns editable saved memo",
      passed: true,
    });
    results.push({
      check: "HTML is not executed",
      passed: await evaluate(
        "window.__unsafe!==true && !document.querySelector('#workspace-main script')",
      ),
    });
    await text("[data-testid=memo-markdown]", "\n未保存追記");
    await evaluate(
      "[...document.querySelectorAll('a')].find(link=>link.textContent==='企業ボード').click()",
    );
    await until(
      "[...document.querySelectorAll('dialog')].some(dialog=>dialog.textContent.includes('未保存の入力を破棄'))",
      "dirty navigation confirmation",
    );
    results.push({
      check: "destructive confirmation starts at cancel",
      passed: await evaluate(
        "document.activeElement===document.querySelector('dialog[open] [data-testid=dialog-cancel]')",
      ),
    });
    await click("dialog[open] [data-testid=dialog-cancel]");
    results.push({
      check: "cancelled dirty navigation preserves input",
      passed: await evaluate(
        "document.querySelector('[data-testid=memo-markdown]')?.value.includes('未保存追記')",
      ),
    });
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    results.push({
      check: "mobile viewport keeps editor inside page width",
      passed: await evaluate(
        "document.documentElement.scrollWidth<=document.documentElement.clientWidth+1",
      ),
    });
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      ".npm/u1-mobile-check.png",
      Buffer.from(screenshot.data, "base64"),
    );
  }
  console.log(
    JSON.stringify({
      browser: "existing Edge via CDP",
      viewportWidths: [1440, 390],
      results,
      screenshot: keyboardOnly ? undefined : ".npm/u1-mobile-check.png",
    }),
  );
  process.exitCode = results.every((result) => result.passed) ? 0 : 1;
} catch (error) {
  console.log(
    JSON.stringify({
      results,
      error: error instanceof Error ? error.message : "browser check failed",
      keys: await evaluate("window.__u1Keys").catch(() => null),
    }),
  );
  throw error;
} finally {
  await send("Browser.close").catch(() => {});
  for (const task of pending.values()) clearTimeout(task.timeout);
  socket.close();
}
