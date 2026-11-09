# Grip production readiness review

Date: 2026-11-09. Scope: current source across grip-apps, grip-ai-api and grip-pipeline-service; initial web launch with modest traffic.

## Verdict

Grip has enough functionality for a controlled web beta. An unrestricted public launch still needs account recovery, operational safeguards, data controls and evidence that the complete experience works against production services. This is a source-backed readiness assessment, not production certification or a complete security audit.

Implementation follow-up: [High-priority launch plan](superpowers/plans/2026-11-09-production-readiness.md).

## Priorities

### 1. Complete account recovery — confirmed implementation gap

Email/password signup and login exist, but `apps/web/src/SignIn.tsx` has no forgot-password/reset flow. A returning user who forgets their password has no recovery path in the application. Add recovery and verify confirmation emails, reset links, expired links and OAuth redirects against deployed configuration.

### 2. Give users control over their data — source-backed gap

Individual record deletion and score reset exist. No account deletion, full-data export or product-wide privacy/terms pages were found in the inspected application. Add accessible data controls, a support contact and accurate storage/AI-processing disclosures.

Onboarding copy in `packages/core/src/locales/en.js` says “Grip doesn't store” submitted answers, while `packages/core/src/api/preparation.ts` persists role, stack, goal and brief. Narrow that claim to the specific transient inputs. Include browser storage in the inventory: the current changelog records per-user Poe chat persistence and clearing on sign-out.

### 3. Protect shared AI capacity — confirmed implementation gap

Playbooks and Poe have per-user caps. `../grip-ai-api/app/service.py` and `../grip-ai-api/app/import_service.py` lack equivalent application-level allowances for grading and ledger import. Repeated distinct requests can consume provider capacity shared with other users. Add per-user limits and bounded concurrency across these routes. Existing in-memory caps reset on restart; review persistence before treating them as enforceable daily allowances.

### 4. Establish a reliable production operating setup — configuration evidence, live state unknown

Both service `render.yaml` files specify free instances; their documentation anticipates cold starts. AI `/ready` checks configuration, not provider connectivity. Verify actual hosting configuration, define latency/error targets, add external health checks and alerts, and document rollback and incident response. No frontend exception-reporting integration was found in inspected source.

Do not infer current provider pricing, deployed instance plans or observed latency from repository comments.

### 5. Prove database deployment and recovery — verification gap

The application depends on migrations through `0030_profile_preparation.sql`. The changelog records that migration as applied to the linked project on 2026-11-09; this review did not independently verify the remote schema. Application CI does not apply and test Supabase migrations. Add a repeatable release check, real-database cross-account authorization tests and a demonstrated backup restoration.

RLS definitions are useful source evidence, not proof of the deployed configuration. The Java service has database integration tests, but these do not replace testing the complete Supabase migration/RPC surface.

### 6. Verify complete journeys against real services — acceptance gap

Minimum acceptance path: signup → generated playbook → completed practice → save → refresh → sign out/in → resume.

Also exercise provider failure, interrupted generation, failed saves, account switching and share/unshare. Cover supported browsers, small screens and keyboard navigation. Unit tests and fixture checks cannot establish these live outcomes.

### 7. Validate advice quality — explicitly unfinished

`../grip-ai-api/docs/grading-calibration.md` says “prepared, not calibrated.” Evidence quotations and deterministic scoring are useful safeguards, but they do not prove that judgments are correct or useful. Complete human-reviewed calibration across supported languages and answer lengths, and sample generated playbooks for relevance and accuracy. Keep scores framed as practice feedback.

### 8. Measure value and return — product validation gap

Vercel Analytics is integrated, but no custom activation funnel was found in inspected frontend code. Measure generation success, first completed practice, successful save/resume and return practice without recording CV/story contents. Observe target users completing these tasks without guidance. This is a product validation need, not a reproduced usability defect.

## Journey and evidence coverage

| Stage | Current source-backed capability | Remaining acceptance |
| --- | --- | --- |
| Arrival and account | Email/password, GitHub and guest entry | Email delivery, recovery, redirects, understandable promise |
| Setup and first value | Personalized playbook and preparation profile | Live generation, useful outputs, interruption/retry |
| Practice | Prep, Stories and Arch Board | Comprehension, keyboard/small-screen completion, feedback quality |
| Save and return | Persisted preparation and practice records | Failed saves, refresh/resume, account isolation |
| Hiring workflow | Quest, due dates and analytics | Real-service behavior and clear expectations for reminders |
| Exit and trust | Individual deletion and score reset | Full export, account deletion, accurate disclosures and support |

Value, intuition, flow, feedback, trust and completion were assessed from source, not observed user behavior. Inclusive use, perceived responsiveness and live end-to-end completion remain untested in this review.

## Preserve and defer

Preserve generated playbooks as the first-run outcome, explicit generation failure/retry, separate diagram/reasoning assessment, evidence-backed grading and reviewed imports. These are substantial foundations.

Defer more features, additional question volume and native-mobile expansion. Notifications can wait if the product clearly offers an in-app agenda: `../grip-pipeline-service/src/main/java/com/grip/pipeline/notify/ReminderNotifier.java` logs due items but does not deliver reminders.

## Verification recorded on 2026-11-09

- `pnpm run ci`: lint and ESLint-rule test passed; execution stopped at the sandbox Watchman socket restriction.
- `pnpm --filter @grip/core exec jest --runInBand --watchman=false`: 502 tests passed.
- `pnpm --filter mobile exec jest --runInBand --watchman=false`: 23 tests passed.
- `pnpm --filter web test`: 89 tests passed.
- `pnpm typecheck` and `pnpm build`: passed. Build retains a large-bundle warning; this is not a measured user-facing performance defect.
- In grip-ai-api, `.venv/bin/python -m pytest -q`: 202 passed, 7 skipped. Local interpreter was Python 3.14; CI targets Python 3.11.
- No product files changed during the review. Production settings, live AI, Java tests, native devices and browser journeys were not verified. Public URL access through the web tool failed; that does not establish a product outage.

## Launch order

Account recovery and data controls → AI limits and monitoring → database/recovery verification → real-service acceptance → controlled beta and quality calibration. A public launch also needs the quality and user-validation evidence above; passing unit tests alone is insufficient.
