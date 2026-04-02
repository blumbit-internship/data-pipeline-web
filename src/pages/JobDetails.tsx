import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { backendRoutes } from "@/lib/backend_routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type JobStatus = "new" | "processing" | "completed" | "error" | "cancelled";

interface JobDetailResponse {
  id: string;
  toolName: string;
  sourceName: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  statusCounts: Record<string, number>;
  runMetadata?: Record<string, unknown>;
  errorMessage?: string;
  inputFile?: string;
  outputFile?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  processingTimeSeconds?: number;
}

interface OutputPreviewResponse {
  headers: string[];
  results: Array<{
    excel_row: number;
    status: string;
    values: Record<string, unknown>;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface ProviderHealthResponse {
  tool_name: string;
  overall_status: string;
  checked_at: string;
  results: Array<{
    provider: string;
    status: string;
    message: string;
  }>;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-muted text-muted-foreground border-transparent" },
  processing: { label: "Processing", className: "bg-primary/10 text-primary border-transparent" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-transparent" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-transparent" },
  cancelled: { label: "Cancelled", className: "bg-warning/10 text-warning border-transparent" },
};

export default function JobDetails() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"resume" | "retry" | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [providerOverride, setProviderOverride] = useState("tool_default");
  const [nativeModeOverride, setNativeModeOverride] = useState("tool_default");
  const [retryScope, setRetryScope] = useState("failed_all");

  const [preview, setPreview] = useState<OutputPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewStatusFilter, setPreviewStatusFilter] = useState("all");
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [providerHealth, setProviderHealth] = useState<ProviderHealthResponse | null>(null);
  const [providerHealthLoading, setProviderHealthLoading] = useState(false);
  const actionToastId = "job-details-action-toast";

