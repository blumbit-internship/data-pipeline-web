import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendRoutes } from "@/lib/backend_routes";
import { fetchJson } from "@/lib/api-client";
import type { ToolDefinition } from "@/types/tools";

type ToolPayload = Omit<ToolDefinition, "id" | "createdAt" | "updatedAt">;

const toolsKeys = {
  all: ["tools"] as const,
  available: ["tools", "available"] as const,
  list: ["tools", "list"] as const,
};

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
    mutationFn: async (id: string) =>
      fetchJson<unknown>(backendRoutes.tools.detail(id), { method: "DELETE" }).then(() => id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: toolsKeys.list }),
        queryClient.invalidateQueries({ queryKey: toolsKeys.available }),
      ]);
    },
  });
}
