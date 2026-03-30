# Data Pipeline Web

React dashboard for starting processing jobs and downloading results.

## Current Scope

- Upload `.xlsx` file for **Data Validation** tool.
- Sends request to unified backend endpoint: `POST /api/tools/process`
  with `tool_name` + payload.
- Tracks job status in UI (`processing`, `completed`, `error`).
- Downloads processed output workbook from backend response URL.

## Setup

```bash
cd repos/data-pipeline-web
npm install
npm run dev
```

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
