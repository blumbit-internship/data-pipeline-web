import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type {
  EmailEnrichmentProvider,
  PhoneSearchProvider,
  RoutingMode,
  ScrapegraphEngine,
  ScrapegraphMode,
  ToolDefinition,
} from "@/types/tools";
import {
  useCreateTool,
  useDeleteTool,
  useToolsList,
  useUpdateTool,
} from "@/hooks/useTools";
import { backendRoutes } from "@/lib/backend_routes";

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

const getToolKind = (name: string) => (name || "").trim().toLowerCase();
const EMAIL_PROVIDER_OPTIONS: EmailEnrichmentProvider[] = [
  "apollo",
  "hunter",
  "snov",
  "prospeo",
  "anymailfinder",
  "voilanorbert",
  "getprospect",
  "rocketreach",
  "coresignal",
  "brightdata",
  "scrapegraph",
  "serper",
  "native",
];
const PHONE_PROVIDER_OPTIONS: PhoneSearchProvider[] = [
  "native",
  "serper",
  "scrapegraph",
  "apollo",
  "rocketreach",
  "brave",
  "google_places",
];
const ROUTING_MODE_OPTIONS: RoutingMode[] = ["auto", "managed", "proxy", "direct"];
const SCRAPEGRAPH_ENGINE_OPTIONS: ScrapegraphEngine[] = ["direct", "serper", "searxng"];
const SCRAPEGRAPH_MODE_OPTIONS: ScrapegraphMode[] = ["cloud", "local"];

const normalizePhoneConfig = (config?: Record<string, unknown>) => ({
  search_provider: (() => {
    const selected =
      config?.selected_provider === "serper" ||
      config?.selected_provider === "scrapegraph" ||
      config?.selected_provider === "searxng"
        ? (config.selected_provider as PhoneSearchProvider)
        : "native";
    return selected;
  })(),
  selected_provider:
    String(config?.selected_provider || "").trim().toLowerCase() === "searxng"
      ? ("scrapegraph" as PhoneSearchProvider)
      : PHONE_PROVIDER_OPTIONS.includes(String(config?.selected_provider || "").trim().toLowerCase() as PhoneSearchProvider)
        ? (String(config?.selected_provider || "").trim().toLowerCase() as PhoneSearchProvider)
      : "native",
  max_serper_results: Math.max(1, Number(config?.max_serper_results ?? 6)),
  max_fetch_urls: Math.max(1, Number(config?.max_fetch_urls ?? 2)),
  timeout_seconds: Math.max(1, Number(config?.timeout_seconds ?? 4)),
  scrapegraph_timeout_seconds: Math.max(1, Number(config?.scrapegraph_timeout_seconds ?? 20)),
  scrapegraph_engine:
    SCRAPEGRAPH_ENGINE_OPTIONS.includes(String(config?.scrapegraph_engine || "direct") as ScrapegraphEngine)
      ? (String(config?.scrapegraph_engine) as ScrapegraphEngine)
      : ("direct" as ScrapegraphEngine),
  scrapegraph_mode:
    SCRAPEGRAPH_MODE_OPTIONS.includes(String(config?.scrapegraph_mode || "cloud") as ScrapegraphMode)
      ? (String(config?.scrapegraph_mode) as ScrapegraphMode)
      : ("cloud" as ScrapegraphMode),
  scrapegraph_llm_provider: String(config?.scrapegraph_llm_provider || "openai"),
  scrapegraph_llm_model: String(config?.scrapegraph_llm_model || "gpt-4o-mini"),
  routing_mode:
    ROUTING_MODE_OPTIONS.includes(String(config?.routing_mode || "auto") as RoutingMode)
      ? (String(config?.routing_mode) as RoutingMode)
      : ("auto" as RoutingMode),
});

