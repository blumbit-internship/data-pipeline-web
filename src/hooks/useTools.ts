import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendRoutes } from "@/lib/backend_routes";
import type { ToolDefinition } from "@/types/tools";

type ToolPayload = Omit<ToolDefinition, "id" | "createdAt" | "updatedAt">;

const toolsKeys = {
  all: ["tools"] as const,
  available: ["tools", "available"] as const,
  list: ["tools", "list"] as const,
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }
  return payload as T;
}

export function useAvailableTools() {
  return useQuery({
    queryKey: toolsKeys.available,
    queryFn: () => fetchJson<ToolDefinition[]>(backendRoutes.tools.available),
  });
}

export function useToolsList() {
  return useQuery({
    queryKey: toolsKeys.list,
    queryFn: () => fetchJson<ToolDefinition[]>(backendRoutes.tools.list),
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tool: ToolPayload) =>
      fetchJson<ToolDefinition>(backendRoutes.tools.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tool),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: toolsKeys.list }),
        queryClient.invalidateQueries({ queryKey: toolsKeys.available }),
      ]);
    },
  });
}

export function useUpdateTool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ToolPayload> }) =>
      fetchJson<ToolDefinition>(backendRoutes.tools.detail(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: toolsKeys.list }),
        queryClient.invalidateQueries({ queryKey: toolsKeys.available }),
      ]);
    },
  });
}

export function useDeleteTool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(backendRoutes.tools.detail(id), { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
      return id;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: toolsKeys.list }),
        queryClient.invalidateQueries({ queryKey: toolsKeys.available }),
      ]);
    },
  });
}
