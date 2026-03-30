import { API_URL } from "@/config/dot-env.config";

export const backendRoutes = {
  upload: `${API_URL}/upload`,
  validation_rules: {
    list: `${API_URL}/validation_rules`,
    create: `${API_URL}/validation_rules`,
    update: (id: string) => `${API_URL}/validation_rules/${id}`,
    delete: (id: string) => `${API_URL}/validation_rules/${id}`,
  },
  tools: {
    process: `${API_URL}/tools/process`,
  },
};
