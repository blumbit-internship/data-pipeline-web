import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const ConfigurationSettings = () => {
  const [apiEndpoint, setApiEndpoint] = useState("https://api.example.com/v1");
  const [pollingInterval, setPollingInterval] = useState("3");
  const [maxParallel, setMaxParallel] = useState("5");
  const [notifications, setNotifications] = useState(true);
  const [autoRetry, setAutoRetry] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your processing backend and preferences.
          </p>
        </div>

        {/* API Configuration */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">API Configuration</h3>
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">Backend API Endpoint</Label>
            <Input
              id="api-endpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Polling Interval (seconds)</Label>
              <Select value={pollingInterval} onValueChange={setPollingInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1s</SelectItem>
                  <SelectItem value="3">3s</SelectItem>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Parallel Jobs</Label>
              <Select value={maxParallel} onValueChange={setMaxParallel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Desktop Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified when a job completes or errors.</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Retry on Error</p>
              <p className="text-xs text-muted-foreground">Automatically retry failed jobs up to 3 times.</p>
            </div>
            <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
          </div>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </div>
  );
};

export default ConfigurationSettings;
