import { format } from "date-fns";
import { Download, StopCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Job, JobStatus } from "@/hooks/useJobs";
import { getToolLabel } from "@/hooks/useJobs";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-muted text-muted-foreground border-transparent" },
  processing: { label: "Processing", className: "bg-primary/10 text-primary border-transparent" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-transparent" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-transparent" },
};

interface JobTableProps {
  jobs: Job[];
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
}

export function JobTable({ jobs, onStop, onRestart }: JobTableProps) {
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

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
        No jobs yet. Upload a file to get started.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Project / File</TableHead>
            <TableHead className="w-[140px]">Tool</TableHead>
            <TableHead className="w-[140px]">Started</TableHead>
            <TableHead className="w-[120px]">Duration</TableHead>
            <TableHead className="w-[180px]">Progress</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const sc = statusConfig[job.status];
            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium text-foreground truncate max-w-[200px]">
                  {job.fileName}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {getToolLabel(job.toolType)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(job.startTime, "MMM d, HH:mm")}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDuration(job.processingTimeSeconds)}
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
                  <Badge variant="outline" className={sc.className}>
                    {sc.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {job.status === "processing" && (
                      <Button variant="ghost" size="icon" onClick={() => onStop(job.id)} title="Stop">
                        <StopCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {job.status === "error" && (
                      <Button variant="ghost" size="icon" onClick={() => onRestart(job.id)} title="Restart">
                        <RotateCcw className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    {job.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Download"
                        onClick={() => handleDownload(job.downloadUrl)}
                      >
                        <Download className="h-4 w-4 text-success" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
