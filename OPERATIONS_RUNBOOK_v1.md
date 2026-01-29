# TRUEX v1 — OPERATIONS RUNBOOK (NO DRIFT)

## PRIME DIRECTIVE (NON-NEGOTIABLE)
TRUEX is a deterministic proof pipeline.

Once a lane is shipped, the **engine logic/contracts are frozen**.
Allowed changes after v1 ship:
- security fixes
- bug fixes that break determinism/contracts
- adding new lanes behind new phases (no retrofitting old phases)

NOT allowed in v1:
- “improve accuracy” loops
- new models / edge logic
- UI redesigns
- auto-scraping experiments
- adding new sports beyond MLB/NBA/NHL/NFL

Truth pipelines are frozen once shipped. Execution ≠ truth.

---

## REPO / FOLDERS (CANON)
Root:
- `C:\TRUEX`

Key directories:
- `C:\TRUEX\site\public\latest` (site build output / authored root index)
- `C:\TRUEX\deploy\public_site_latest` (gh-pages worktree / deploy mirror output)
- `C:\TRUEX\output\...` (all receipts, SHA manifests, run artifacts)
- `C:\TRUEX\output\monitoring` (monitoring anchors + run summary JSON)

Config:
- `C:\TRUEX\config\truex_config.json`
  - `remote_url`
  - `sports_enabled` (list or comma string)

---

## ONE-BUTTON DAILY COMMAND (THE ONLY OPERATOR ENTRYPOINT)
Run the scheduled daily orchestrator:

```powershell
$Root="C:\TRUEX"
& "$Root\engines\scheduled\RUN_TRUEX_SCHEDULED_DAILY_v1.ps1" -Root $Root
"EXIT=$LASTEXITCODE"
