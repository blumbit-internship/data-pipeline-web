import { useCallback, type ElementType } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadPanel } from "@/components/FileUploadPanel";
import { JobTable } from "@/components/JobTable";
import { JobsListFilters } from "@/components/JobsListFilters";
import { JobsListPagination } from "@/components/JobsListPagination";
import { useJobsContext } from "@/context/JobsContext";
import { Activity, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { useJobsListData } from "@/hooks/useJobsListData";
import { useJobsListState } from "@/hooks/useJobsListState";
import { useAvailableTools } from "@/hooks/useTools";
import type { StartJobInput } from "@/hooks/useJobs";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, color }: { icon: ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const Index = () => {
  const { jobs, addJob, stopJob, restartJob, deleteJob } = useJobsContext();
  const { data: tools = [] } = useAvailableTools();
  const {
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    toolFilter,
    setToolFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useJobsListState();
  const handleListError = useCallback((message: string) => {
    toast.error(message || "Failed to load dashboard jobs.");
  }, []);
  const { jobs: tableJobs, setJobs: setTableJobs, isLoading: isLoadingJobs, total, setTotal, totalPages, reload } =
    useJobsListData({
      page,
      pageSize,
      search: debouncedSearch,
      statusFilter,
      toolFilter,
      onPageSync: setPage,
      onError: handleListError,
    });

  const processing = jobs.filter((j) => j.status === "processing").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const errors = jobs.filter((j) => j.status === "error").length;

  const handleStartJob = async (input: StartJobInput) => {
    await addJob(input);
    await reload();
  };

  const handleDeleteJob = async (id: string) => {
    const previousRows = tableJobs;
    setTableJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    try {
      await deleteJob(id);
      await reload();
    } catch (error) {
      setTableJobs(previousRows);
      setTotal((prev) => prev + 1);
      toast.error(error instanceof Error ? error.message : "Failed to delete job.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileUp} label="Total Jobs" value={jobs.length} color="bg-primary/10 text-primary" />
          <StatCard icon={Activity} label="Processing" value={processing} color="bg-warning/10 text-warning" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} color="bg-success/10 text-success" />
          <StatCard icon={AlertCircle} label="Errors" value={errors} color="bg-destructive/10 text-destructive" />
        </div>
        <FileUploadPanel onStartJob={handleStartJob} />
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Active Queues</h2>
          <div className="mb-3">
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
            />
          </div>
          {isLoadingJobs ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading jobs...
            </div>
          ) : (
            <>
              <JobTable jobs={tableJobs} onStop={stopJob} onRestart={restartJob} onDelete={handleDeleteJob} />
              <div className="mt-3">
                <JobsListPagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
