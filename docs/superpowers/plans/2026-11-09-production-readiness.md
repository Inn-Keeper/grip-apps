# Production Readiness Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkboxes for tracking. This document authorizes no deployment, live model calls, account deletion or commits by itself.

**Goal:** Close the highest-priority gaps for a controlled Grip web beta and establish explicit gates for a public launch.

**Architecture:** Keep Supabase Auth/RLS as the identity and data boundary, FastAPI as the AI boundary, and the existing Java service for pipeline analytics. Deliver separate reviewable changes per repository; avoid a new general backend, queue or billing system. This is a phased release plan; operational choices below are proposals, not claims about deployed configuration.

**Tech stack:** React/Vite, TypeScript, Supabase/Postgres/Auth, Python/FastAPI, Java/Spring Boot, existing CI and hosting.

**Spec:** [Production readiness review](../../production-readiness-2026-11-09.md).

## Global constraints

- Web launch only. No native-mobile expansion, payments, additional content or notification delivery.
- Read each repository README and current state before implementation. Read BRAND.md, DESIGN.md and SCREEN-GUIDELINES.md before UI/copy changes.
- Preserve existing playbook generation, retry and transactional publication behavior.
- No new production dependency without explaining its need. No secrets, tokens, CVs, job text or story bodies in logs, analytics or committed evidence.
- Commit only when asked. Treat deployment, paid hosting changes, live model evaluation and real-user destructive actions separately from local implementation.
- Keep reusable controls small; do not implement a distributed platform for speculative scale.
- Record dated evidence and exact revision for every release gate. Historical passing checks are not current acceptance.

## Review focus

1. Recovery links opened in a different browser or with an existing session must not expose the wrong account (Task 1).
2. Export/deletion and late requests must never affect a different signed-in user (Task 2).
3. Simultaneous requests and retries must not bypass AI limits or leak capacity (Task 3).
4. A service can be healthy while a provider or schema is unusable; alerting must distinguish these failures (Tasks 4–5).
5. Generation/save failure followed by refresh must preserve the last valid playbook and show recoverable state (Task 6).

## Delivery order and gates

| Order | Deliverable | Depends on | Gate |
| --- | --- | --- | --- |
| 1 | Account recovery | Existing Supabase Auth | Recovery works with delivered email and expired links |
| 2 | Data lifecycle and disclosures | Account identity, data inventory | Complete export; verified isolated deletion; accurate copy |
| 3 | AI admission controls | Existing API authentication | Bounded consumption under concurrency/restart |
| 4 | Monitoring and operating runbook | Deployed service inventory | A synthetic failure reaches the operator |
| 5 | Database release/recovery checks | Isolated database environment | Migrations, isolation and restore verified |
| 6 | Release acceptance | Tasks 1–5 | Real-service core journeys pass |

Tasks 1–6 gate a controlled beta. Calibration and observed user success gate broader launch claims. Each task ends with scoped checks and a reviewable diff; implementation is not part of this documentation request.

## Task 1: Password recovery and authentication acceptance

**Repository/files:** grip-apps: `apps/web/src/SignIn.tsx`, `apps/web/src/App.tsx`, `apps/web/src/lib/supabase.ts`, locale files under `packages/core/src/locales/`; proposed colocated `apps/web/src/auth/PasswordRecovery.tsx` and recovery-state tests. Add `docs/auth-release-checklist.md` for deployment evidence.

**Contract:** Request recovery through Supabase `resetPasswordForEmail` with a fixed allowed app return URL. Treat `PASSWORD_RECOVERY` as an explicit application state; update the password through the recovery session using `updateUser`. Do not use arbitrary redirect URLs from user input.

- [ ] Add regression cases for generic request acknowledgement, expired/invalid link, mismatched passwords, failed password update and recovery while another session exists. Assert ordinary signed-in navigation cannot swallow the recovery screen.
- [ ] Add “Forgot password?” and a minimal request/reset flow with visible labels, local errors, busy states and keyboard focus. Return a neutral request acknowledgement that does not reveal account existence.
- [ ] Preserve GitHub and guest flows. Successful reset ends in an explicit confirmation and predictable authenticated destination.
- [ ] Verify sender setup, email delivery, redirect allowlist, email confirmation and recovery in a second browser using a designated test account. Record configuration names and results, never credentials or reset URLs.
- [ ] Run web tests, typechecks and `pnpm run ci`; document any environment workaround separately.

**Done when:** A user who forgot their password can regain access without operator intervention, and expired links offer a fresh request.

## Task 2: Data lifecycle and truthful disclosures

**Repository/files:** grip-apps: `apps/web/src/profile/ProfileSections.tsx`, profile routing/components, `apps/web/src/App.tsx`, locale files, `packages/core/src/api/`, `supabase/migrations/`. Proposed `docs/data-lifecycle.md` and a Supabase Edge Function under `supabase/functions/account-delete/` if no existing trusted deletion surface is available.

