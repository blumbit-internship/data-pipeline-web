import { useState, useRef, useCallback } from "react";
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

interface FileUploadPanelProps {
  onStartJob: (input: StartJobInput) => Promise<void> | void;
}

export function FileUploadPanel({ onStartJob }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [tool, setTool] = useState<ToolType>("data-validation");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (tool === "data-validation" && !file) {
      toast.error("Please upload an .xlsx file for Data Validation.");
      return;
    }

    setSubmitting(true);
    await onStartJob({ file, sheetsUrl, toolType: tool });
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
          placeholder="Or paste a Google Sheets URL..."
          value={sheetsUrl}
          onChange={(e) => {
            setSheetsUrl(e.target.value);
            setFile(null);
          }}
          className="flex-1"
        />
      </div>

      {/* Tool selector + Start */}
      <div className="flex items-center gap-3">
        <Select value={tool} onValueChange={(v) => setTool(v as ToolType)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data-validation">Data Validation</SelectItem>
            <SelectItem value="phone-scraper">Phone Scraper</SelectItem>
            <SelectItem value="email-scraper">Email Scraper</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleStart} disabled={!hasInput || submitting} className="gap-2">
          <Play className="h-4 w-4" />
          {submitting ? "Processing..." : "Start Processing"}
        </Button>
      </div>
    </div>
  );
}
