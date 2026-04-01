# Data Pipeline Web

React + TypeScript control panel for running, monitoring, and retrying internship data tools.

## Implemented Scope (current)

- Dynamic tool loading from backend (`GET /api/tools/available`).
- Tool Settings page with CRUD and per-tool config editing.
- New Job panel with provider override selection per run.
- Dashboard + History job tables with:
  - details navigation
  - stop/cancel
  - retry/resume
  - delete (output-only semantics from backend)
  - download
- Dedicated Job Details page with:
  - live progress + status breakdown
  - run context metadata (resume/retry info)
  - provider health check panel
  - output preview tab (filter + search + pagination)
  - retry failed rows controls (provider + retry scope)
- Optimistic delete behavior and periodic polling refresh.

## Setup

```bash
cd repos/data-pipeline-web
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

App URL: `http://127.0.0.1:5173`

## Docker

```bash
cd repos/data-pipeline-web
docker compose up --build
```

## Environment

Optional `.env`:

```bash
VITE_API_URL=http://127.0.0.1:8000/api
```

If unset, frontend defaults to `http://127.0.0.1:8000/api`.

## Phone vs Email Provider UX

The UI behavior is unified (same pages/controls), while provider lists are tool-specific:

- **Email scraper providers**: `apollo`, `hunter`, `rocketreach`, `coresignal`, `brightdata`, `scrapegraph`, `serper`, `native`
- **Phone scraper providers**: `native`, `serper`, `scrapegraph`, `apollo`, `rocketreach`, `brave`, `google_places`

## Job Details UX Notes

- During active processing, resume/retry controls are visible but disabled.
- Output Preview tab is disabled until run completion.
- Retry flow creates a new run and navigates to the new job page when started.

## Build

```bash
npm run build
```
