import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, Link as LinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { StartJobInput, ToolType } from "@/hooks/useJobs";
import { toast } from "sonner";
import { useAvailableTools } from "@/hooks/useTools";

interface FileUploadPanelProps {
  onStartJob: (input: StartJobInput) => Promise<void> | void;
}

export function FileUploadPanel({ onStartJob }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [tool, setTool] = useState<ToolType>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("tool_default");
  const [nativeMode, setNativeMode] = useState<string>("tool_default");
  const [nativeFetchMode, setNativeFetchMode] = useState<string>("tool_default");
  const [advancedAiSearchEngine, setAdvancedAiSearchEngine] = useState<string>("tool_default");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    data: tools = [],
    isLoading: loadingTools,
    isError: isToolsError,
  } = useAvailableTools();
  const selectedTool = tools.find((t) => t.name === tool);
  const toolKind = (selectedTool?.name || "").toLowerCase();
  const providerOptions =
    toolKind === "email-scraper"
      ? ["apollo", "hunter", "snov", "prospeo", "anymailfinder", "voilanorbert", "getprospect", "rocketreach", "coresignal", "brightdata", "scrapegraph", "serper", "duckduckgo", "advanced_ai", "native"]
      : toolKind === "phone-scraper"
        ? ["native", "serper", "scrapegraph", "apollo", "rocketreach", "brave", "google_places"]
        : [];

  useEffect(() => {
    if (tools.length > 0 && !tool) {
      setTool(tools[0].name);
    }
  }, [tools, tool]);

  useEffect(() => {
    if (isToolsError) {
      toast.error("Failed to load tools list.");
    }
  }, [isToolsError]);

  useEffect(() => {
    if (!selectedTool?.supportsSheetsUrl && sheetsUrl) {
      setSheetsUrl("");
    }
  }, [selectedTool, sheetsUrl]);

  useEffect(() => {
    setSelectedProvider("tool_default");
    setNativeMode("tool_default");
    setNativeFetchMode("tool_default");
    setAdvancedAiSearchEngine("tool_default");
  }, [tool]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.xlsx$/i.test(f.name)) setFile(f);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleStart = async () => {
    if (!file && !sheetsUrl) return;
    if (!tool) {
      toast.error("No active tool is selected.");
      return;
    }
    if (selectedTool?.requiresFile && !file) {
      toast.error("This tool requires a file upload.");
      return;
    }
    if (!selectedTool?.supportsSheetsUrl && sheetsUrl) {
      toast.error("This tool does not support Google Sheets URLs.");
      return;
    }

    setSubmitting(true);
    await onStartJob({
      file,
      sheetsUrl,
      toolType: tool,
      selectedProvider,
      nativeMode,
      nativeFetchMode,
      advancedAiSearchEngine,
    });
    setSubmitting(false);
    setFile(null);
    setSheetsUrl("");
  };

  const hasInput = !!file || !!sheetsUrl;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-base font-semibold text-foreground">
        New Processing Job
      </h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
      >
        {file ? (
          <>
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {file.name}
            </span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Drop an <strong>.xlsx</strong> file here,
              or click to browse
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Google Sheets URL */}
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder={
            selectedTool?.supportsSheetsUrl
              ? "Or paste a Google Sheets URL..."
              : "Google Sheets URL is not supported for selected tool"
          }
          value={sheetsUrl}
          onChange={(e) => {
            setSheetsUrl(e.target.value);
            setFile(null);
          }}
          className="flex-1"
          disabled={!selectedTool?.supportsSheetsUrl}
        />
      </div>

      {/* Tool selector + Start */}
      <div className="flex items-center gap-3">
        <Select value={tool} onValueChange={(v) => setTool(v as ToolType)} disabled={loadingTools || tools.length === 0}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tools.map((item) => (
              <SelectItem key={item.id} value={item.name}>
                {item.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {providerOptions.length > 0 && (
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool_default">Use tool default provider</SelectItem>
              {providerOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {toolKind === "email-scraper" && (
          <Select value={nativeMode} onValueChange={setNativeMode}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool_default">Native mode: Tool default</SelectItem>
              <SelectItem value="fast">Native mode: Fast</SelectItem>
              <SelectItem value="balanced">Native mode: Balanced</SelectItem>
              <SelectItem value="deep">Native mode: Deep</SelectItem>
            </SelectContent>
          </Select>
        )}
        {toolKind === "email-scraper" && (
          <Select value={nativeFetchMode} onValueChange={setNativeFetchMode}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool_default">Native fetch mode: Tool default</SelectItem>
              <SelectItem value="http">Native fetch mode: HTTP (fast)</SelectItem>
              <SelectItem value="headful">Native fetch mode: Headful browser (recordable)</SelectItem>
            </SelectContent>
          </Select>
        )}
        {toolKind === "email-scraper" && (selectedProvider === "advanced_ai" || selectedProvider === "tool_default") && (
          <Select value={advancedAiSearchEngine} onValueChange={setAdvancedAiSearchEngine}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tool_default">Advanced AI engine: Tool default</SelectItem>
              <SelectItem value="auto">Advanced AI engine: Auto</SelectItem>
              <SelectItem value="searxng">Advanced AI engine: SearXNG</SelectItem>
              <SelectItem value="serper">Advanced AI engine: Serper</SelectItem>
              <SelectItem value="duckduckgo">Advanced AI engine: DuckDuckGo</SelectItem>
              <SelectItem value="native">Advanced AI engine: Native crawl</SelectItem>
              <SelectItem value="hybrid">Advanced AI engine: Hybrid (all)</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={handleStart}
          disabled={!hasInput || submitting || loadingTools || tools.length === 0}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {submitting ? "Processing..." : "Start Processing"}
        </Button>
      </div>
    </div>
  );
}
