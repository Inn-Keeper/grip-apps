# Posting Link Techs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Imported and hand-made contacts get drillable posting techs: editable by hand, and read from the posting link during import.

**Architecture:** grip-ai-api gets a guarded `POST /api/v1/ai/import/postings` that returns the visible text of public `https` pages. grip-apps detects catalog techs in that text with the existing `extractTechsFromText`, merges them with the model's techs, and lets the user edit them in the import review and the contact form.

**Tech Stack:** Python 3.11, FastAPI, httpx 0.28 (already a dependency), stdlib `html.parser`, `ipaddress`, `socket`; React, TypeScript, `@grip/core` (JS, jest).

**Spec:** `grip-apps/docs/superpowers/specs/2026-10-06-posting-link-techs-design.md`

## Revisions after implementation

The working tree is the source of truth; code blocks below are the first draft.
Changes made during and after implementation:

- Task 2: multicast and IPv4 embedding IPv6 ranges are rejected explicitly
  (`is_public`); cookies are cleared before each hop; one `asyncio.timeout`
  deadline per URL; body read with `aiter_raw` and inflated by hand with a cap;
  schema.org `JobPosting` descriptions are added to the text. Tests stream
  their bodies, since httpx treats bytes content as already read.
- Task 3: the effect runs once per parse (`parseId`), not on step changes;
  `linksToRead` picks included, unread rows; the checkbox is shown in the
  upload step too; a status line shows while links are read.
- Detector: aliases (case sensitive) and first mention tie break in
  `cvTechs.js`.
- `docs/system-design.md` has no import section, so its step was skipped.

## Global Constraints

- No new production dependencies in either project.
- Only Prep catalog techs are saved (`categories` in `packages/core/src/prepData.js`).
- Import rows keep at most 5 techs; the contact form keeps its cap of 12.
- URLs and page text are never logged or stored; logs keep counts only.
- Fetch guards: `https` only, default port, no userinfo, every resolved address `is_global`, connection pinned to the checked IP, max 3 redirects each re-checked, `GET` only, no cookies, no `Referer`, no forwarded token, 5 s per URL, 3 concurrent, 1 MB body cap, `text/html` or `text/plain` only, 20,000 chars of text max, 10 URLs per request, 30 URLs per user per 10 minutes.
- Link reading is on by default and can be unchecked per import.
- UI copy in en, sv and pt; no em or en dashes in copy, comments or docs.
- Comments: one or two lines.
- Commit only when the user asks, on `main`, no AI attribution.
- Checks: grip-apps `pnpm run ci`; grip-ai-api `.venv/bin/python -m pytest -q`, `.venv/bin/python -m ruff check .`, `.venv/bin/python -m ruff format --check .`. In this shell put node on PATH first: `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.

## Review Focus

- A public hostname whose DNS answer includes a private address (rebinding style): must be `blocked`, no request sent. Pinned by `test_host_with_any_private_address_is_blocked` (Task 2).
- A public page that redirects to `http://169.254.169.254/`: must be `blocked`. Pinned by `test_redirect_to_private_address_is_blocked` (Task 2).
- An endless or huge streaming response: cut at 1 MB, `too_large`, not memory growth. Pinned by `test_body_over_cap_is_too_large` (Task 2).
- User unchecks link reading while fetches are in flight: results must not overwrite rows. Handled by aborting the request in the effect cleanup; re-checking resumes only unread rows, pinned by the `linksToRead` test (Task 3). The effect itself has no component test (web tests run plain `.js` only).
- User edits a row's techs by hand, then the fetch returns: manual edits must win. Pinned by `mergeTechs` only filling rows not marked `techsEdited` (Task 3).

---

### Task 1: Editable techs in the import review and the contact form (grip-apps)

**Files:**
- Modify: `packages/core/src/prepData.js` (export `PREP_TECHS`), `packages/core/package.json` (subpath export)
- Modify: `packages/core/src/ledgerImport.js` (use `PREP_TECHS`)
- Create: `packages/core/src/techList.js`
- Test: `packages/core/src/__tests__/techList.test.js`
- Create: `apps/web/src/quest/TechPicker.tsx`
- Modify: `apps/web/src/quest/import/ReviewList.tsx`
- Modify: `apps/web/src/quest/ContactForm.tsx:14-17,89-100`
- Modify: `packages/core/src/locales/en.js`, `sv.js`, `pt.js`

**Interfaces:**
- Produces: `PREP_TECHS: string[]` from `@grip/core/prepData`; `addTech(techs: string[], tech: string, limit: number): string[]` from `@grip/core/techList`; `<TechPicker label techs limit onChange />`; `ReviewRow.techsEdited?: boolean`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/__tests__/techList.test.js`:

```js
import { addTech } from "../techList.js";

