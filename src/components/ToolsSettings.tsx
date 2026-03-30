import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolDefinition } from "@/types/tools";
import {
  useCreateTool,
  useDeleteTool,
  useToolsList,
  useUpdateTool,
} from "@/hooks/useTools";

type ToolForm = Omit<ToolDefinition, "id" | "createdAt" | "updatedAt">;

const defaultForm: ToolForm = {
  name: "",
  displayName: "",
  description: "",
  isActive: true,
  requiresFile: true,
  supportsSheetsUrl: false,
  config: {
    search_provider: "native",
    max_serper_results: 6,
    max_fetch_urls: 2,
    timeout_seconds: 4,
  },
};

export default function ToolsSettings() {
  const { data: tools = [], isLoading: loading } = useToolsList();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteToolMutation = useDeleteTool();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolForm>(defaultForm);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const isPhoneScraper = (form.name || "").trim().toLowerCase() === "phone-scraper";

  const saveTool = async () => {
    if (!form.name.trim() || !form.displayName.trim()) {
      toast.error("Tool name and display name are required.");
      return;
    }

    try {
      const payload: ToolForm = {
        ...form,
        config:
          isPhoneScraper
            ? {
                search_provider:
                  (form.config as Record<string, unknown> | undefined)?.search_provider === "serper" ||
                  (form.config as Record<string, unknown> | undefined)?.search_provider === "scrapegraph"
                    ? ((form.config as Record<string, unknown>).search_provider as "serper" | "scrapegraph")
                    : "native",
                max_serper_results: Math.max(
                  1,
                  Number((form.config as Record<string, unknown> | undefined)?.max_serper_results ?? 6)
                ),
                max_fetch_urls: Math.max(
                  1,
                  Number((form.config as Record<string, unknown> | undefined)?.max_fetch_urls ?? 2)
                ),
                timeout_seconds: Math.max(
                  1,
                  Number((form.config as Record<string, unknown> | undefined)?.timeout_seconds ?? 4)
                ),
              }
            : form.config ?? {},
      };
      if (editingId) {
        await updateTool.mutateAsync({ id: editingId, patch: payload });
      } else {
        await createTool.mutateAsync(payload);
      }
      toast.success(editingId ? "Tool updated." : "Tool created.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tool.");
    }
  };

  const startEdit = (tool: ToolDefinition) => {
    setEditingId(tool.id);
    setForm({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      isActive: tool.isActive,
      requiresFile: tool.requiresFile,
      supportsSheetsUrl: tool.supportsSheetsUrl,
      config: {
        search_provider:
          (tool.config as Record<string, unknown> | undefined)?.search_provider === "serper" ||
          (tool.config as Record<string, unknown> | undefined)?.search_provider === "scrapegraph"
            ? ((tool.config as Record<string, unknown>).search_provider as "serper" | "scrapegraph")
            : "native",
        max_serper_results: Number(
          (tool.config as Record<string, unknown> | undefined)?.max_serper_results ?? 6
        ),
        max_fetch_urls: Number((tool.config as Record<string, unknown> | undefined)?.max_fetch_urls ?? 2),
        timeout_seconds: Number((tool.config as Record<string, unknown> | undefined)?.timeout_seconds ?? 4),
      },
    });
  };

  const deleteTool = async (id: string) => {
    try {
      await deleteToolMutation.mutateAsync(id);
      toast.success("Tool deleted.");
      if (editingId === id) resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tool.");
    }
  };

  const saving = createTool.isPending || updateTool.isPending;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Tool Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage available tools used by job processing.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {editingId ? "Edit Tool" : "Create Tool"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name">Tool Name (slug)</Label>
            <Input
              id="tool-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="data-validation"
              disabled={!!editingId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tool-display-name">Display Name</Label>
            <Input
              id="tool-display-name"
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Data Validation"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tool-description">Description</Label>
          <Input
            id="tool-description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="What this tool does..."
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
            />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.requiresFile}
              onCheckedChange={(value) => setForm((prev) => ({ ...prev, requiresFile: value }))}
            />
            <Label>Requires File</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.supportsSheetsUrl}
              onCheckedChange={(value) => setForm((prev) => ({ ...prev, supportsSheetsUrl: value }))}
            />
            <Label>Supports Sheets URL</Label>
          </div>
        </div>
        {isPhoneScraper && (
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Phone Scraper Config</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Search Provider</Label>
                <Select
                  value={
                    ((form.config as Record<string, unknown> | undefined)?.search_provider as string) || "native"
                  }
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), search_provider: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native Fetch</SelectItem>
                    <SelectItem value="serper">Serper</SelectItem>
                    <SelectItem value="scrapegraph">ScrapeGraphAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout-seconds">Timeout (seconds)</Label>
                <Input
                  id="timeout-seconds"
                  type="number"
                  min={1}
                  value={String((form.config as Record<string, unknown> | undefined)?.timeout_seconds ?? 4)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), timeout_seconds: Number(e.target.value || 4) },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-serper-results">Max Serper Results</Label>
                <Input
                  id="max-serper-results"
                  type="number"
                  min={1}
                  value={String((form.config as Record<string, unknown> | undefined)?.max_serper_results ?? 6)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), max_serper_results: Number(e.target.value || 6) },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-fetch-urls">Max Fetch URLs</Label>
                <Input
                  id="max-fetch-urls"
                  type="number"
                  min={1}
                  value={String((form.config as Record<string, unknown> | undefined)?.max_fetch_urls ?? 2)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), max_fetch_urls: Number(e.target.value || 2) },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={saveTool} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Tool" : "Create Tool"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Tools</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tools...</p>
        ) : tools.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tools configured.</p>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{tool.displayName}</p>
                  <p className="text-xs text-muted-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(tool)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteTool(tool.id)}>
                    {deleteToolMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
