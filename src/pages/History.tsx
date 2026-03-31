import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, RotateCcw, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useJobsContext } from "@/context/JobsContext";
import { backendRoutes } from "@/lib/backend_routes";
import { useAvailableTools } from "@/hooks/useTools";
import { getToolLabel, type Job, type JobStatus } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-muted text-muted-foreground border-transparent" },
  processing: { label: "Processing", className: "bg-primary/10 text-primary border-transparent" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-transparent" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-transparent" },
};

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

const History = () => {
  const { restartJob } = useJobsContext();
  const { data: tools = [] } = useAvailableTools();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (toolFilter !== "all") params.set("tool_name", toolFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const response = await fetch(`${backendRoutes.jobs.list}?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      const payload = (await response.json()) as ApiJobsListResponse;
      setJobs(
        (payload.results || []).map((job) => ({
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
      setTotal(Number(payload.total || 0));
      setTotalPages(Math.max(1, Number(payload.total_pages || 1)));
      setPage(Number(payload.page || 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, page, pageSize, search, statusFilter, toolFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, toolFilter, dateFrom, dateTo, pageSize]);

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

  const formatDuration = (seconds?: number) => {
    const s = Math.max(0, Number(seconds || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  };

  const handleDownload = (downloadUrl?: string) => {
    if (!downloadUrl) {
      toast.error("No output file link is available for this job.");
      return;
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
    toast.success("Download started.");
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

        <div className="flex flex-wrap items-center gap-3">
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
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[165px]"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[165px]"
          />
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            No jobs match your filters.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>File Name</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead className="w-[160px]">Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const sc = statusConfig[job.status];
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium text-foreground">{job.fileName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getToolLabel(job.toolType)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(job.startTime, "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(job.processingTimeSeconds)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.totalRows.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {Math.round(job.progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {job.status === "error" && (
                            <Button variant="ghost" size="icon" onClick={() => restartJob(job.id)}>
                              <RotateCcw className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {job.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(job.downloadUrl)}
                            >
                              <Download className="h-4 w-4 text-success" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
