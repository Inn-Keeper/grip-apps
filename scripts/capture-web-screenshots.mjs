import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as fixtures from "./screenshot-fixtures.mjs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5174/";
const outDir = new URL("../docs/screenshots/web/", import.meta.url);
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9229;

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForDebugTarget() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${port}/json`);
      const tab = tabs.find((item) => item.type === "page");
      if (tab?.webSocketDebuggerUrl) return tab.webSocketDebuggerUrl;
    } catch {
      // Chrome is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

function createCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const eventHandlers = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method && eventHandlers.has(message.method)) {
      eventHandlers.get(message.method)(message.params);
    }
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((callResolve, callReject) => pending.set(callId, { resolve: callResolve, reject: callReject }));
        },
        onEvent(eventName, handler) {
          eventHandlers.set(eventName, handler);
        },
        close: () => ws.close(),
      });
    });
    ws.addEventListener("error", reject);
  });
}

async function waitForLoad(cdp) {
  await cdp.send("Runtime.evaluate", {
    expression: "document.readyState === 'complete'",
    awaitPromise: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 900));
}

async function capture(cdp, name, { scrollTop = true } = {}) {
  if (scrollTop) {
    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL(`${name}.png`, outDir), Buffer.from(result.data, "base64"));
}

async function clickTab(cdp, label) {
  const expression = `
    (() => {
      const button = [...document.querySelectorAll('button')]
        .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
      if (!button) return false;
      button.click();
      return true;
    })()
  `;
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
  if (!result.result.value) throw new Error(`Could not find tab "${label}".`);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

// Clicks the first button whose label contains the text (buttons carry their
// own labels here, so this is enough to drive the board without coordinates).
async function clickText(cdp, text) {
  const expression = `
    (() => {
      const match = [...document.querySelectorAll('button, [role="button"]')]
        .find((item) => item.textContent.includes(${JSON.stringify(text)}));
      if (!match) return false;
      match.click();
      return true;
    })()
  `;
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
  if (!result.result.value) throw new Error(`Could not find a button containing "${text}".`);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

const env = parseEnv(await readFile(new URL("../apps/web/.env", import.meta.url), "utf8"));
const projectRef = new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0];
const authKey = `sb-${projectRef}-auth-token`;
const now = new Date().toISOString();
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const fakeUser = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "demo@grip.local",
  email_confirmed_at: now,
  confirmed_at: now,
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Demo User" },
  identities: [],
  created_at: now,
  updated_at: now,
  is_anonymous: false,
};
const fakeSession = {
  access_token: "screenshot-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: expiresAt,
  refresh_token: "screenshot-refresh",
  user: fakeUser,
};

// Supabase v2 validates the token on getSession() via a /user network call.
// We intercept that request via CDP Fetch and return a mocked user response
// so the app sees a valid session without any real credentials in this script.
const supabaseHost = new URL(env.VITE_SUPABASE_URL).hostname;
const pipelineOrigin = env.VITE_PIPELINE_URL ? new URL(env.VITE_PIPELINE_URL).origin : "";

// PostgREST routing: the table is the first path segment after /rest/v1/.
// A request asking for a single object (maybeSingle) gets the row itself, and a
// paginated range past the end of a table gets [] so the caller's loop stops.
function restPayload(url, headers) {
  const { pathname, searchParams } = new URL(url);
  const table = pathname.split("/rest/v1/")[1]?.split("?")[0] ?? "";
  const wantsObject = (headers.Accept ?? headers.accept ?? "").includes("pgrst.object");
  // supabase-js paginates with offset/limit; anything past the first page must
  // come back empty or the caller keeps asking for more.
  const offset = Number(searchParams.get("offset") ?? (headers.Range ?? headers.range ?? "0-").split("-")[0]);

  const rows = {
    profiles: [fixtures.profile],
    contacts: fixtures.contacts,
    stories: fixtures.stories,
    answer_events: fixtures.answerEvents,
    status_events: fixtures.statusEvents,
    arch_boards: fixtures.boards,
    custom_scenarios: fixtures.customScenarios,
    questions: [],
  }[table] ?? [];

  // arch_boards is read both as a list and as one board by id.
  const id = searchParams.get("id")?.replace("eq.", "");
  const selected = id ? rows.filter((row) => row.id === id) : rows;
  const paged = offset > 0 ? [] : selected;

  return wantsObject ? (paged[0] ?? null) : paged;
}

await mkdir(outDir, { recursive: true });

const profileDir = join(tmpdir(), `grip-screenshots-${Date.now()}`);
const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1600,1000",
  "--hide-scrollbars",
  "about:blank",
]);

try {
  const wsUrl = await waitForDebugTarget();
  const cdp = await createCdp(wsUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Fetch.enable", {
    patterns: [
      { urlPattern: `https://${supabaseHost}/auth/v1/*`, requestStage: "Request" },
      { urlPattern: `https://${supabaseHost}/rest/v1/*`, requestStage: "Request" },
      ...(pipelineOrigin ? [{ urlPattern: `${pipelineOrigin}/*`, requestStage: "Request" }] : []),
    ],
  });

  // Serve auth, data and pipeline requests from fixtures, so every screen shows
  // a populated state and nothing renders an error.
  // Fulfilled cross-origin responses still go through CORS, so every reply
  // carries the headers, and preflights are answered before any routing.
  const corsHeaders = [
    { name: "Access-Control-Allow-Origin", value: "*" },
    { name: "Access-Control-Allow-Headers", value: "*" },
    { name: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
    { name: "Access-Control-Expose-Headers", value: "Content-Range" },
  ];

  cdp.onEvent("Fetch.requestPaused", async (params) => {
    const url = params.request.url;
    const headers = params.request.headers ?? {};
    let payload;

    if (params.request.method === "OPTIONS") {
      await cdp.send("Fetch.fulfillRequest", {
        requestId: params.requestId,
        responseCode: 204,
        responseHeaders: corsHeaders,
      });
      return;
    }

    if (url.includes("/auth/v1/")) {
      payload = url.includes("/token") || url.includes("/user") ? fakeUser : { message: "ok" };
    } else if (url.includes("/api/pipeline/velocity")) {
      payload = fixtures.velocity;
    } else if (url.includes("/rest/v1/")) {
      payload = restPayload(url, headers);
      if (process.env.DEBUG_REST) console.log("REST", params.request.method, url.split("/rest/v1/")[1]?.slice(0, 110), "->", Array.isArray(payload) ? payload.length + " rows" : typeof payload);
    } else {
      payload = { message: "ok" };
    }

    await cdp.send("Fetch.fulfillRequest", {
      requestId: params.requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }, ...corsHeaders],
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    });
  });

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // localStorage is origin-scoped, so we must be on the app's origin to set it.
  // Navigate there first, wait for the document to be available, inject, then reload.
  await cdp.send("Page.navigate", { url: baseUrl });
  await waitForLoad(cdp);
  await cdp.send("Runtime.evaluate", {
    expression: `localStorage.setItem(${JSON.stringify(authKey)}, ${JSON.stringify(JSON.stringify(fakeSession))})`,
  });
  await cdp.send("Page.reload", { ignoreCache: true });
  await waitForLoad(cdp);

  await capture(cdp, "01-prep");

  // Click Poe (the raven mascot button) to trigger a thought bubble, then capture.
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const btn = document.querySelector('[aria-label*="Ask"]') || document.querySelector('[title*="Ask"]');
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `,
    returnByValue: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
  await capture(cdp, "01b-poe");

  await clickTab(cdp, "Stories");
  await capture(cdp, "02-stories");
  await clickTab(cdp, "Arch Board");
  // Open the saved board so the canvas shows a finished design, then score it.
  // The board list lives in a collapsed <details>; open it before clicking Load.
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('details').forEach((item) => { item.open = true; })`,
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
  await clickText(cdp, "Load");
  await clickText(cdp, "Evaluate design");
  await new Promise((resolve) => setTimeout(resolve, 900));
  await capture(cdp, "03-arch-board");
  await clickTab(cdp, "Quest");
  await capture(cdp, "04-quest");
  await clickTab(cdp, "Profile");
  await capture(cdp, "05-profile");
  cdp.close();
} finally {
  chrome.kill("SIGTERM");
}

console.log(`Saved screenshots to ${outDir.pathname}`);