const normalizeEmailConfig = (config?: Record<string, unknown>) => ({
  selected_provider: (() => {
    const selected = String(config?.selected_provider || "").trim().toLowerCase();
    return EMAIL_PROVIDER_OPTIONS.includes(selected as EmailEnrichmentProvider)
      ? (selected as EmailEnrichmentProvider)
      : ("native" as EmailEnrichmentProvider);
  })(),
  provider_order: (() => {
    const raw = Array.isArray(config?.provider_order) ? config?.provider_order : [];
    const normalized = raw
      .map((value) => String(value).trim().toLowerCase())
      .filter((value): value is EmailEnrichmentProvider =>
        EMAIL_PROVIDER_OPTIONS.includes(value as EmailEnrichmentProvider),
      );
    return normalized.length > 0 ? normalized : EMAIL_PROVIDER_OPTIONS;
  })(),
  search_provider: (() => {
    const selected = String(config?.selected_provider || "").trim().toLowerCase();
    return selected === "native" ? "native" : "serper";
  })(),
  max_serper_results: Math.max(1, Number(config?.max_serper_results ?? 6)),
  max_fetch_urls: Math.max(1, Number(config?.max_fetch_urls ?? 2)),
  timeout_seconds: Math.max(1, Number(config?.timeout_seconds ?? 4)),
  scrapegraph_timeout_seconds: Math.max(1, Number(config?.scrapegraph_timeout_seconds ?? 20)),
  scrapegraph_engine:
    SCRAPEGRAPH_ENGINE_OPTIONS.includes(String(config?.scrapegraph_engine || "direct") as ScrapegraphEngine)
      ? (String(config?.scrapegraph_engine) as ScrapegraphEngine)
      : ("direct" as ScrapegraphEngine),
  scrapegraph_mode:
    SCRAPEGRAPH_MODE_OPTIONS.includes(String(config?.scrapegraph_mode || "cloud") as ScrapegraphMode)
      ? (String(config?.scrapegraph_mode) as ScrapegraphMode)
      : ("cloud" as ScrapegraphMode),
  scrapegraph_llm_provider: String(config?.scrapegraph_llm_provider || "openai"),
  scrapegraph_llm_model: String(config?.scrapegraph_llm_model || "gpt-4o-mini"),
  cache_ttl_seconds: Math.max(60, Number(config?.cache_ttl_seconds ?? 604800)),
  verified_fresh_days: Math.max(1, Number(config?.verified_fresh_days ?? 30)),
  routing_mode:
    ROUTING_MODE_OPTIONS.includes(String(config?.routing_mode || "auto") as RoutingMode)
      ? (String(config?.routing_mode) as RoutingMode)
      : ("auto" as RoutingMode),
});

