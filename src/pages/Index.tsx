import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadPanel } from "@/components/FileUploadPanel";
import { JobTable } from "@/components/JobTable";
import { useJobsContext } from "@/context/JobsContext";
import { Activity, CheckCircle2, AlertCircle, FileUp } from "lucide-react";

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
  const { jobs, addJob, stopJob, restartJob } = useJobsContext();

  const processing = jobs.filter((j) => j.status === "processing").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const errors = jobs.filter((j) => j.status === "error").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileUp} label="Total Jobs" value={jobs.length} color="bg-primary/10 text-primary" />
          <StatCard icon={Activity} label="Processing" value={processing} color="bg-warning/10 text-warning" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} color="bg-success/10 text-success" />
          <StatCard icon={AlertCircle} label="Errors" value={errors} color="bg-destructive/10 text-destructive" />
        </div>
        <FileUploadPanel onStartJob={addJob} />
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Active Queues</h2>
          <JobTable jobs={jobs} onStop={stopJob} onRestart={restartJob} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
