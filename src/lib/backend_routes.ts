import { API_URL } from "@/config/dot-env.config";

export const backendRoutes = {
  auth: {
    register: `${API_URL}/auth/register`,
    login: `${API_URL}/auth/login`,
    refresh: `${API_URL}/auth/refresh`,
    logout: `${API_URL}/auth/logout`,
    me: `${API_URL}/auth/me`,
    changePassword: `${API_URL}/auth/change-password`,
  },
  upload: `${API_URL}/upload`,
  validation_rules: {
    list: `${API_URL}/validation_rules`,
    create: `${API_URL}/validation_rules`,
    update: (id: string) => `${API_URL}/validation_rules/${id}`,
    delete: (id: string) => `${API_URL}/validation_rules/${id}`,
  },
  tools: {
    available: `${API_URL}/tools/available`,
    list: `${API_URL}/tools`,
    detail: (id: string) => `${API_URL}/tools/${id}`,
    process: `${API_URL}/tools/process`,
    providerHealth: (toolName: string) => `${API_URL}/tools/provider-health?tool_name=${encodeURIComponent(toolName)}`,
  },
  jobs: {
    list: `${API_URL}/jobs`,
    detail: (id: string) => `${API_URL}/jobs/${id}`,
    outputPreview: (id: string) => `${API_URL}/jobs/${id}/output-preview`,
    cancel: (id: string) => `${API_URL}/jobs/${id}/cancel`,
    resume: (id: string) => `${API_URL}/jobs/${id}/resume`,
    delete: (id: string) => `${API_URL}/jobs/${id}`,
  },
};