**Contract:** Export is versioned JSON containing all owned application records and a generation timestamp, obtained through the user's RLS-scoped session. Account deletion derives identity from a verified bearer token, never a caller-supplied user ID. Any admin credential stays in the trusted function environment, outside clients and the AI service.

- [ ] Inventory owned tables, relationships, shared links, generated artifacts, browser caches and provider-bound inputs. Record what is stored, where, deletion behavior and actual backup retention. Inspect all foreign keys before choosing auth-user deletion as the cascade mechanism.
- [ ] Implement and test export pagination so large accounts are complete. Fail visibly on partial reads; never present a truncated export as successful. Exclude tokens and other users' records.
- [ ] Implement authenticated deletion with explicit destructive confirmation. Validate the session server-side and reject missing/invalid tokens and foreign-user targets. Audit cascade coverage and add only necessary schema changes; make retry after an ambiguous response safe.
- [ ] Test two users: deleting A removes A's private records and public share access, preserves B, and clears A's browser/query state. A failed delete must not display success or falsely erase server state. Verify existing sessions cannot continue reading deleted data.
- [ ] Add export/delete controls and public privacy/terms/support links accessible before login. Distinguish raw CV/job text from persisted role, brief, outputs and chat history; correct “Grip doesn't store them.” Match all supported locales.
- [ ] Supply actual operator/support identity and retention/provider facts before publication. These are release inputs, not values to invent. Test destructive behavior only on disposable test accounts.
- [ ] Run app checks plus the new function/database checks. Save evidence in `docs/data-lifecycle.md`.

**Done when:** Users can obtain a complete copy and remove their account, with cross-user isolation proven and disclosures matching storage behavior.

## Task 3: AI limits and bounded concurrency

**Repository/files:** grip-ai-api: `app/service.py`, `app/import_service.py`, `app/playbook_service.py`, `app/poe_service.py`, `app/config.py`, `app/main.py`, tests and README. Proposed small shared admission helper. If persistent allowances are selected, add the narrowly scoped counter migration in grip-apps and integration coverage.

**Contract:** Authenticate before reserving capacity. Apply per-user allowances to grading and import as well as playbooks/chat. Return stable 429 codes and `Retry-After` for allowance exhaustion, and 503 for unavailable execution capacity. Bound provider work across routes sharing the same model; separate route semaphores alone must not exceed the aggregate budget.

- [ ] Document the initial allowed request volumes, provider budget and concurrent capacity from the intended beta size. Set explicit configuration defaults from that budget; do not copy unverified provider free-tier claims into policy.
- [ ] Add failing tests for the Nth allowed request and N+1 rejection, simultaneous requests at the limit, users A/B isolation, cache hits, multi-chunk imports, cancellation and provider failures.
- [ ] Implement shared admission checks. Count actual provider attempts separately from successful user outcomes so refunded failures cannot create unlimited paid retries. Reserve enough allowance before multi-chunk imports or reject before starting; keep existing no-partial-results behavior.
- [ ] Prove capacity is released on success, failure and cancellation. Ensure request deadlines include waiting time and that duplicate in-flight work cannot multiply consumption unnoticed.
- [ ] Make daily-cap persistence explicit. Preferred public-launch approach: atomic server-controlled counters in existing Postgres, not a new Redis service. If a single-instance in-memory beta is chosen, document restart resets and enforce an independent provider-side spending ceiling; do not advertise a durable daily limit.
- [ ] Test restart behavior for the selected approach and verify unauthorized callers cannot change counters. Run offline API tests and Ruff checks; no live inference needed.

**Done when:** One account cannot exhaust shared capacity through ordinary repeated calls, and failure/retry/restart semantics are documented and tested.

## Task 4: Monitoring, support and operating runbook

