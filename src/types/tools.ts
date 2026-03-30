export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  requiresFile: boolean;
  supportsSheetsUrl: boolean;
  createdAt?: string;
  updatedAt?: string;
}