  const loadJob = async (jobId: string, opts?: { silent?: boolean; showToastOnError?: boolean }) => {
    const silent = opts?.silent ?? false;
    const showToastOnError = opts?.showToastOnError ?? true;
    if (!jobId) return;
    // Avoid blanking the page while polling an already-loaded job.
    if (!silent && !job) setLoading(true);
    try {
      const response = await fetch(backendRoutes.jobs.detail(jobId));
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      const payload = (await response.json()) as JobDetailResponse;
      setJob(payload);
    } catch (error) {
      if (showToastOnError) {
        toast.error(error instanceof Error ? error.message : "Failed to load job details.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadJob(id, { silent: false, showToastOnError: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!autoRefresh || !id) return;
    const timer = window.setInterval(() => {
      if (!job || job.status === "processing" || job.status === "new") {
        void loadJob(id, { silent: true, showToastOnError: false });
      }
    }, 3000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, id, job?.status]);

  const statusItems = useMemo(() => Object.entries(job?.statusCounts || {}), [job?.statusCounts]);
  const processedRows = useMemo(
    () => statusItems.reduce((sum, [, value]) => sum + Number(value || 0), 0),
    [statusItems],
  );
  const foundCount = useMemo(() => {
    const ok = statusItems.find(([key]) => key.trim().toLowerCase() === "ok");
    return Number(ok?.[1] || 0);
  }, [statusItems]);
  const notFoundCount = useMemo(
    () =>
      statusItems.reduce((sum, [key, value]) => {
        const normalized = key.trim().toLowerCase();
        if (normalized.startsWith("no ") && normalized.endsWith(" found")) {
          return sum + Number(value || 0);
        }
        return sum;
      }, 0),
    [statusItems],
  );
  const noUniqueCount = useMemo(() => {
    const bucket = statusItems.find(([key]) => key.trim().toLowerCase() === "no unique phone");
    return Number(bucket?.[1] || 0);
  }, [statusItems]);
  const cannotVerifyCount = useMemo(() => {
    const bucket = statusItems.find(([key]) => key.trim().toLowerCase() === "cannot verify");
    return Number(bucket?.[1] || 0);
  }, [statusItems]);
  const status = job?.status ? statusConfig[job.status] : null;
  const isJobActive = job?.status === "processing" || job?.status === "new";
  const runMetadata = (job?.runMetadata || {}) as Record<string, unknown>;
  const resumedFrom = String(
    runMetadata.resumed_from_job_id || runMetadata.original_job_id || "",
  ).trim();
  const retryFailedOnly = Boolean(runMetadata.retry_failed_only);
  const retryBuckets = Array.isArray(runMetadata.retry_status_buckets)
    ? runMetadata.retry_status_buckets.map((v) => String(v))
    : [];
  const usedProvider = String(runMetadata.selected_provider || "").trim();
  const usedNativeMode = String(runMetadata.native_mode || "").trim();
  const statusOptions = useMemo(
    () => ["all", ...statusItems.map(([key]) => key)],
    [statusItems],
  );
  const toolKind = (job?.toolName || "").toLowerCase();
  const isDataValidation = toolKind === "data-validation";
  const providerOptions = useMemo(() => {
    if (toolKind === "email-scraper") {
      return ["tool_default", "scrapegraph", "serper", "native", "apollo", "hunter", "snov", "prospeo", "anymailfinder", "voilanorbert", "getprospect", "rocketreach", "coresignal", "brightdata"];
    }
    if (toolKind === "phone-scraper") {
      return ["tool_default", "scrapegraph", "serper", "native", "apollo", "rocketreach", "brave", "google_places"];
    }
    return ["tool_default"];
  }, [toolKind]);
  const providerLabel = (provider: string) => {
    const p = (provider || "").trim().toLowerCase();
    const labels: Record<string, string> = {
      tool_default: "Tool default",
      scrapegraph: "ScrapeGraphAI",
      serper: "Serper",
      native: "Native Fetch",
      apollo: "Apollo",
      hunter: "Hunter",
      snov: "Snov.io",
      prospeo: "Prospeo",
      anymailfinder: "AnyMailFinder",
      voilanorbert: "VoilaNorbert",
      getprospect: "GetProspect",
      rocketreach: "RocketReach",
      coresignal: "Coresignal",
      brightdata: "BrightData",
      brave: "Brave Search",
      google_places: "Google Places",
    };
    return labels[p] || provider;
  };
  const retryScopeOptions = useMemo(() => {
    if (toolKind === "email-scraper") {
      return [
        { id: "failed_all", label: "All failed rows", buckets: ["no email found", "cannot verify"] },
        { id: "no_email_found", label: "Only 'no email found'", buckets: ["no email found"] },
        { id: "cannot_verify", label: "Only 'cannot verify'", buckets: ["cannot verify"] },
      ];
    }
    if (toolKind === "phone-scraper") {
      return [
        { id: "failed_all", label: "All failed rows", buckets: ["no phone found", "no unique phone", "cannot verify"] },
        { id: "no_phone_found", label: "Only 'no phone found' (recommended)", buckets: ["no phone found"] },
        { id: "no_unique_phone", label: "Only 'no unique phone'", buckets: ["no unique phone"] },
        { id: "cannot_verify", label: "Only 'cannot verify'", buckets: ["cannot verify"] },
      ];
    }
    return [{ id: "failed_all", label: "All failed rows", buckets: [] }];
  }, [toolKind]);

  useEffect(() => {
    if (toolKind === "phone-scraper") {
      setRetryScope("no_phone_found");
      return;
    }
    if (toolKind === "email-scraper") {
      setRetryScope("no_email_found");
      return;
    }
    setRetryScope("failed_all");
  }, [toolKind]);

  const triggerResume = async (retryFailedOnly: boolean) => {
    if (!id) return;
    setActionLoading(true);
    setActionType(retryFailedOnly ? "retry" : "resume");
    toast.dismiss(actionToastId);
    const loadingToastId = toast.loading(
      retryFailedOnly ? "Starting retry job..." : "Starting resume job...",
      { id: actionToastId },
    );
    try {
      const payload: Record<string, unknown> = {
        retry_failed_only: retryFailedOnly,
      };
      if (providerOverride !== "tool_default") payload.selected_provider = providerOverride;
      if (nativeModeOverride !== "tool_default") payload.native_mode = nativeModeOverride;
      if (retryFailedOnly) {
        const selectedScope = retryScopeOptions.find((opt) => opt.id === retryScope);
        if (selectedScope && selectedScope.buckets.length > 0) {
          payload.retry_status_buckets = selectedScope.buckets;
        }
      }
      const response = await fetch(backendRoutes.jobs.resume(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || `Failed with status ${response.status}`);
      }
      // Replace loading toast with a short status message and auto-dismiss.
      toast.dismiss(loadingToastId);
      toast.success(retryFailedOnly ? "Retry job is running." : "Resume job is running.", { duration: 2500 });
      const newJobId = body?.job?.id as string | undefined;
      if (newJobId) {
        navigate(`/jobs/${newJobId}`);
      } else {
        await loadJob(id, { silent: false, showToastOnError: true });
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error instanceof Error ? error.message : "Failed to resume job.", {
        duration: 4000,
      });
    } finally {
      toast.dismiss(actionToastId);
      setActionLoading(false);
      setActionType(null);
    }
  };

  useEffect(() => {
    return () => {
      toast.dismiss(actionToastId);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "output" && isJobActive) {
      setActiveTab("summary");
    }
  }, [activeTab, isJobActive]);

  const loadPreview = async () => {
    if (!id) return;
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(previewPage),
        page_size: "25",
        status: previewStatusFilter,
      });
      if (previewSearch.trim()) params.set("search", previewSearch.trim());
      const response = await fetch(`${backendRoutes.jobs.outputPreview(id)}?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      const payload = (await response.json()) as OutputPreviewResponse;
      setPreview(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load output preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadProviderHealth = async () => {
    if (!job?.toolName) return;
    setProviderHealthLoading(true);
    try {
      const response = await fetch(backendRoutes.tools.providerHealth(job.toolName));
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      const payload = (await response.json()) as ProviderHealthResponse;
      setProviderHealth(payload);
      toast.success("Provider health updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load provider health.");
    } finally {
      setProviderHealthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "output") return;
    void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, previewPage, previewStatusFilter, previewSearch]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-foreground">Job Details</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label>Auto refresh</Label>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading job details...</CardContent>
          </Card>
        ) : !job ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Job not found.</CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="output" disabled={isJobActive}>
                Output Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
              <CardHeader>
                <CardTitle className="text-base">{job.sourceName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={status?.className}>
                    {status?.label}
                  </Badge>
                  <span className="text-muted-foreground">Tool: {job.toolName}</span>
                  <span className="text-muted-foreground">Job ID: {job.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={job.progress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(job.progress)}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                  <p>Created: {format(new Date(job.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
                  <p>Updated: {format(new Date(job.updatedAt), "MMM d, yyyy HH:mm:ss")}</p>
                  <p>Completed: {job.completedAt ? format(new Date(job.completedAt), "MMM d, yyyy HH:mm:ss") : "-"}</p>
                  <p>Processing time: {job.processingTimeSeconds || 0}s</p>
                  <p>Processed rows: {processedRows.toLocaleString()} / {job.totalRows.toLocaleString()}</p>
                  {job.errorMessage ? <p className="text-destructive">Error: {job.errorMessage}</p> : <p>Error: -</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isDataValidation && (
                    <>
                      <Button
                        variant="outline"
                        disabled={actionLoading || isJobActive}
                        onClick={() => void triggerResume(false)}
                        title={isJobActive ? "Wait until current run completes" : "Resume job"}
                      >
                        {actionLoading && actionType === "resume" ? "Starting Resume..." : "Resume Job"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={actionLoading || isJobActive}
                        onClick={() => void triggerResume(true)}
                        title={isJobActive ? "Wait until current run completes" : "Retry failed rows"}
                      >
                        {actionLoading && actionType === "retry" ? "Starting Retry..." : "Retry Failed Rows"}
                      </Button>
                      <>
                        <Select value={providerOverride} onValueChange={setProviderOverride} disabled={isJobActive}>
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Provider override" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerOptions.map((provider) => (
                              <SelectItem key={provider} value={provider}>
                                {providerLabel(provider)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {toolKind === "email-scraper" && (
                          <Select value={nativeModeOverride} onValueChange={setNativeModeOverride} disabled={isJobActive}>
                            <SelectTrigger className="w-56">
                              <SelectValue placeholder="Native mode override" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tool_default">Native mode: Tool default</SelectItem>
                              <SelectItem value="fast">Native mode: Fast</SelectItem>
                              <SelectItem value="balanced">Native mode: Balanced</SelectItem>
                              <SelectItem value="deep">Native mode: Deep</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Select value={retryScope} onValueChange={setRetryScope} disabled={isJobActive}>
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Retry scope" />
                          </SelectTrigger>
                          <SelectContent>
                            {retryScopeOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    </>
                  )}
                  {job.inputFile && (
                    <Button variant="outline" onClick={() => window.open(job.inputFile, "_blank", "noopener,noreferrer")}>
                      Open Input File
                    </Button>
                  )}
                  {job.downloadUrl && (
                    <Button onClick={() => window.open(job.downloadUrl, "_blank", "noopener,noreferrer")}>
                      Download Output
                    </Button>
                  )}
                </div>
                {actionLoading && !isDataValidation && (
                  <p className="text-xs text-muted-foreground">
                    {actionType === "retry" ? "Retry request is running..." : "Resume request is running..."} A new job page will open once it starts.
                  </p>
                )}
                {isJobActive && !isDataValidation && (
                  <p className="text-xs text-muted-foreground">
                    Resume and retry actions are available after the current processing run completes.
                  </p>
                )}
                {isDataValidation && (
                  <p className="text-xs text-muted-foreground">
                    Validation logic is rule-driven from input fields: <code>Req</code> (and <code>Comments</code> when present), plus <code>Sub Status</code> driven checks.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {statusItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status counts available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {statusItems.map(([key, value]) => (
                      <div key={key} className="rounded border border-border px-3 py-2 flex items-center justify-between">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Run Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Mode: {resumedFrom ? "Resume / Retry" : "New run"}</p>
                <p>Resumed from job: {resumedFrom || "-"}</p>
                <p>Retry failed only: {retryFailedOnly ? "Yes" : "No"}</p>
                <p>Retry status scope: {retryBuckets.length ? retryBuckets.join(", ") : (retryFailedOnly ? "All failed rows" : "-")}</p>
                <p>Provider override: {usedProvider ? providerLabel(usedProvider) : "Tool default"}</p>
                <p>Native mode: {usedNativeMode || "Tool default"}</p>
              </CardContent>
            </Card>

            {(toolKind === "email-scraper" || toolKind === "phone-scraper") && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">Provider Health Check</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => void loadProviderHealth()} disabled={providerHealthLoading}>
                    {providerHealthLoading ? "Checking..." : "Check Providers"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {!providerHealth ? (
                    <p className="text-muted-foreground">Run a quick check before retrying failed rows.</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Overall: {providerHealth.overall_status} | Checked: {format(new Date(providerHealth.checked_at), "MMM d, HH:mm:ss")}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {providerHealth.results.map((item) => (
                          <div key={item.provider} className="rounded border border-border px-3 py-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{item.provider}</p>
                              <p className="text-xs text-muted-foreground">{item.message}</p>
                            </div>
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            </TabsContent>

            <TabsContent value="output">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Output Rows</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isDataValidation ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">VALID</p>
                        <p className="text-base font-medium text-foreground">{Number(job.statusCounts?.VALID || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">INVALID</p>
                        <p className="text-base font-medium text-foreground">{Number(job.statusCounts?.INVALID || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">RECHECK</p>
                        <p className="text-base font-medium text-foreground">{Number(job.statusCounts?.RECHECK || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">DUPLICATE</p>
                        <p className="text-base font-medium text-foreground">{Number(job.statusCounts?.DUPLICATE || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">CANNOT_VERIFY</p>
                        <p className="text-base font-medium text-foreground">{Number(job.statusCounts?.CANNOT_VERIFY || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Processed</p>
                        <p className="text-base font-medium text-foreground">{processedRows.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Found</p>
                        <p className="text-base font-medium text-foreground">{foundCount.toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Not Found</p>
                        <p className="text-base font-medium text-foreground">{notFoundCount.toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Cannot Verify</p>
                        <p className="text-base font-medium text-foreground">{cannotVerifyCount.toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">No Unique</p>
                        <p className="text-base font-medium text-foreground">{noUniqueCount.toLocaleString()}</p>
                      </div>
                      <div className="rounded border border-border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Processed</p>
                        <p className="text-base font-medium text-foreground">{processedRows.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={previewStatusFilter} onValueChange={(v) => { setPreviewStatusFilter(v); setPreviewPage(1); }}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Search rows..."
                      value={previewSearch}
                      onChange={(e) => {
                        setPreviewSearch(e.target.value);
                        setPreviewPage(1);
                      }}
                      className="max-w-sm"
                    />
                  </div>

                  {previewLoading ? (
                    <p className="text-sm text-muted-foreground">Loading output rows...</p>
                  ) : !preview || preview.results.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rows for current filter.</p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            {preview.headers.map((h, idx) => (
                              <TableHead key={`${h}-${idx}`}>{h || `col_${idx + 1}`}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.results.map((r) => (
                            <TableRow key={r.excel_row}>
                              <TableCell>{r.excel_row}</TableCell>
                              {preview.headers.map((h, idx) => (
                                <TableCell key={`${r.excel_row}-${h}-${idx}`}>
                                  {String(r.values[h || `col_${idx + 1}`] ?? "")}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Page {preview.page} of {preview.total_pages} ({preview.total.toLocaleString()} rows)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={preview.page <= 1}
                            onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                          >
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={preview.page >= preview.total_pages}
                            onClick={() => setPreviewPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
