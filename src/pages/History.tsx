import { useState } from "react";
import { format } from "date-fns";
import { Download, RotateCcw, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useJobsContext } from "@/context/JobsContext";
import { getToolLabel, type JobStatus } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-muted text-muted-foreground border-transparent" },
  processing: { label: "Processing", className: "bg-primary/10 text-primary border-transparent" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-transparent" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-transparent" },
};

const History = () => {
  const { jobs, restartJob } = useJobsContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDownload = (downloadUrl?: string) => {
    if (!downloadUrl) {
      toast.error("No output file link is available for this job.");
      return;
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
    toast.success("Download started.");
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-6xl">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Job History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all past and current processing jobs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
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
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            {jobs.length === 0 ? "No jobs yet." : "No jobs match your filters."}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>File Name</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead className="w-[160px]">Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => {
                  const sc = statusConfig[job.status];
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-foreground">{job.fileName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getToolLabel(job.toolType)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(job.startTime, "MMM d, HH:mm")}
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
