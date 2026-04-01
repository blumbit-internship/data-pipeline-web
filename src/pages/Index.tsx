import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadPanel } from "@/components/FileUploadPanel";
import { JobTable } from "@/components/JobTable";
import { useJobsContext } from "@/context/JobsContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Activity, CheckCircle2, AlertCircle, FileUp, Filter, Search } from "lucide-react";
import { backendRoutes } from "@/lib/backend_routes";
import { useAvailableTools } from "@/hooks/useTools";
import type { Job, JobStatus, StartJobInput } from "@/hooks/useJobs";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
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
  const [tableJobs, setTableJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const processing = jobs.filter((j) => j.status === "processing").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const errors = jobs.filter((j) => j.status === "error").length;

  interface ApiJob {
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

  interface ApiJobsListResponse {
    results: ApiJob[];
    total: number;
    page: number;
    total_pages: number;
  }

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (toolFilter !== "all") params.set("tool_name", toolFilter);

      const response = await fetch(`${backendRoutes.jobs.list}?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);

      const payload = (await response.json()) as ApiJobsListResponse;
      setTableJobs(
        (payload.results || []).map((job) => ({
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
        })),
      );
      setTotal(Number(payload.total || 0));
      setTotalPages(Math.max(1, Number(payload.total_pages || 1)));
      setPage(Number(payload.page || 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard jobs.");
    } finally {
      setIsLoadingJobs(false);
    }
  }, [page, pageSize, search, statusFilter, toolFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, toolFilter, pageSize]);

  const handleStartJob = async (input: StartJobInput) => {
    await addJob(input);
    await loadJobs();
  };

  const handleDeleteJob = async (id: string) => {
    const previousRows = tableJobs;
    setTableJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    try {
      await deleteJob(id);
      await loadJobs();
    } catch (error) {
      setTableJobs(previousRows);
      setTotal((prev) => prev + 1);
      toast.error(error instanceof Error ? error.message : "Failed to delete job.");
    }
  };

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push(-1);
    for (let p = start; p <= end; p += 1) pages.push(p);
    if (end < totalPages - 1) pages.push(-2);
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

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
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={toolFilter} onValueChange={setToolFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Tools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tools</SelectItem>
                {tools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.name}>
                    {tool.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoadingJobs ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading jobs...
            </div>
          ) : (
            <>
              <JobTable jobs={tableJobs} onStop={stopJob} onRestart={restartJob} onDelete={handleDeleteJob} />
              <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing page {page} of {totalPages} ({total.toLocaleString()} jobs)
                </p>
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {paginationItems.map((item, idx) => (
                      <PaginationItem key={`${item}-${idx}`}>
                        {item < 0 ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={item === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
