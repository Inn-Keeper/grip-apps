# Posting Link Techs Design

## Goal

Ledger import fills `posting_techs` only from techs named in the ledger itself.
Most rows name none (see `testing ledger.md`: 2 of 9), but most rows have a
link to the posting, and the posting lists the stack. Read those links during
import so imported contacts get a real prep plan.

## Projects touched

| Part | grip-apps | grip-ai-api |
| --- | --- | --- |
| Fetch posting text | | new `POST /api/v1/ai/import/postings` |
| Detect techs, merge, review | core helper + import modal | |

No database change: techs are saved through the existing `posting_techs` column.

## Why the server fetches

The browser cannot read another site's page (CORS), so a server has to fetch
it. That makes grip-ai-api a URL fetcher on behalf of users, which is the main
risk this design guards against (server side request forgery, abuse as a proxy).

## Data flow

1. Parse runs as today. Rows come back with `link` and model techs.
2. A checkbox, on by default, shown in the upload step (before anything is
   sent) and again in review: "Read posting links to find techs. Grip's server
   opens each link once; nothing from the page is stored." Unchecked before
   parsing, no link is ever opened. See Link reading lifecycle.
3. `POST /api/v1/ai/import/postings` with `{ urls: string[] }` (max 10, deduped).
   For each URL it returns `{ url, status, text }`:
   - `status`: `ok`, `blocked`, `unreachable`, `not_html`, `too_large`, `empty`.
   - `text`: visible page text, script and style removed, plus the
     description of any schema.org `JobPosting` block (boards built with
     JavaScript, such as Ashby, ship it), capped at 20,000 chars. Only when `ok`.
4. The client runs `extractTechsFromText(text, PREP_TECHS, 5)`, the same
   detector the contact form uses, so names always match the Prep catalog and
   the catalog stays in one place (no copy in Python). The detector knows
   common short names (TS, RN, Postgres, k8s), matched case sensitively, and
   breaks ties by first mention.
5. Merge per row: page techs first (the posting is the better source), then
   the model's title techs, deduped, capped at 5. Chips update in place; a row
   whose link failed shows a quiet note ("Could not read the posting").
6. Each row's techs are editable before confirming: remove a chip, or add one
   from a catalog combobox (see Manual techs).
7. Confirm saves as today. The page text is dropped with the modal state.

No LLM is involved in step 3 or 4: no provider quota spent, and no page content
reaches a third party. Ranking is by mention count, which is good enough for a
top 5. If it proves noisy, a later step can ask the model to pick must-haves.

## Link reading lifecycle

- Links are read once per parse (`parseId`), only for included rows with a
  link and no `linkStatus` yet (`linksToRead`), at most 10.
- Moving between review and confirm neither aborts nor repeats the read.
- Unchecking aborts the request in flight; late results are dropped. Checking
  again reads only the rows still unread, so no link is spent twice.
- Closing the modal aborts. Rows edited by hand (`techsEdited`) are never
  overwritten.
- While a read is in flight the review shows a status line; the user can keep
  editing or save, and saving keeps the techs shown at that moment.

## Manual techs

One small `TechPicker` (existing `TechChips` with remove, plus the existing
`Combobox` over the Prep catalog to add) used in two places:

- Import review, per row, under the row's fields.
- Contact form, replacing the read-only detected chips, so techs can be added
  without pasting a posting.

Only catalog techs can be added, so every saved tech is drillable. The form
keeps its cap of 12; adding past it is disabled. The prep plan still drills the
weakest 5.

## Safety guards (grip-ai-api)

**Who can call it**
- Requires a valid Supabase session, like parse.
- Per user limit, in memory like the quota memory: 30 URLs per 10 minutes.
  Over it returns 429 `rate_limited`.

**Which URLs**
- `https` only, default port only, no userinfo (`user:pass@`).
- Resolve the host and reject unless every address is public
  (`is_global`, plus explicit rejection of multicast, which `is_global`
  admits, and of IPv6 ranges that embed IPv4: NAT64 `64:ff9b::/96`,
  `64:ff9b:1::/48` and IPv4 compatible `::/96`). This blocks localhost, private
  ranges, link local (including `169.254.169.254`), reserved and multicast.
- Connect to the address that was checked, not a fresh lookup, so DNS
  rebinding cannot swap in a private address between check and connect
  (the request goes to the checked IP with the original `Host` header and
  `sni_hostname`, so TLS still verifies the real name).
- Redirects followed by hand, max 3, and every hop goes through the same checks.

**What the request looks like**
- `GET` only, no cookies (the client's jar is cleared before every hop, since
  httpx keeps `Set-Cookie` from a redirect), no `Referer`, no auth headers, a
  plain `GripPostingReader` user agent. The user's token is never forwarded.
- One 5 s deadline per URL covering DNS, every redirect and the whole body
  (`asyncio.timeout`), 3 at a time, 20 s overall for the request.

**What it accepts back**
- `Content-Type` must be `text/html` or `text/plain`, else `not_html`.
- Body read raw from the stream and cut at 1 MB, else `too_large`. Only
  `gzip` and `deflate` are accepted as encodings and are inflated by hand with
  a per chunk output cap, so a compression bomb never expands past 1 MB.
- HTML reduced to text with the stdlib `html.parser`; nothing is executed or
  rendered.

## Privacy

- On by default, with the checkbox and its copy visible before parsing and in
  review, so the user can opt out before any link is opened.
- The job site sees a request from Grip's server, not the user's browser or
  IP. Query strings are kept because some boards need them (Indeed `jk=`), so a
  tracking id in the link reaches the site; it already would on a normal click.
- URLs and page text are never logged or stored. Logs keep counts per status
  only, matching the parse endpoint.
- Page text goes to the browser and nowhere else, and only detected techs
  persist.

## Failure modes

| Case | Result |
| --- | --- |
| Login or bot wall (LinkedIn, often Indeed) | `ok` with little text, or `unreachable`; row keeps model techs |
| Page rendered by JavaScript | `empty`; row keeps model techs |
| Posting closed, 404 | `unreachable` |
| Link to a private or internal address | `blocked`, no request made |
| Slow site | `unreachable` after 5 s, other links unaffected |
| API older than the web app | endpoint missing, checkbox shows an error, import still works |
| Techs outside the Prep catalog (AWS, GraphQL, Go) | dropped, as in the contact form |

## Testing

- grip-ai-api: unit tests with a mocked transport for each guard: http URL,
  private and metadata IPs, a public host that resolves to a private IP, a
  redirect to a private address, too many redirects, wrong content type, body
  over 1 MB, timeout, rate limit. HTML to text: scripts and styles removed.
- grip-apps core: merge order, dedupe and cap; failed links keep model techs.
- No test hits the network.

## Out of scope

- Headless browser for JavaScript pages.
- Fetching for contacts already in Quest. A "Read posting" button on the
  contact form could reuse the endpoint later.
- Storing posting text.
- LLM must-have ranking.

## Decisions

1. Any website, no domain allowlist. Safety comes from the guards above (https,
   public addresses only, pinned connection, checked redirects, size and time
   caps, text only).
2. Link reading is on by default and can be turned off per import.
3. Techs can be added or removed by hand per row in the import review and in
   the contact form.
