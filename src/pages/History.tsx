import { useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsListFilters } from "@/components/JobsListFilters";
import { JobsListPagination } from "@/components/JobsListPagination";
import { useJobsContext } from "@/context/JobsContext";
import { useJobsListData } from "@/hooks/useJobsListData";
import { useJobsListState } from "@/hooks/useJobsListState";
import { useAvailableTools } from "@/hooks/useTools";
import { toast } from "sonner";
import { JobTable } from "@/components/JobTable";

const History = () => {
  const { restartJob, stopJob, deleteJob } = useJobsContext();
  const { data: tools = [] } = useAvailableTools();
  const {
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    toolFilter,
    setToolFilter,
    dateFrom = "",
    setDateFrom,
    dateTo = "",
    setDateTo,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useJobsListState({ includeDateRange: true });
  const handleListError = useCallback((message: string) => {
    toast.error(message || "Failed to load jobs.");
  }, []);
  const { jobs, setJobs, isLoading, total, setTotal, totalPages, reload } = useJobsListData({
    page,
    pageSize,
    search: debouncedSearch,
    statusFilter,
    toolFilter,
    dateFrom,
    dateTo,
    onPageSync: setPage,
    onError: handleListError,
  });

  const handleDeleteJob = async (id: string) => {
    const previousRows = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    try {
      await deleteJob(id);
      await reload();
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
