# TRUEX v1 — RELEASE NOTES (NO DRIFT)

Release date: 2026-01-28  
Operator root: C:\TRUEX

## WHAT TRUEX v1 IS
TRUEX v1 is a deterministic, contract-driven “proof-first” publishing pipeline for multi-sport lanes:

- MLB
- NBA
- NHL
- NFL

It produces:
- normalized artifacts
- publish-ready HTML indexes
- receipts + SHA manifests
- post-push remote verification

Everything is run via fail-fast, full-swap runners with auditable outputs.

## WHAT TRUEX v1 IS NOT
v1 is not:
- a model research lab
- a UI redesign project
- a scraping experiment platform
- an “accuracy improvement” treadmill

Truth pipelines are frozen once shipped.

## SHIPPED (DONE)
### Core Operating System (Phases 0–17)
- Full-swap discipline
- Deterministic runners
- Locks + receipts + SHA manifests
- Quarantine allowlist gate (PHASE23.1)
- Scheduled daily orchestrator operational:
  - C:\TRUEX\engines\scheduled\RUN_TRUEX_SCHEDULED_DAILY_v1.ps1

### Public Site Front Door (Finish Item B)
- Root landing page authored in:
  - C:\TRUEX\site\public\latest\index.html
- Mirrored into deploy worktree:
  - C:\TRUEX\deploy\public_site_latest\index.html
- Links to /mlb/ /nba/ /nhl/ /nfl/

### Monitoring Summary JSON (Finish Item C)
- Every run writes:
  - C:\TRUEX\output\monitoring\LATEST_RUN_SUMMARY.json
- Derived only from exit codes + receipt/SHA existence (including SKIP receipts)
- No log parsing heuristics

### Lanes Shipped
- MLB lane shipped (publish/deploy/push/verify stable)
- NBA lane shipped (scheduled ingest + publish/deploy/push/verify stable)
- NHL lane shipped (scheduled ingest supports SKIP days cleanly; publish/deploy/push/verify stable)
- NFL lane shipped (Phase24):
  - scheduled ingest → normalize → route → publish → push → post-push remote verify
  - Remote Pages verified and live

## NO-DRIFT RULES (LOCKED)
After v1 release:
Allowed changes only:
- security fixes
- bug fixes that break determinism/contracts
- adding new lanes behind new phases (no retrofitting shipped phases)

Not allowed in v1:
- new models / edge logic
- feature experiments
- UI redesign
- auto-scraping new sources
- adding sports beyond MLB/NBA/NHL/NFL
- “improve accuracy” loops

## OPERATOR ACCEPTANCE TESTS (v1)
1) One-button run works:
   - RUN_TRUEX_SCHEDULED_DAILY_v1.ps1 exits 0 on success
2) Deploy and remote verify pass for enabled lanes
3) LATEST_RUN_SUMMARY.json exists, parses, matches exit code
4) gh-pages worktree clean and HEAD==origin/gh-pages after push

## TAGGING / FREEZE
Tag the public repo:
- Tag: 	ruex-v1.0.0
- Commit: (fill after tagging)

Engine freeze (since engine root is not in git):
- Engine freeze manifest: C:\TRUEX\output\monitoring\ENGINE_FREEZE_TRUEX_v1_20260128_SHA256.txt

## v2+ (EXPLICITLY OUT OF SCOPE FOR v1)
- New sports beyond current four
- Any “accuracy improvements”
- Any changes to truth pipelines without new phases
- New UI frameworks / replatforming
- Auto-scraping data sources

v1 is finished when it runs deterministically and publishes proof without manual intervention.