**Repository/files:** grip-apps: `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, proposed `docs/production-runbook.md`; grip-ai-api: `app/main.py`, service logging and `render.yaml`; grip-pipeline-service: `render.yaml` and existing health configuration.

**Contract:** Collect sanitized errors, request IDs, status, duration and route—not personal request bodies. Keep cheap liveness/configuration checks separate from provider-dependent checks. Route actionable alerts to an actual operator.

- [ ] Inventory actual deployments, regions, origins, service plans, secrets by name, migration revision and rollback revisions. Select always-on hosting where required by the latency target; price changes require a concrete hosting decision before execution.
- [ ] Define initial availability and latency targets, alert thresholds and an owner in the runbook. Measure cold and warm calls before asserting the targets are met.
- [ ] Add a top-level web error boundary with recovery guidance and sanitized reporting. Reuse available hosting observability where sufficient; explain any new SDK before adding it.
- [ ] Add structured API success/failure duration metrics and alerts for elevated failures, auth dependency failures and exhausted AI budget. Avoid public detailed diagnostics.
- [ ] Trigger a synthetic frontend exception and backend failure in staging. Confirm receipt and request correlation; assert that tokens, URLs containing credentials and user text are absent.
- [ ] Document support intake, triage, disabling unavailable AI features, restoring the previous client/service revision and handling database compatibility. Rehearse rollback without rolling back user data blindly.

**Done when:** The operator discovers a failure without waiting for a user report and can follow a tested recovery procedure.

## Task 5: Database migration, isolation and restore gate

**Repository/files:** grip-apps: `supabase/migrations/`, `.github/workflows/ci.yml`, proposed `supabase/tests/production-readiness.sql` and `docs/database-release-checklist.md`; grip-pipeline-service: existing integration tests and `src/test/resources/db/testcontainers-schema.sql`.

**Contract:** Test the real ordered Supabase migrations, not only a hand-maintained schema approximation. Run isolation checks as authenticated users and anonymous callers. Restore into an isolated database, never overwrite production as a test.

- [ ] Add an isolated Supabase-compatible database test job and run all migrations from an empty database. Check new migrations against the preceding release schema too.
- [ ] Add tests for cross-user reads/writes across owned tables and RPCs, public share output, share revocation, answer recording, preparation saves and atomic playbook publication. Failed multi-record publication must leave the prior active playbook intact.
- [ ] Check function grants and privileged functions explicitly; own-row policies alone do not establish RPC safety. Ensure test credentials cannot reach production.
- [ ] Compare the deployed schema/migration history with the release revision using read-only inspection. Treat the changelog's recorded application of 0030 as history to verify, not an outstanding migration to blindly rerun.
- [ ] Record backup scope, retention and recovery objectives. Restore a designated backup into an isolated environment and verify record counts, relationships and representative reads. Record elapsed time and any uncovered data outside database backups.
- [ ] Run Java integration tests with Docker available and confirm they executed rather than skipped. Document the release order and compatibility of client, services and schema.

**Done when:** A fresh install, upgrade, access-control checks and isolated restore all have dated passing evidence.

## Task 6: Release acceptance and beta decision

**Repository/files:** grip-apps: proposed `docs/release-acceptance.md`; existing test suites and capture tooling. Add browser automation only where existing tooling cannot test the required behavior, explaining any new development dependency.

- [ ] Run signup → playbook generation → practice → save → refresh → sign out/in → resume against designated test services/accounts. Record revision, browser and viewport.
- [ ] Test unavailable provider, timeout, interruption, duplicate submit, failed save, refresh during generation and retry. Verify the last valid playbook survives and late responses cannot overwrite a newer state or another user's data.
- [ ] Verify share/unshare, export/delete and password recovery. Test narrow layouts, keyboard-only navigation, visible focus, zoom and reduced motion across supported browsers.
- [ ] Check unauthorized API requests and cross-account reads with the deployed test configuration, including CORS and auth redirects. Perform dependency/security checks against current advisories; do not reuse old alert conclusions.
- [ ] Run complete repository checks on the exact release revision and record all skips. Measure initial load and core actions on a representative slower connection before deciding whether the current bundle warning needs a launch fix.
- [ ] Review open defects by user consequence. Block beta on account exposure, data loss, failed recovery, missing data lifecycle controls or inability to complete the core journey. Record accepted noncritical limitations with owner and follow-up.

**Done when:** A release evidence document supports a specific beta decision rather than “tests passed.”

## Public-launch follow-up

- [ ] Complete the existing `grip-ai-api/docs/grading-calibration.md` procedure with human-reviewed fixtures and explicitly authorized live calls. Record false credit, false rejection and repeatability by language/answer length; keep practice-feedback wording until supported by evidence.
- [ ] Add privacy-preserving activation events: generation outcome, first completed practice, save/resume outcome and return practice. Do not send free text or document contents.
- [ ] Observe a small target-user cohort reaching first value and returning without guidance. Record confusion and completion failures; improve those paths before expanding features.

## Verification commands during implementation

- grip-apps: `rtk pnpm run ci`. If sandbox Watchman access fails, record that failure and separately run core/mobile Jest with `--runInBand --watchman=false`, web tests, typecheck and build.
- grip-ai-api: `rtk .venv/bin/python -m pytest -q`, `rtk .venv/bin/ruff check .`, `rtk .venv/bin/ruff format --check .`. Verify Python 3.11 in CI as well as the local interpreter.
- grip-pipeline-service: `JAVA_HOME=$(/usr/libexec/java_home -v 21) rtk ./gradlew build`; Docker must be available and integration-test execution confirmed.
- Run the new database/function/browser checks introduced by the owning tasks. Record exact commands in the release evidence; default CI currently does not cover all these surfaces.

## Remaining release inputs

The owner must supply the real support/operator identity, hosting spend limit, expected beta concurrency, recovery objectives and actual data-retention facts. These inputs gate the relevant operational configuration/publication, not preparation of the code and tests. No deployment or live acceptance is marked complete by this plan.
