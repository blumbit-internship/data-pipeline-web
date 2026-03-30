import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Loader2,
  FileText,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
} from "lucide-react";
import { backendRoutes } from "@/lib/backend_routes";

interface RuleFormData {
  rule: string;
  update: string;
  description: string;
  file: File | null;
  fileLink?: string;
  includeFile: boolean;
}

interface UploadStatus {
  fileUploading: boolean;
  ruleCreating: boolean;
  success: boolean;
  error: string | null;
}

interface ValidationRule {
  id: string;
  rule: string;
  update: string;
  description: string;
  fileLink?: string;
  createdAt: string;
  updatedAt: string;
}

const DataValidation = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [formData, setFormData] = useState<RuleFormData>({
    rule: "",
    update: "",
    description: "",
    file: null,
    includeFile: false,
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    fileUploading: false,
    ruleCreating: false,
    success: false,
    error: null,
  });

  // Fetch rules on component mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoadingRules(true);
      const response = await fetch(backendRoutes.validation_rules.list);

      if (!response.ok) {
        console.error(`Failed to fetch rules: ${response.status}`);
        setRules([]);
        return;
      }

      const data = await response.json();
      setRules(data.rules || data.data || data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any previous errors when user makes changes
    if (uploadStatus.error) {
      setUploadStatus((prev) => ({ ...prev, error: null }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Add file size validation (e.g., 10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadStatus((prev) => ({
          ...prev,
          error: `File size exceeds 10MB limit. Current file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        file: file,
      }));
      setUploadStatus((prev) => ({ ...prev, error: null }));
    } else {
      setFormData((prev) => ({
        ...prev,
        file: null,
      }));
    }
  };

  const handleIncludeFileChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      includeFile: checked,
      // Clear file if unchecked
      file: checked ? prev.file : null,
    }));
    setUploadStatus((prev) => ({ ...prev, error: null }));
  };

  // Step 1: Upload file to get the link (only if file is included)
  const uploadFile = async (file: File): Promise<string> => {
    const fileFormData = new FormData();
    fileFormData.append("file", file);

    // file upload API endpoint
    const FILE_UPLOAD_ENDPOINT = backendRoutes.upload;

    try {
      const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: "POST",
        body: fileFormData,
      });

      if (!response.ok) {
        throw new Error(`File upload failed: ${response.status}`);
      }

      const result = await response.json();
      // Assuming the API returns the file URL in one of these formats
      return result.url || result.fileUrl || result.link || result.data.url;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "File upload failed",
      );
    }
  };

  // Step 2: Create rule with optional file link in description
  const createRule = async (ruleData: {
    rule: string;
    update: string;
    description: string;
    fileLink?: string;
  }) => {
    // rule creation API endpoint
    const RULE_CREATE_ENDPOINT = backendRoutes.validation_rules.create;

    try {
      const response = await fetch(RULE_CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create rule",
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.rule.trim()) {
      setUploadStatus((prev) => ({ ...prev, error: "Rule name is required" }));
      return;
    }

    // If file inclusion is checked, validate file is selected
    if (formData.includeFile && !formData.file) {
      setUploadStatus((prev) => ({
        ...prev,
        error: "Please select a file to upload",
      }));
      return;
    }

    // Reset status
    setUploadStatus({
      fileUploading: false,
      ruleCreating: false,
      success: false,
      error: null,
    });

    try {
      let fileLink: string | undefined;
      let finalDescription = formData.description;

      // Step 1: Upload file if included
      if (formData.includeFile && formData.file) {
        setUploadStatus((prev) => ({
          ...prev,
          fileUploading: true,
          error: null,
        }));

        console.log("Uploading file...", formData.file.name);
        fileLink = await uploadFile(formData.file);
        console.log("File uploaded successfully. Link:", fileLink);

        // Prepare description with file link
        finalDescription = formData.description
          ? `${formData.description}\n\nFile: ${fileLink}`
          : `File: ${fileLink}`;
      }

      // Step 2: Create rule
      setUploadStatus((prev) => ({
        ...prev,
        fileUploading: false,
        ruleCreating: true,
      }));

      console.log("Creating rule...");
      const result = await createRule({
        rule: formData.rule,
        update: formData.update,
        description: finalDescription,
        fileLink: fileLink,
      });

      if (result.success) {
        setUploadStatus({
          fileUploading: false,
          ruleCreating: false,
          success: true,
          error: null,
        });

        // Refresh rules list
        await fetchRules();

        // Reset form and close dialog on success
        setTimeout(() => {
          setFormData({
            rule: "",
            update: "",
            description: "",
            file: null,
            includeFile: false,
          });
          setIsDialogOpen(false);
          setUploadStatus({
            fileUploading: false,
            ruleCreating: false,
            success: false,
            error: null,
          });
        }, 1500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setUploadStatus({
        fileUploading: false,
        ruleCreating: false,
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule: "",
      update: "",
      description: "",
      file: null,
      includeFile: false,
    });
    setUploadStatus({
      fileUploading: false,
      ruleCreating: false,
      success: false,
      error: null,
    });
    setIsDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Data Validation</h2>
          <p className="text-muted-foreground">
            Configure your data validation rules and settings.
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>New Rule</Button>
      </div>

      {/* Rules Display Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Validation Rules</h3>

        {loadingRules ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No validation rules created yet.
                <br />
                Click "New Rule" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {rule.rule}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {rule.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {rule.update && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Update:</span>
                          <Badge variant="secondary">{rule.update}</Badge>
                        </div>
                      )}
                      {rule.fileLink && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={rule.fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View Attached File
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                    <div className="w-full flex justify-between">
                      <span>Created: {formatDate(rule.createdAt)}</span>
                      <span>Updated: {formatDate(rule.updatedAt)}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Dialog/Modal Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Validation Rule</DialogTitle>
            <DialogDescription>
              Configure your data validation rule with the details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Error Alert */}
              {uploadStatus.error && (
                <Alert variant="destructive" className="col-span-4">
                  <AlertDescription>{uploadStatus.error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {uploadStatus.success && (
                <Alert className="col-span-4 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>
                    Rule created successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Rule Name Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rule" className="text-right">
                  Rule Name *
                </Label>
                <Input
                  id="rule"
                  name="rule"
                  value={formData.rule}
                  onChange={handleInputChange}
                  placeholder="Enter rule name"
                  className="col-span-3"
                  required
                  disabled={
                    uploadStatus.fileUploading || uploadStatus.ruleCreating
                  }
                />
              </div>

              {/* Update Field - Text Input for Flexibility */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="update" className="text-right">
                  Update
                </Label>
                <Input
                  id="update"
                  name="update"
                  value={formData.update}
                  onChange={handleInputChange}
                  placeholder="Enter update frequency"
                  className="col-span-3"
                  disabled={
                    uploadStatus.fileUploading || uploadStatus.ruleCreating
                  }
                />
              </div>

              {/* Description Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter rule description"
                  className="col-span-3"
                  rows={3}
                  disabled={
                    uploadStatus.fileUploading || uploadStatus.ruleCreating
                  }
                />
              </div>

              {/* File Upload Toggle */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Include File</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="includeFile"
                    checked={formData.includeFile}
                    onCheckedChange={handleIncludeFileChange}
                    disabled={
                      uploadStatus.fileUploading || uploadStatus.ruleCreating
                    }
                  />
                  <Label
                    htmlFor="includeFile"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Attach a file to this rule
                  </Label>
                </div>
              </div>

              {/* File Upload Field - Conditional */}
              {formData.includeFile && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File Upload *
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="flex-1"
                        accept=".json,.xml,.csv,.txt,.xlsx,.xls"
                        disabled={
                          uploadStatus.fileUploading ||
                          uploadStatus.ruleCreating
                        }
                        required={formData.includeFile}
                      />
                    </div>
                    {formData.file && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-sm font-medium">Selected File:</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.file.name} (
                          {(formData.file.size / 1024).toFixed(2)} KB)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {formData.file.type || "Unknown"}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: JSON, XML, CSV, TXT, Excel (Max size:
                      10MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Progress Status */}
              {(uploadStatus.fileUploading || uploadStatus.ruleCreating) && (
                <div className="col-span-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>
                      {uploadStatus.fileUploading && "Uploading file..."}
                      {uploadStatus.ruleCreating && "Creating rule..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={
                  uploadStatus.fileUploading || uploadStatus.ruleCreating
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  uploadStatus.fileUploading || uploadStatus.ruleCreating
                }
              >
                {uploadStatus.fileUploading && "Uploading File..."}
                {uploadStatus.ruleCreating && "Creating Rule..."}
                {!uploadStatus.fileUploading &&
                  !uploadStatus.ruleCreating &&
                  "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataValidation;
