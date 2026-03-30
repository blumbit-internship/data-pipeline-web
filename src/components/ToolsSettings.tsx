import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { backendRoutes } from "@/lib/backend_routes";
import type { ToolDefinition } from "@/types/tools";

type ToolForm = Omit<ToolDefinition, "id" | "createdAt" | "updatedAt">;

const defaultForm: ToolForm = {
  name: "",
  displayName: "",
  description: "",
  isActive: true,
  requiresFile: true,
  supportsSheetsUrl: false,
};

export default function ToolsSettings() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolForm>(defaultForm);

  const loadTools = async () => {
    try {
      setLoading(true);
      const response = await fetch(backendRoutes.tools.list);
      if (!response.ok) throw new Error("Failed to load tools");
      const data = (await response.json()) as ToolDefinition[];
      setTools(data);
    } catch (error) {
      toast.error("Failed to load tools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
  };

  const saveTool = async () => {
    if (!form.name.trim() || !form.displayName.trim()) {
      toast.error("Tool name and display name are required.");
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? backendRoutes.tools.detail(editingId) : backendRoutes.tools.list;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to save tool");
      }
      toast.success(editingId ? "Tool updated." : "Tool created.");
      resetForm();
      await loadTools();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tool.");
    } finally {
      setSaving(false);
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
    });
  };

  const deleteTool = async (id: string) => {
    try {
      const response = await fetch(backendRoutes.tools.detail(id), { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete tool");
      toast.success("Tool deleted.");
      if (editingId === id) resetForm();
      await loadTools();
    } catch (error) {
      toast.error("Failed to delete tool.");
    }
  };

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
                    Delete
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
