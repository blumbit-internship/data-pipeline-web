# Data Pipeline Web

React dashboard for starting processing jobs and downloading results.

## Current Scope

- Tool dropdown is loaded dynamically from backend: `GET /api/tools/available`.
- Tools are managed from frontend settings page via CRUD endpoints.
- Phone scraper method is configurable in Tool Settings (`native` / `serper` / `scrapegraph`).
- Email scraper method is configurable in Tool Settings (`native` / `serper`).
- Tool config is stored per-tool in DB (`Tool.config`), so changing one tool does not change another.
- Sends processing request to unified endpoint: `POST /api/tools/process`
  with `tool_name` + payload.
- Tracks job status in UI (`processing`, `completed`, `error`).
- Downloads processed output workbook from backend response URL.

## Setup

```bash
cd repos/data-pipeline-web
npm install
npm run dev
```

## Docker

```bash
cd repos/data-pipeline-web
docker compose up --build
```

Frontend will be available at `http://127.0.0.1:5173`.

## Environment

Optional `.env`:

```bash
VITE_API_URL=http://127.0.0.1:8000/api
```

If not set, frontend falls back to `http://127.0.0.1:8000/api`.

## Build

```bash
npm run build
```

## GitHub Pages Deployment

This repo includes `.github/workflows/pages.yml` for automatic GitHub Pages deploy on `main`.

Setup once in GitHub:

1. In repository settings, go to **Pages** and set source to **GitHub Actions**.
2. (Recommended) In **Settings -> Secrets and variables -> Actions -> Variables**, add:
   - `VITE_API_URL` = your backend API URL (for example `https://data-pipeline-api.vercel.app/api`)
3. Push to `main` (or run the workflow manually) to publish.

Notes:

- `VITE_BASE_PATH` is set automatically in workflow to `/<repo-name>/` for Pages asset paths.
- SPA fallback is handled by publishing `404.html` as a copy of `index.html`.
