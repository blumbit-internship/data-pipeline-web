import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsListFilters } from "@/components/JobsListFilters";
import { JobsListPagination } from "@/components/JobsListPagination";
import { useJobsContext } from "@/context/JobsContext";
import { useAvailableTools } from "@/hooks/useTools";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type Job } from "@/hooks/useJobs";
import { toast } from "sonner";
import { JobTable } from "@/components/JobTable";
import { listJobs, mapApiJobToJob } from "@/lib/jobs-api";

const History = () => {
  const { restartJob, stopJob, deleteJob } = useJobsContext();
  const { data: tools = [] } = useAvailableTools();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await listJobs({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        toolName: toolFilter,
        dateFrom,
        dateTo,
      });
      setJobs((payload.results || []).map(mapApiJobToJob));
      setTotal(Number(payload.total || 0));
      setTotalPages(Math.max(1, Number(payload.total_pages || 1)));
      setPage(Number(payload.page || 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, page, pageSize, debouncedSearch, statusFilter, toolFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, toolFilter, dateFrom, dateTo, pageSize]);

  const handleDeleteJob = async (id: string) => {
    const previousRows = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    try {
      await deleteJob(id);
      await loadJobs();
    } catch (error) {
      setJobs(previousRows);
      setTotal((prev) => prev + 1);
      toast.error(error instanceof Error ? error.message : "Failed to delete job.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-6xl">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Job History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all past and current processing jobs.
          </p>
        </div>

        <div>
          <JobsListFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            toolFilter={toolFilter}
            onToolFilterChange={setToolFilter}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            tools={tools}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            Loading jobs...
          </div>
        ) : (
          <div className="space-y-3">
            <JobTable
              jobs={jobs}
              onStop={stopJob}
              onRestart={restartJob}
              onDelete={handleDeleteJob}
              showRowsColumn
              emptyMessage="No jobs match your filters."
            />

            <JobsListPagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