describe("addTech", () => {
  test("appends a new tech", () => {
    expect(addTech(["React"], "TypeScript", 5)).toEqual(["React", "TypeScript"]);
  });
  test("ignores duplicates and blanks", () => {
    expect(addTech(["React"], "React", 5)).toEqual(["React"]);
    expect(addTech(["React"], "", 5)).toEqual(["React"]);
  });
  test("refuses past the limit", () => {
    expect(addTech(["A", "B"], "C", 2)).toEqual(["A", "B"]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @grip/core test -- techList`
Expected: FAIL, cannot find module `../techList.js`.

- [ ] **Step 3: Implement**

`packages/core/src/techList.js`:

```js
// Adds a tech to a capped, duplicate free list (posting techs on a contact).

/** @param {string[]} techs @param {string} tech @param {number} limit */
export function addTech(techs, tech, limit) {
  if (!tech || techs.includes(tech) || techs.length >= limit) return techs;
  return [...techs, tech];
}
```

Add `"./techList": "./src/techList.js",` to the `exports` map in `packages/core/package.json`, next to `"./prepData"`.

At the end of `packages/core/src/prepData.js`:

```js
// Every drillable tech name, for pickers and posting detection.
export const PREP_TECHS = categories.flatMap((c) => c.items.map((item) => item.tech));
```

In `packages/core/src/ledgerImport.js` replace the local `PREP_TECHS` and the `categories` import with `import { PREP_TECHS } from "./prepData.js";`.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @grip/core test`
Expected: all pass.

- [ ] **Step 5: TechPicker component**

`apps/web/src/quest/TechPicker.tsx`:

```tsx
import { PREP_TECHS } from "@grip/core/prepData";
import { addTech } from "@grip/core/techList";
import { t } from "@grip/core/i18n";
import { Combobox } from "../components/Combobox";
import { TechChips } from "./TechChips";

// Removable chips plus a catalog search to add one; only drillable techs can be saved.
export function TechPicker({ label, techs, limit, onChange }: {
  label: string;
  techs: string[];
  limit: number;
  onChange: (techs: string[]) => void;
}) {
  const options = PREP_TECHS.filter((tech) => !techs.includes(tech)).map((tech) => ({ label: tech, value: tech }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <TechChips label={label} techs={techs} onRemove={(tech) => onChange(techs.filter((item) => item !== tech))} />
      <Combobox
        value=""
        options={options}
        filterable
        disabled={techs.length >= limit}
        placeholder={t("contacts.addTech")}
        onChange={(tech) => onChange(addTech(techs, tech, limit))}
      />
    </div>
  );
}
```

If `TechChips` renders nothing useful with an empty list, keep it: the label still shows above the add field.

- [ ] **Step 6: Use it in the contact form**

In `apps/web/src/quest/ContactForm.tsx`, delete `ALL_TECHS` and the `categories` import, import `PREP_TECHS` from `@grip/core/prepData`, use it in `extractTechsFromText(text, PREP_TECHS, POSTING_TECH_LIMIT)`, and replace the `{form.postingTechs.length > 0 && (<TechChips ... />)}` block with:

```tsx
<TechPicker
  label={t("contacts.postingDetected")}
  techs={form.postingTechs}
  limit={POSTING_TECH_LIMIT}
  onChange={(postingTechs) => setForm((current) => ({ ...current, postingTechs }))}
/>
```

Drop the now unused `TechChips` import.

- [ ] **Step 7: Use it in the import review**

In `apps/web/src/quest/import/ReviewList.tsx`:
- Extend the type: `export type ReviewRow = Contact & { id: string; stageReachedOn: string; included: boolean; source: string; warnings: string[]; techsEdited?: boolean };`
- Add `const IMPORT_TECH_LIMIT = 5;`
- Replace the read-only chips block (the `row.postingTechs.length > 0 && (...)` div) with:

```tsx
<div style={{ marginTop: space.sm }}>
  <TechPicker
    label={t("quest.importTechs")}
    techs={row.postingTechs}
    limit={IMPORT_TECH_LIMIT}
    onChange={(postingTechs) => onChange(row.id, { postingTechs, techsEdited: true })}
  />
</div>
```

In `apps/web/src/quest/import/ImportModal.tsx` strip the new field before saving: change the destructure in `save.mutate(chosen.map(...))` to `({ included: _i, source: _s, warnings: _w, techsEdited: _e, ...contact }) => contact`.

- [ ] **Step 8: Copy**

Add after `"contacts.postingDetected"` in each locale:
- en: `"contacts.addTech": "Add a tech",`
- sv: `"contacts.addTech": "Lägg till teknik",`
- pt: `"contacts.addTech": "Adicionar tecnologia",`

- [ ] **Step 9: Checks and manual run**

Run: `pnpm run ci`
Expected: lint, tests, typecheck and build pass.
Manual: import `testing ledger.md`, add and remove a tech on a row, confirm, open the contact: the techs match. Edit a contact, add a tech without pasting a posting, save, reopen: it persists. With 12 techs in the form the add field is disabled.

- [ ] **Step 10: CHANGELOG and commit (only if asked)**

Add under the existing `## 2026-10-06` heading (create `### Added` if missing): "Posting techs can be added or removed by hand in the import review and the contact form, from the Prep catalog (en, sv, pt)."

```bash
git add packages/core apps/web CHANGELOG.md
git commit -m "feat(quest): edit posting techs by hand in import review and contact form"
```

---

### Task 2: Guarded posting reader endpoint (grip-ai-api)

**Files:**
- Create: `app/posting_reader.py` (URL guard, pinned fetch, HTML to text)
- Create: `app/posting_service.py` (auth, rate limit, fan out)
- Modify: `app/import_schemas.py` (request and response models)
- Modify: `app/main.py` (state and route)
- Test: `tests/test_posting_reader.py`, `tests/test_postings_endpoint.py`
- Modify: `README.md` (endpoint list, one line)

**Interfaces:**
- Produces: `POST /api/v1/ai/import/postings` with body `{"urls": [str]}` (1 to 10) returning `{"postings": [{"url": str, "status": "ok"|"blocked"|"unreachable"|"not_html"|"too_large"|"empty", "text": str|null}]}` in request order, deduped. Errors: 401 `authentication_required`, 429 `rate_limited` with `Retry-After`, 422 on a bad body.

- [ ] **Step 1: Write the failing reader tests**

`tests/test_posting_reader.py`:

```python
"""Posting reader guards, with DNS and HTTP stubbed; nothing touches the network."""

import asyncio

import httpx
import pytest

from app.posting_reader import PostingReader, html_to_text

PUBLIC = "93.184.216.34"


def reader(handler, addresses=None):
    table = addresses or {"jobs.example.com": [PUBLIC]}

    async def resolve(host: str) -> list[str]:
        if host not in table:
            raise OSError("no such host")
        return table[host]

    return PostingReader(resolve=resolve, transport=httpx.MockTransport(handler))


def page(body="<p>We use React and TypeScript</p>", **headers):
    return httpx.Response(
        200, headers={"content-type": "text/html; charset=utf-8", **headers}, text=body
    )


def run(r, url):
    return asyncio.run(r.read(url))


def test_reads_visible_text_from_pinned_ip_with_original_host():
    seen = {}

    def handler(request):
        seen.update(host=request.url.host, header=request.headers["host"])
        seen.update(sni=request.extensions.get("sni_hostname"))
        seen.update(cookie=request.headers.get("cookie"), ref=request.headers.get("referer"))
        return page()

    result = run(reader(handler), "https://jobs.example.com/1?jk=2")
    assert result.status == "ok" and result.text == "We use React and TypeScript"
    assert seen == {"host": PUBLIC, "header": "jobs.example.com", "sni": "jobs.example.com", "cookie": None, "ref": None}


@pytest.mark.parametrize(
    "url",
    [
        "http://jobs.example.com/1",
        "https://jobs.example.com:8443/1",
        "https://user:pw@jobs.example.com/1",
        "ftp://jobs.example.com/1",
        "not a url",
    ],
)
def test_bad_urls_are_blocked_without_a_request(url):
    def handler(request):
        raise AssertionError("no request expected")

    assert run(reader(handler), url).status == "blocked"


@pytest.mark.parametrize("address", ["127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254", "::1", "fc00::1", "224.0.0.1"])
def test_private_addresses_are_blocked(address):
    def handler(request):
        raise AssertionError("no request expected")

    r = reader(handler, {"jobs.example.com": [address]})
    assert run(r, "https://jobs.example.com/").status == "blocked"


def test_host_with_any_private_address_is_blocked():
    def handler(request):
        raise AssertionError("no request expected")

    r = reader(handler, {"jobs.example.com": [PUBLIC, "10.0.0.1"]})
    assert run(r, "https://jobs.example.com/").status == "blocked"


def test_unknown_host_is_unreachable():
    assert run(reader(lambda r: page()), "https://nope.example.com/").status == "unreachable"


def test_redirect_is_followed_and_rechecked():
    def handler(request):
        if request.url.path == "/old":
            return httpx.Response(301, headers={"location": "https://jobs.example.com/new"})
        return page("<p>Kotlin</p>")

    assert run(reader(handler), "https://jobs.example.com/old").text == "Kotlin"


def test_redirect_to_private_address_is_blocked():
    def handler(request):
        return httpx.Response(302, headers={"location": "http://169.254.169.254/latest"})

    assert run(reader(handler), "https://jobs.example.com/").status == "blocked"


def test_too_many_redirects_is_unreachable():
    def handler(request):
        return httpx.Response(302, headers={"location": "https://jobs.example.com/loop"})

    assert run(reader(handler), "https://jobs.example.com/").status == "unreachable"


def test_non_html_is_rejected():
    def handler(request):
        return httpx.Response(200, headers={"content-type": "application/pdf"}, content=b"%PDF")

    assert run(reader(handler), "https://jobs.example.com/").status == "not_html"


def test_body_over_cap_is_too_large():
    def handler(request):
        return page("<p>" + "a" * 1_100_000 + "</p>")

    assert run(reader(handler), "https://jobs.example.com/").status == "too_large"


def test_error_status_and_timeout_are_unreachable():
    assert run(reader(lambda r: httpx.Response(404)), "https://jobs.example.com/").status == "unreachable"

    def slow(request):
        raise httpx.ReadTimeout("slow", request=request)

    assert run(reader(slow), "https://jobs.example.com/").status == "unreachable"


def test_page_without_text_is_empty():
    assert run(reader(lambda r: page("<script>app()</script>")), "https://jobs.example.com/").status == "empty"


def test_html_to_text_drops_scripts_styles_and_caps():
    html = "<style>p{}</style><h1>Role</h1><script>x()</script><p>Go &amp; Rust</p>"
    assert html_to_text(html) == "Role\nGo & Rust"
    assert len(html_to_text("<p>" + "a " * 20_000 + "</p>")) == 20_000
```

- [ ] **Step 2: Run to verify it fails**

Run: `.venv/bin/python -m pytest -q tests/test_posting_reader.py`
Expected: FAIL, `ModuleNotFoundError: app.posting_reader`.

- [ ] **Step 3: Implement the reader**

`app/posting_reader.py`:

```python
"""Fetches a job posting's visible text for any public https page, guarded
against server side request forgery. Nothing is logged or stored."""

import asyncio
import ipaddress
import socket
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx

MAX_BYTES = 1_000_000
MAX_TEXT = 20_000
MAX_REDIRECTS = 3
TIMEOUT_SECONDS = 5
TEXT_TYPES = ("text/html", "text/plain")
SKIP_TAGS = {"script", "style", "noscript", "template", "svg"}


@dataclass
class Posting:
    status: str
    text: str | None = None


class _Text(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        self.skip += tag in SKIP_TAGS

    def handle_endtag(self, tag):
        self.skip -= tag in SKIP_TAGS and self.skip > 0

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(" ".join(data.split()))


def html_to_text(html: str) -> str:
    parser = _Text()
    parser.feed(html)
    return "\n".join(parser.parts)[:MAX_TEXT]


async def system_resolve(host: str) -> list[str]:
    infos = await asyncio.get_running_loop().getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    return list(dict.fromkeys(info[4][0] for info in infos))


class Blocked(Exception):
    pass


class PostingReader:
    def __init__(
        self,
        resolve: Callable[[str], Awaitable[list[str]]] = system_resolve,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.resolve = resolve
        self.transport = transport

    async def read(self, url: str) -> Posting:
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=TIMEOUT_SECONDS,
                follow_redirects=False,
                trust_env=False,
            ) as client:
                for _ in range(MAX_REDIRECTS + 1):
                    host, target = await self._pin(url)
                    request = client.build_request(
                        "GET",
                        target,
                        headers={"Host": host, "User-Agent": "GripPostingReader", "Accept": "text/html"},
                        extensions={"sni_hostname": host},
                    )
                    response = await client.send(request, stream=True)
                    try:
                        if response.is_redirect:
                            url = urljoin(url, response.headers.get("location", ""))
                            continue
                        return await self._body(response)
                    finally:
                        await response.aclose()
                return Posting("unreachable")
        except Blocked:
            return Posting("blocked")
        except (httpx.HTTPError, OSError):
            return Posting("unreachable")

    async def _pin(self, url: str) -> tuple[str, str]:
        """The original host, and the URL rewritten to a checked public IP."""
        try:
            parts = urlsplit(url)
            port = parts.port
        except ValueError as exc:
            raise Blocked from exc
        if parts.scheme != "https" or not parts.hostname or parts.username or parts.password or port not in (None, 443):
            raise Blocked
        addresses = await self.resolve(parts.hostname)
        if not addresses or not all(ipaddress.ip_address(a).is_global for a in addresses):
            raise Blocked
        ip = addresses[0]
        netloc = f"[{ip}]" if ":" in ip else ip
        return parts.hostname, parts._replace(netloc=netloc).geturl()

    @staticmethod
    async def _body(response: httpx.Response) -> Posting:
        if response.status_code != 200:
            return Posting("unreachable")
        if not response.headers.get("content-type", "").startswith(TEXT_TYPES):
            return Posting("not_html")
        body = bytearray()
        async for chunk in response.aiter_bytes():
            body += chunk
            if len(body) > MAX_BYTES:
                return Posting("too_large")
        text = html_to_text(body.decode(response.encoding or "utf-8", errors="replace"))
        return Posting("ok", text) if text else Posting("empty")
```

Note: the guard runs before every hop, so an unresolvable host raises `OSError` (unreachable) and a private one raises `Blocked`. `sni_hostname` makes TLS verify the certificate against the real host while connecting to the pinned IP.

- [ ] **Step 4: Run reader tests**

Run: `.venv/bin/python -m pytest -q tests/test_posting_reader.py`
Expected: PASS. If `test_html_to_text_drops_scripts_styles_and_caps` fails on whitespace, fix `html_to_text`, not the test.

- [ ] **Step 5: Write the failing endpoint tests**

`tests/test_postings_endpoint.py`:

```python
"""Postings endpoint: auth, limits and fan out, with the reader stubbed."""

from datetime import datetime, timedelta, timezone

from app.posting_reader import Posting
from tests.conftest import StubSupabase, make_client
from app.errors import AppError

URL = "/api/v1/ai/import/postings"


class FakeReader:
    def __init__(self):
        self.urls: list[str] = []

    async def read(self, url):
        self.urls.append(url)
        return Posting("ok", f"text of {url}") if "good" in url else Posting("blocked")


def client_with_reader(**kwargs):
    client = make_client(**kwargs)
    fake = FakeReader()
    client.app.state.posting_service.reader = fake
    return client, fake


def post(client, urls, token="token"):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post(URL, headers=headers, json={"urls": urls})


def test_returns_postings_in_order_deduped():
    client, fake = client_with_reader()
    with client:
        response = post(client, ["https://good/1", "https://bad/2", "https://good/1"])
    assert response.status_code == 200
    assert response.json() == {
        "postings": [
            {"url": "https://good/1", "status": "ok", "text": "text of https://good/1"},
            {"url": "https://bad/2", "status": "blocked", "text": None},
        ]
    }
    assert fake.urls.count("https://good/1") == 1


def test_requires_a_session():
    client, _ = client_with_reader()
    with client:
        assert post(client, ["https://good/1"], token=None).status_code == 401
    client, _ = client_with_reader(supabase=StubSupabase(fail=AppError(401, "invalid_session", "no")))
    with client:
        assert post(client, ["https://good/1"]).status_code == 401


def test_body_limits():
    client, _ = client_with_reader()
    with client:
        assert post(client, []).status_code == 422
        assert post(client, [f"https://good/{n}" for n in range(11)]).status_code == 422
        assert post(client, ["https://good/" + "a" * 2100]).status_code == 422


def test_rate_limit_per_user_window():
    now = [datetime(2026, 10, 6, 12, tzinfo=timezone.utc)]
    client, _ = client_with_reader(clock=lambda: now[0])
    with client:
        for _ in range(3):
            assert post(client, [f"https://good/{n}" for n in range(10)]).status_code == 200
        limited = post(client, ["https://good/x"])
        assert limited.status_code == 429
        assert limited.json()["error"]["code"] == "rate_limited"
        assert int(limited.headers["Retry-After"]) > 0
        now[0] += timedelta(minutes=11)
        assert post(client, ["https://good/x"]).status_code == 200
```

`make_client` builds the app with an injected `grade_service`, so `app.state.posting_service` must also be created in that branch (Step 7).

- [ ] **Step 6: Run to verify it fails**

Run: `.venv/bin/python -m pytest -q tests/test_postings_endpoint.py`
Expected: FAIL with 404 or a missing `posting_service` attribute.

- [ ] **Step 7: Implement schemas, service and route**

Append to `app/import_schemas.py`:

```python
PostingStatus = Literal["ok", "blocked", "unreachable", "not_html", "too_large", "empty"]


class PostingsRequest(StrictModel):
    urls: list[Annotated[str, Field(max_length=2048)]] = Field(min_length=1, max_length=10)


class PostingResult(BaseModel):
    url: str
    status: PostingStatus
    text: str | None


class PostingsResponse(BaseModel):
    postings: list[PostingResult]
```

and add `Annotated` to the imports: `from typing import Annotated, Literal`.

`app/posting_service.py`:

```python
"""Reads posting links for import review. Logs counts per status only."""

import asyncio
import logging
from collections import Counter, defaultdict, deque
from datetime import timedelta

from app.errors import AppError
from app.import_schemas import PostingResult, PostingsRequest, PostingsResponse
from app.posting_reader import PostingReader
from app.service import GradeService

log = logging.getLogger(__name__)

WINDOW = timedelta(minutes=10)
URLS_PER_WINDOW = 30
CONCURRENCY = 3
REQUEST_SECONDS = 20


class PostingService:
    def __init__(self, grading: GradeService, reader: PostingReader | None = None) -> None:
        self.grading = grading
        self.reader = reader or PostingReader()
        # ponytail: per process memory, like the quota memory; shared store if the API scales out.
        self._spent: dict[str, deque] = defaultdict(deque)

    async def read(self, payload: PostingsRequest, token: str | None, request_id: str) -> PostingsResponse:
        if not token:
            raise AppError(401, "authentication_required", "Authentication required.")
        session = await self.grading.supabase.validate_session(token)
        urls = list(dict.fromkeys(payload.urls))
        self._spend(session.user_id, len(urls))

        gate = asyncio.Semaphore(CONCURRENCY)

        async def one(url: str) -> PostingResult:
            async with gate:
                posting = await self.reader.read(url)
            return PostingResult(url=url, status=posting.status, text=posting.text)

        tasks = [asyncio.ensure_future(one(url)) for url in urls]
        done, pending = await asyncio.wait(tasks, timeout=REQUEST_SECONDS)
        for task in pending:
            task.cancel()
        results = [
            task.result() if task in done else PostingResult(url=url, status="unreachable", text=None)
            for url, task in zip(urls, tasks)
        ]
        log.info("postings %s: %s", request_id, dict(Counter(r.status for r in results)))
        return PostingsResponse(postings=results)

    def _spend(self, user_id: str, count: int) -> None:
        now = self.grading.clock()
        spent = self._spent[user_id]
        while spent and now - spent[0] >= WINDOW:
            spent.popleft()
        if len(spent) + count > URLS_PER_WINDOW:
            wait = int((spent[0] + WINDOW - now).total_seconds()) + 1
            raise AppError(429, "rate_limited", "Too many links read. Try again in a few minutes.", retry_after=wait)
        spent.extend([now] * count)
```

In `app/main.py`:
- `from app.posting_service import PostingService` and add `PostingsRequest, PostingsResponse` to the `app.import_schemas` import.
- After each `app.state.import_service = ImportService(...)` line add the matching `app.state.posting_service = PostingService(<same grade service>)`.
- Below the parse route:

```python
    @app.post("/api/v1/ai/import/postings", response_model=PostingsResponse)
    async def read_postings(
        payload: PostingsRequest,
        request: Request,
        credentials: Annotated[
            HTTPAuthorizationCredentials | None, Security(bearer)
        ] = None,
    ):
        return await request.app.state.posting_service.read(
            payload,
            credentials.credentials if credentials is not None else None,
            request.state.request_id,
        )
```

- [ ] **Step 8: Run all checks**

Run: `.venv/bin/python -m pytest -q && .venv/bin/python -m ruff check . && .venv/bin/python -m ruff format --check .`
Expected: all pass. Run `.venv/bin/python -m ruff format .` if only formatting fails.

- [ ] **Step 9: One live smoke check (manual, needs network)**

```bash
.venv/bin/python -c "import asyncio; from app.posting_reader import PostingReader; p = asyncio.run(PostingReader().read('https://rebtel.teamtailor.com/jobs/7294617-senior-web-developer')); print(p.status, (p.text or '')[:200])"
```

Expected: `ok` with posting text, or `unreachable` if the job is closed. Also `PostingReader().read('https://localhost/')` prints `blocked`.

- [ ] **Step 10: README and commit (only if asked)**

Add the endpoint next to `/api/v1/ai/import/parse` in `README.md`: "`POST /api/v1/ai/import/postings`: visible text of up to 10 public https posting links, for tech detection in the web app. Guarded against private addresses; nothing is logged or stored."

```bash
git add app tests README.md
git commit -m "feat(import): guarded posting reader endpoint"
```

---

### Task 3: Read links in the import review and merge techs (grip-apps)

**Files:**
- Create: `packages/core/src/postingReader.js`
- Test: `packages/core/src/__tests__/postingReader.test.js`
- Modify: `packages/core/package.json` (subpath export)
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/quest/import/ImportModal.tsx`
- Modify: `apps/web/src/quest/import/ReviewList.tsx`
- Modify: `packages/core/src/locales/en.js`, `sv.js`, `pt.js`
- Modify: `docs/system-design.md` (import section, two lines)

**Interfaces:**
- Consumes: the Task 2 endpoint; `PREP_TECHS` (Task 1); `ReviewRow.techsEdited` (Task 1).
- Produces: `createPostingReaderApi(getToken, baseUrl) -> { readPostings(urls, { signal }) }`; `techsFromPage(text) -> string[]`; `mergeTechs(rows, postings) -> rows` where rows are `{ id, link, postingTechs, techsEdited?, linkStatus? }`.

- [ ] **Step 1: Write the failing tests**

`packages/core/src/__tests__/postingReader.test.js`:

```js
import { mergeTechs, techsFromPage } from "../postingReader.js";

describe("techsFromPage", () => {
  test("catalog techs by mention count, capped at 5", () => {
    const text = "React React React TypeScript TypeScript Node.js Docker Kubernetes PostgreSQL GraphQL";
    const techs = techsFromPage(text);
    expect(techs.slice(0, 2)).toEqual(["React", "TypeScript"]);
    expect(techs).toHaveLength(5);
    expect(techs).not.toContain("GraphQL");
  });
});

describe("mergeTechs", () => {
  const row = (over) => ({ id: "a", link: "https://x/1", postingTechs: ["React"], ...over });

  test("page techs first, then model techs, deduped and capped", () => {
    const [merged] = mergeTechs([row()], [{ url: "https://x/1", status: "ok", text: "TypeScript Docker React Kotlin Python Java" }]);
    // One mention each, so page techs rank alphabetically; React is not repeated.
    expect(merged.postingTechs).toEqual(["Docker", "Java", "Kotlin", "Python", "React"]);
    expect(merged.linkStatus).toBe("ok");
  });

  test("a failed link keeps model techs and records the status", () => {
    const [merged] = mergeTechs([row()], [{ url: "https://x/1", status: "blocked", text: null }]);
    expect(merged.postingTechs).toEqual(["React"]);
    expect(merged.linkStatus).toBe("blocked");
  });

  test("rows edited by hand are left alone", () => {
    const edited = row({ techsEdited: true, postingTechs: ["Swift"] });
    expect(mergeTechs([edited], [{ url: "https://x/1", status: "ok", text: "React" }])[0]).toBe(edited);
  });

  test("rows without a fetched link are untouched", () => {
    const other = row({ link: "" });
    expect(mergeTechs([other], [])[0]).toBe(other);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @grip/core test -- postingReader`
Expected: FAIL, cannot find module.

- [ ] **Step 3: Implement**

`packages/core/src/postingReader.js`:

```js
// Posting link techs for import review: grip-ai-api returns page text, techs are
// detected here so the catalog stays in one place.
import { extractTechsFromText } from "./cvTechs.js";
import { PREP_TECHS } from "./prepData.js";
import { LedgerImportError } from "./ledgerImport.js";

const ROW_TECH_LIMIT = 5;

/** @param {string} text */
export function techsFromPage(text) {
  return extractTechsFromText(text, PREP_TECHS, ROW_TECH_LIMIT).map((d) => d.tech);
}

/**
 * Fills each row's techs from its posting: page techs first, then the model's.
 * Rows the user edited by hand keep their techs.
 * @template {{ link: string, postingTechs: string[], techsEdited?: boolean, linkStatus?: string }} R
 * @param {R[]} rows
 * @param {{ url: string, status: string, text: string | null }[]} postings
 * @returns {R[]}
 */
export function mergeTechs(rows, postings) {
  const byUrl = new Map(postings.map((p) => [p.url, p]));
  return rows.map((row) => {
    const posting = byUrl.get(row.link);
    if (!posting || row.techsEdited) return row;
    const page = posting.status === "ok" ? techsFromPage(posting.text ?? "") : [];
    const postingTechs = [...new Set([...page, ...row.postingTechs])].slice(0, ROW_TECH_LIMIT);
    return { ...row, postingTechs, linkStatus: posting.status };
  });
}

/**
 * Binds the postings endpoint to a token provider, like createLedgerImportApi.
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createPostingReaderApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/import/postings`;

  /** @param {string[]} urls @param {{ signal?: AbortSignal }} [options] */
  async function readPostings(urls, { signal } = {}) {
    const token = await getToken();
    if (!token) throw new LedgerImportError("You need to be signed in.", { code: "authentication_required" });
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ urls }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new LedgerImportError(body?.error?.message ?? "Could not read the links.", { code: body?.error?.code, status: response.status });
    return body.postings;
  }

  return { readPostings };
}
```

Add `"./postingReader": "./src/postingReader.js",` to the `exports` map in `packages/core/package.json`, next to `"./ledgerImport"`.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @grip/core test`
Expected: all pass.

- [ ] **Step 5: Wire the API**

In `apps/web/src/lib/api.ts`, next to `ledgerImport`:

```ts
import { createPostingReaderApi } from "@grip/core/postingReader";
const postingReader = aiUrl ? createPostingReaderApi(getToken, aiUrl) : null;
```

and add `postingReader` to the export list.

- [ ] **Step 6: Read links when the review opens**

In `apps/web/src/quest/import/ImportModal.tsx`:
- `const [readLinks, setReadLinks] = useState(true);`
- After `setStep("review")` succeeds, the effect below runs. Add near the other hooks:

```tsx
// Reads posting links once per review; unchecking or closing drops late results.
useEffect(() => {
  if (step !== "review" || !readLinks || !postingReader) return;
  const urls = [...new Set(rows.filter((row) => row.included && row.link).map((row) => row.link))].slice(0, 10);
  if (urls.length === 0) return;
  const controller = new AbortController();
  postingReader
    .readPostings(urls, { signal: controller.signal })
    .then((postings: { url: string; status: string; text: string | null }[]) => setRows((current) => mergeTechs(current, postings)))
    .catch((cause: Error) => {
      if (cause.name !== "AbortError") setRows((current) => current.map((row) => (row.link && !row.linkStatus ? { ...row, linkStatus: "unreachable" } : row)));
    });
  return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per review and toggle, not on every row edit
}, [step, readLinks]);
```

- Import `mergeTechs` from `@grip/core/postingReader` and `postingReader` from `../../lib/api`, plus `useEffect`.
- Above the `ReviewList`, the checkbox:

```tsx
<label style={{ display: "flex", gap: space.sm, alignItems: "flex-start", fontSize: font.size.label, color: colors.textDim }}>
  <input type="checkbox" checked={readLinks} onChange={(e) => setReadLinks(e.target.checked)} />
  {t("quest.importReadLinks")}
</label>
```

- Extend the save destructure from Task 1 with `linkStatus: _l`.
- If `space`, `font` or `colors` are not yet imported in the modal, import them from `@grip/core/tokens`.

In `ReviewList.tsx` add `linkStatus?: string` to `ReviewRow`, and under the picker:

```tsx
{row.linkStatus && row.linkStatus !== "ok" && (
  <p style={{ margin: `${space.xs}px 0 0`, fontSize: font.size.label, color: colors.textFaint }}>{t("quest.importLinkFailed")}</p>
)}
```

The 10 URL cap matches the API limit; rows past it keep their model techs. If a ledger often has more, batch requests later.

- [ ] **Step 7: Copy**

- en: `"quest.importReadLinks": "Read posting links to find techs. Grip's server opens each link once; nothing from the page is stored.",` and `"quest.importLinkFailed": "Could not read the posting.",`
- sv: `"quest.importReadLinks": "Läs annonslänkar för att hitta teknik. Grips server öppnar varje länk en gång; inget från sidan sparas.",` and `"quest.importLinkFailed": "Kunde inte läsa annonsen.",`
- pt: `"quest.importReadLinks": "Ler os links das vagas para encontrar tecnologias. O servidor do Grip abre cada link uma vez; nada da página é guardado.",` and `"quest.importLinkFailed": "Não foi possível ler a vaga.",`

- [ ] **Step 8: Docs**

In `docs/system-design.md`, in the import section, add: "During review the web app sends up to 10 posting links to `POST /api/v1/ai/import/postings`; grip-ai-api returns page text (public https only, guarded), and techs are detected in the browser against the Prep catalog."

- [ ] **Step 9: Checks and manual run**

Run: `pnpm run ci`
Expected: all pass.
Manual, with the API restarted: import `testing ledger.md`. Teamtailor and Lever rows gain techs within a few seconds; Indeed may show "Could not read the posting". Uncheck the box before results arrive: rows keep model techs. Edit a row's techs, then let results arrive: the edit stays.

- [ ] **Step 10: CHANGELOG and commit (only if asked)**

Under `## 2026-10-06` `### Added`: "Ledger import reads each posting link (on by default, can be turned off) and fills the row's techs from the posting, through a guarded grip-ai-api endpoint that only opens public https pages and stores nothing (en, sv, pt)."

```bash
git add packages/core apps/web docs CHANGELOG.md
git commit -m "feat(quest): read posting links during import to fill techs"
```
