import { useCallback, useEffect, useState } from "react";
import { backendRoutes } from "@/lib/backend_routes";

export type JobStatus = "new" | "processing" | "completed" | "error";
export type ToolType = string;

export interface StartJobInput {
  file: File | null;
  sheetsUrl: string;
  toolType: ToolType;
}

export interface Job {
  id: string;
  fileName: string;
  toolType: ToolType;
  startTime: Date;
  progress: number;
  status: JobStatus;
  totalRows: number;
  downloadUrl?: string;
  errorMessage?: string;
  processingTimeSeconds?: number;
}

const TOOL_LABELS: Record<ToolType, string> = {
  "data-validation": "Data Validation",
  "phone-scraper": "Phone Scraper",
  "email-scraper": "Email Scraper",
};

export const getToolLabel = (t: ToolType) =>
  TOOL_LABELS[t] || t.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

interface ApiJob {
  id: string;
  toolName: string;
  sourceName: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  processingTimeSeconds?: number;
}

interface ApiJobsListResponse {
  results: ApiJob[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "200",
      });
      const response = await fetch(`${backendRoutes.jobs.list}?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as ApiJobsListResponse | ApiJob[];
      const items = Array.isArray(payload) ? payload : payload.results || [];
      setJobs(
        items.map((job) => ({
          id: job.id,
          fileName: job.sourceName,
          toolType: job.toolName,
          startTime: new Date(job.createdAt),
          progress: job.progress,
          status: job.status,
          totalRows: job.totalRows,
          downloadUrl: job.downloadUrl,
          errorMessage: job.errorMessage,
          processingTimeSeconds: job.processingTimeSeconds || 0,
        })),
      );
    } catch {
      // silent fallback: keep local state
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const addJob = useCallback(async ({ file, sheetsUrl, toolType }: StartJobInput) => {
    const fileName = file?.name || sheetsUrl || "Untitled";
    const newJob: Job = {
      id: crypto.randomUUID(),
      fileName,
      toolType,
      startTime: new Date(),
      progress: 10,
      status: "processing",
      totalRows: 0,
    };
    setJobs((prev) => [newJob, ...prev]);

    if (!file && !sheetsUrl) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? {
                ...j,
                status: "error",
                progress: 0,
                errorMessage: "Please upload a file or provide a Google Sheets URL.",
              }
            : j,
        ),
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tool_name", toolType);
      if (file) formData.append("file", file);
      if (sheetsUrl) formData.append("sheets_url", sheetsUrl);

      const response = await fetch(backendRoutes.tools.process, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || `Failed with status ${response.status}`);
      }

      await loadJobs();
    } catch (error) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? {
                ...j,
                status: "error",
                progress: 0,
                errorMessage:
                  error instanceof Error ? error.message : "Failed to process file.",
                processingTimeSeconds: 0,
              }
            : j,
        ),
      );
      await loadJobs();
    }
  }, [loadJobs]);

  const stopJob = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id && j.status === "processing"
          ? { ...j, status: "error", errorMessage: "Stopped manually." }
          : j,
      ),
    );
  }, []);

  const restartJob = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "error",
              progress: 0,
              errorMessage: "Re-upload the file to retry.",
            }
          : j,
      ),
    );
  }, []);

  return { jobs, addJob, stopJob, restartJob, reloadJobs: loadJobs };
}
