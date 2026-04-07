import { useCallback, useEffect, useState } from "react";
import { listJobs, mapApiJobToJob } from "@/lib/jobs-api";
import type { Job } from "@/hooks/useJobs";

interface UseJobsListDataParams {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  toolFilter: string;
  dateFrom?: string;
  dateTo?: string;
  onPageSync?: (page: number) => void;
  onError?: (message: string) => void;
}

export function useJobsListData(params: UseJobsListDataParams) {
  const {
    page,
    pageSize,
    search,
    statusFilter,
    toolFilter,
    dateFrom,
    dateTo,
    onPageSync,
    onError,
  } = params;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await listJobs({
        page,
        pageSize,
        search,
        status: statusFilter,
        toolName: toolFilter,
        dateFrom,
        dateTo,
      });

      setJobs((payload.results || []).map(mapApiJobToJob));
      setTotal(Number(payload.total || 0));
      setTotalPages(Math.max(1, Number(payload.total_pages || 1)));
      if (onPageSync) {
        onPageSync(Number(payload.page || 1));
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : "Failed to load jobs.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, toolFilter, dateFrom, dateTo, onPageSync, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { jobs, setJobs, isLoading, total, setTotal, totalPages, reload };
}
