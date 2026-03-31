export type PhoneSearchProvider = "native" | "serper" | "scrapegraph";
export type EmailSearchProvider = "native" | "serper";

export interface PhoneScraperToolConfig {
  search_provider?: PhoneSearchProvider;
  max_serper_results?: number;
  max_fetch_urls?: number;
  timeout_seconds?: number;
  scrapegraph_timeout_seconds?: number;
}

export interface EmailScraperToolConfig {
  search_provider?: EmailSearchProvider;
  max_serper_results?: number;
  max_fetch_urls?: number;
  timeout_seconds?: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  requiresFile: boolean;
  supportsSheetsUrl: boolean;
  config?: PhoneScraperToolConfig | EmailScraperToolConfig | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
