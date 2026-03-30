import { useCallback, useState } from "react";
import { backendRoutes } from "@/lib/backend_routes";

export type JobStatus = "new" | "processing" | "completed" | "error";
export type ToolType = "data-validation" | "phone-scraper" | "email-scraper";

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
}

const TOOL_LABELS: Record<ToolType, string> = {
  "data-validation": "Data Validation",
  "phone-scraper": "Phone Scraper",
  "email-scraper": "Email Scraper",
};

export const getToolLabel = (t: ToolType) => TOOL_LABELS[t];

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

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

    if (toolType !== "data-validation") {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? {
                ...j,
                status: "error",
                progress: 0,
                errorMessage: "Only Data Validation is connected in v1.",
              }
            : j,
        ),
      );
      return;
    }

    if (!file) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? {
                ...j,
                status: "error",
                progress: 0,
                errorMessage: "Please upload an .xlsx file for Data Validation.",
              }
            : j,
        ),
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(backendRoutes.tasks.task1.process, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || `Failed with status ${response.status}`);
      }

      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? {
                ...j,
                status: "completed",
                progress: 100,
                totalRows: Number(payload?.total_rows || 0),
                downloadUrl: payload?.download_url || payload?.output_path,
                errorMessage: undefined,
              }
            : j,
        ),
      );
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
              }
            : j,
        ),
      );
    }
  }, []);

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

  return { jobs, addJob, stopJob, restartJob };
}
