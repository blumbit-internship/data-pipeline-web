export type PhoneSearchProvider =
  | "native"
  | "serper"
  | "scrapegraph"
  | "apollo"
  | "rocketreach"
  | "brave"
  | "google_places";
export type EmailSearchProvider = "native" | "serper";
export type RoutingMode = "auto" | "managed" | "proxy" | "direct";
export type ScrapegraphEngine = "direct" | "serper" | "searxng";
export type ScrapegraphMode = "cloud" | "local";
export type NativeMode = "fast" | "balanced" | "deep";
export type NativeFetchMode = "http" | "headful";
export type AdvancedAiSearchEngine = "auto" | "searxng" | "serper" | "duckduckgo" | "native" | "hybrid";
export type EmailEnrichmentProvider =
  | "apollo"
  | "hunter"
  | "snov"
  | "prospeo"
  | "anymailfinder"
  | "voilanorbert"
  | "getprospect"
  | "rocketreach"
  | "coresignal"
  | "brightdata"
  | "scrapegraph"
  | "serper"
  | "duckduckgo"
  | "advanced_ai"
  | "native";

export interface PhoneScraperToolConfig {
  search_provider?: PhoneSearchProvider;
  selected_provider?: PhoneSearchProvider | "";
  max_serper_results?: number;
  max_fetch_urls?: number;
  timeout_seconds?: number;
  scrapegraph_timeout_seconds?: number;
  scrapegraph_engine?: ScrapegraphEngine;
  scrapegraph_mode?: ScrapegraphMode;
  scrapegraph_llm_provider?: string;
  scrapegraph_llm_model?: string;
  cache_ttl_seconds?: number;
  verified_fresh_days?: number;
  routing_mode?: RoutingMode;
  native_mode?: NativeMode;
}

export interface EmailScraperToolConfig {
  search_provider?: EmailSearchProvider;
  selected_provider?: EmailEnrichmentProvider | "";
  provider_order?: EmailEnrichmentProvider[];
  max_serper_results?: number;
  max_fetch_urls?: number;
  timeout_seconds?: number;
  scrapegraph_timeout_seconds?: number;
  scrapegraph_engine?: ScrapegraphEngine;
  scrapegraph_mode?: ScrapegraphMode;
  scrapegraph_llm_provider?: string;
  scrapegraph_llm_model?: string;
  cache_ttl_seconds?: number;
  verified_fresh_days?: number;
  routing_mode?: RoutingMode;
  native_mode?: NativeMode;
  native_fetch_mode?: NativeFetchMode;
  advanced_ai_search_engine?: AdvancedAiSearchEngine;
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