export default function ToolsSettings() {
  const { data: tools = [], isLoading: loading } = useToolsList();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteToolMutation = useDeleteTool();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolForm>(defaultForm);
  const [providerHealthLoading, setProviderHealthLoading] = useState(false);
  const [providerHealthResults, setProviderHealthResults] = useState<
    Array<{ provider: string; status: string; message: string }>
  >([]);
  const [providerHealthOverall, setProviderHealthOverall] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setProviderHealthResults([]);
    setProviderHealthOverall("");
  };

  const toolKind = getToolKind(form.name);
  const isPhoneScraper = toolKind === "phone-scraper";
  const isEmailScraper = toolKind === "email-scraper";

  const saveTool = async () => {
    if (!form.name.trim() || !form.displayName.trim()) {
      toast.error("Tool name and display name are required.");
      return;
    }

    try {
      const payload: ToolForm = {
        ...form,
        config: isPhoneScraper
          ? normalizePhoneConfig(form.config as Record<string, unknown> | undefined)
          : isEmailScraper
            ? normalizeEmailConfig(form.config as Record<string, unknown> | undefined)
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
    const toolKind = getToolKind(tool.name);
    setForm({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      isActive: tool.isActive,
      requiresFile: tool.requiresFile,
      supportsSheetsUrl: tool.supportsSheetsUrl,
      config:
        toolKind === "phone-scraper"
          ? normalizePhoneConfig(tool.config as Record<string, unknown> | undefined)
          : toolKind === "email-scraper"
            ? normalizeEmailConfig(tool.config as Record<string, unknown> | undefined)
            : (tool.config ?? {}),
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

  const runProviderHealthCheck = async () => {
    if (!isEmailScraper && !isPhoneScraper) return;
    setProviderHealthLoading(true);
    try {
      const response = await fetch(backendRoutes.tools.providerHealth(form.name));
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      const payload = (await response.json()) as {
        overall_status?: string;
        results?: Array<{ provider: string; status: string; message: string }>;
      };
      setProviderHealthOverall(String(payload.overall_status || ""));
      setProviderHealthResults(Array.isArray(payload.results) ? payload.results : []);
      toast.success("Provider health check completed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check provider health.");
    } finally {
      setProviderHealthLoading(false);
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
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground">Phone Scraper Config</h4>
              <Button variant="outline" size="sm" onClick={runProviderHealthCheck} disabled={providerHealthLoading}>
                {providerHealthLoading ? "Checking..." : "Check Providers"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selected Provider (single run)</Label>
                <Select
                  value={
                    ((form.config as Record<string, unknown> | undefined)?.selected_provider as string) || "native"
                  }
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), selected_provider: value },
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
                    <SelectItem value="apollo">Apollo</SelectItem>
                    <SelectItem value="rocketreach">RocketReach</SelectItem>
                    <SelectItem value="brave">Brave Search</SelectItem>
                    <SelectItem value="google_places">Google Places</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {((form.config as Record<string, unknown> | undefined)?.selected_provider as string) === "scrapegraph" && (
                <>
                  <div className="space-y-2">
                    <Label>ScrapeGraph Engine</Label>
                    <Select
                      value={
                        ((form.config as Record<string, unknown> | undefined)?.scrapegraph_engine as string) || "direct"
                      }
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_engine: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="serper">Serper</SelectItem>
                        <SelectItem value="searxng">SearXNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ScrapeGraph Mode</Label>
                    <Select
                      value={
                        ((form.config as Record<string, unknown> | undefined)?.scrapegraph_mode as string) || "cloud"
                      }
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_mode: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloud">Cloud API</SelectItem>
                        <SelectItem value="local">Local endpoint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-sg-llm-provider">ScrapeGraph LLM Provider</Label>
                    <Input
                      id="phone-sg-llm-provider"
                      value={String((form.config as Record<string, unknown> | undefined)?.scrapegraph_llm_provider ?? "openai")}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_llm_provider: e.target.value || "openai" },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-sg-llm-model">ScrapeGraph LLM Model</Label>
                    <Input
                      id="phone-sg-llm-model"
                      value={String((form.config as Record<string, unknown> | undefined)?.scrapegraph_llm_model ?? "gpt-4o-mini")}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_llm_model: e.target.value || "gpt-4o-mini" },
                        }))
                      }
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Routing Mode</Label>
                <Select
                  value={
                    ((form.config as Record<string, unknown> | undefined)?.routing_mode as string) || "auto"
                  }
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), routing_mode: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (managed -&gt; proxy -&gt; direct)</SelectItem>
                    <SelectItem value="managed">Managed unlocker only</SelectItem>
                    <SelectItem value="proxy">Proxy only</SelectItem>
                    <SelectItem value="direct">Direct only</SelectItem>
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
              <div className="space-y-2">
                <Label htmlFor="scrapegraph-timeout-seconds">ScrapeGraph Timeout (seconds)</Label>
                <Input
                  id="scrapegraph-timeout-seconds"
                  type="number"
                  min={1}
                  value={String(
                    (form.config as Record<string, unknown> | undefined)?.scrapegraph_timeout_seconds ?? 20
                  )}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: {
                        ...(prev.config ?? {}),
                        scrapegraph_timeout_seconds: Number(e.target.value || 20),
                      },
                    }))
                  }
                />
              </div>
            </div>
            {providerHealthResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Provider health: {providerHealthOverall || "unknown"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {providerHealthResults.map((item) => (
                    <div key={item.provider} className="rounded border border-border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.provider}</p>
                        <p className="text-xs text-muted-foreground">{item.message}</p>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Veriphone is a phone validation layer (post-check), not a selected scraping provider. It runs automatically when <code>VERIPHONE_API_KEY</code> is set.
            </p>
          </div>
        )}
        {isEmailScraper && (
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground">Email Scraper Config</h4>
              <Button variant="outline" size="sm" onClick={runProviderHealthCheck} disabled={providerHealthLoading}>
                {providerHealthLoading ? "Checking..." : "Check Providers"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selected Provider (single run)</Label>
                <Select
                  value={
                    ((form.config as Record<string, unknown> | undefined)?.selected_provider as string) || "native"
                  }
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), selected_provider: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apollo">Apollo</SelectItem>
                    <SelectItem value="hunter">Hunter</SelectItem>
                    <SelectItem value="snov">Snov.io</SelectItem>
                    <SelectItem value="prospeo">Prospeo</SelectItem>
                    <SelectItem value="anymailfinder">AnyMailFinder</SelectItem>
                    <SelectItem value="voilanorbert">VoilaNorbert</SelectItem>
                    <SelectItem value="getprospect">GetProspect</SelectItem>
                    <SelectItem value="rocketreach">RocketReach</SelectItem>
                    <SelectItem value="coresignal">Coresignal</SelectItem>
                    <SelectItem value="brightdata">BrightData</SelectItem>
                    <SelectItem value="scrapegraph">ScrapeGraphAI</SelectItem>
                    <SelectItem value="serper">Serper</SelectItem>
                    <SelectItem value="native">Native Fetch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {((form.config as Record<string, unknown> | undefined)?.selected_provider as string) === "scrapegraph" && (
                <>
                  <div className="space-y-2">
                    <Label>ScrapeGraph Engine</Label>
                    <Select
                      value={
                        ((form.config as Record<string, unknown> | undefined)?.scrapegraph_engine as string) || "direct"
                      }
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_engine: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="serper">Serper</SelectItem>
                        <SelectItem value="searxng">SearXNG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ScrapeGraph Mode</Label>
                    <Select
                      value={
                        ((form.config as Record<string, unknown> | undefined)?.scrapegraph_mode as string) || "cloud"
                      }
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_mode: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloud">Cloud API</SelectItem>
                        <SelectItem value="local">Local endpoint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-sg-llm-provider">ScrapeGraph LLM Provider</Label>
                    <Input
                      id="email-sg-llm-provider"
                      value={String((form.config as Record<string, unknown> | undefined)?.scrapegraph_llm_provider ?? "openai")}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_llm_provider: e.target.value || "openai" },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-sg-llm-model">ScrapeGraph LLM Model</Label>
                    <Input
                      id="email-sg-llm-model"
                      value={String((form.config as Record<string, unknown> | undefined)?.scrapegraph_llm_model ?? "gpt-4o-mini")}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          config: { ...(prev.config ?? {}), scrapegraph_llm_model: e.target.value || "gpt-4o-mini" },
                        }))
                      }
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Routing Mode</Label>
                <Select
                  value={
                    ((form.config as Record<string, unknown> | undefined)?.routing_mode as string) || "auto"
                  }
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      config: { ...(prev.config ?? {}), routing_mode: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (managed -&gt; proxy -&gt; direct)</SelectItem>
                    <SelectItem value="managed">Managed unlocker only</SelectItem>
                    <SelectItem value="proxy">Proxy only</SelectItem>
                    <SelectItem value="direct">Direct only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-timeout-seconds">Timeout (seconds)</Label>
                <Input
                  id="email-timeout-seconds"
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
                <Label htmlFor="email-max-serper-results">Max Serper Results</Label>
                <Input
                  id="email-max-serper-results"
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
                <Label htmlFor="email-max-fetch-urls">Max Fetch URLs</Label>
                <Input
                  id="email-max-fetch-urls"
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email-provider-order">
                  Provider Order (comma-separated)
                </Label>
                <Input
                  id="email-provider-order"
                  value={(() => {
                    const configured = (form.config as Record<string, unknown> | undefined)
                      ?.provider_order;
                    return Array.isArray(configured)
                      ? configured.map((value) => String(value)).join(", ")
                      : EMAIL_PROVIDER_OPTIONS.join(", ");
                  })()}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: {
                        ...(prev.config ?? {}),
                        provider_order: e.target.value
                          .split(",")
                          .map((item) => item.trim().toLowerCase())
                          .filter(Boolean),
                      },
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Allowed values: {EMAIL_PROVIDER_OPTIONS.join(", ")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-cache-ttl-seconds">Cache TTL (seconds)</Label>
                <Input
                  id="email-cache-ttl-seconds"
                  type="number"
                  min={60}
                  value={String((form.config as Record<string, unknown> | undefined)?.cache_ttl_seconds ?? 604800)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: {
                        ...(prev.config ?? {}),
                        cache_ttl_seconds: Number(e.target.value || 604800),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-verified-fresh-days">Verified Freshness (days)</Label>
                <Input
                  id="email-verified-fresh-days"
                  type="number"
                  min={1}
                  value={String((form.config as Record<string, unknown> | undefined)?.verified_fresh_days ?? 30)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      config: {
                        ...(prev.config ?? {}),
                        verified_fresh_days: Number(e.target.value || 30),
                      },
                    }))
                  }
                />
              </div>
            </div>
            {providerHealthResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Provider health: {providerHealthOverall || "unknown"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {providerHealthResults.map((item) => (
                    <div key={item.provider} className="rounded border border-border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.provider}</p>
                        <p className="text-xs text-muted-foreground">{item.message}</p>
                      </div>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              MillionVerifier is an email verification layer (post-check), not a selected scraping provider. It runs automatically when <code>MILLIONVERIFIER_API_KEY</code> is set.
            </p>
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
