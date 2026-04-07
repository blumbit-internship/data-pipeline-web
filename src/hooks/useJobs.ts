import { useCallback, useEffect, useState } from "react";
import { backendRoutes } from "@/lib/backend_routes";
import { fetchJson } from "@/lib/api-client";
import { listJobs, mapApiJobToJob } from "@/lib/jobs-api";

export type JobStatus = "new" | "processing" | "completed" | "error" | "cancelled";
export type ToolType = string;

export interface StartJobInput {
  file: File | null;
  sheetsUrl: string;
  toolType: ToolType;
  selectedProvider?: string;
  nativeMode?: string;
  nativeFetchMode?: string;
  advancedAiSearchEngine?: string;
}

export interface Job {
  id: string;
  fileName: string;
  toolType: ToolType;
  startTime: Date;
  progress: number;
  status: JobStatus;
  totalRows: number;
  statusCounts?: Record<string, number>;
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

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = useCallback(async () => {
    try {
      const payload = await listJobs({ page: 1, pageSize: 200 });
      setJobs((payload.results || []).map(mapApiJobToJob));
    } catch {
      // silent fallback: keep local state
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadJobs();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [loadJobs]);

  const addJob = useCallback(async ({ file, sheetsUrl, toolType, selectedProvider, nativeMode, nativeFetchMode, advancedAiSearchEngine }: StartJobInput) => {
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
      if (selectedProvider && selectedProvider !== "tool_default") {
        formData.append("selected_provider", selectedProvider);
      }
      if (nativeMode && nativeMode !== "tool_default") {
        formData.append("native_mode", nativeMode);
      }
      if (nativeFetchMode && nativeFetchMode !== "tool_default") {
        formData.append("native_fetch_mode", nativeFetchMode);
      }
      if (advancedAiSearchEngine && advancedAiSearchEngine !== "tool_default") {
        formData.append("advanced_ai_search_engine", advancedAiSearchEngine);
      }

      await fetchJson(backendRoutes.tools.process, {
        method: "POST",
        body: formData,
      });

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

  const stopJob = useCallback(async (id: string) => {
    try {
      const response = await fetch(backendRoutes.jobs.cancel(id), { method: "POST" });
      if (!response.ok) {
        throw new Error(`Failed to cancel job (${response.status})`);
      }
      await loadJobs();
    } catch (error) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id && j.status === "processing"
            ? {
                ...j,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Failed to cancel job.",
              }
            : j,
        ),
      );
    }
  }, [loadJobs]);

  const restartJob = useCallback(async (
    id: string,
    opts?: { retryFailedOnly?: boolean; selectedProvider?: string; retryStatusBuckets?: string[] },
  ) => {
    const payload: Record<string, unknown> = {};
    if (opts?.retryFailedOnly) payload.retry_failed_only = true;
    if (opts?.selectedProvider) payload.selected_provider = opts.selectedProvider;
    if (opts?.retryStatusBuckets && opts.retryStatusBuckets.length > 0) {
      payload.retry_status_buckets = opts.retryStatusBuckets;
    }
    await fetchJson(backendRoutes.jobs.resume(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadJobs();
  }, [loadJobs]);

  const deleteJob = useCallback(async (id: string) => {
    const previous = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await fetchJson(backendRoutes.jobs.delete(id), { method: "DELETE" });
    } catch (error) {
      setJobs(previous);
      throw error instanceof Error ? error : new Error("Failed to delete job.");
    }
    await loadJobs();
  }, [jobs, loadJobs]);

  return { jobs, addJob, stopJob, restartJob, deleteJob, reloadJobs: loadJobs };
}
