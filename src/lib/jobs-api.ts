import { backendRoutes } from "@/lib/backend_routes";
import { fetchJson } from "@/lib/api-client";
import type { Job, JobStatus } from "@/hooks/useJobs";

export interface ApiJob {
  id: string;
  toolName: string;
  sourceName: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  statusCounts?: Record<string, number>;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  processingTimeSeconds?: number;
}

export interface ApiJobsListResponse {
  results: ApiJob[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListJobsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  toolName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function mapApiJobToJob(job: ApiJob): Job {
  return {
    id: job.id,
    fileName: job.sourceName,
    toolType: job.toolName,
    startTime: new Date(job.createdAt),
    progress: job.progress,
    status: job.status,
    totalRows: job.totalRows,
    statusCounts: job.statusCounts || {},
    downloadUrl: job.downloadUrl,
    errorMessage: job.errorMessage,
    processingTimeSeconds: job.processingTimeSeconds || 0,
  };
}

export async function listJobs(params: ListJobsParams): Promise<ApiJobsListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.toolName && params.toolName !== "all") query.set("tool_name", params.toolName);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);

  return fetchJson<ApiJobsListResponse>(`${backendRoutes.jobs.list}?${query.toString()}`);
}
