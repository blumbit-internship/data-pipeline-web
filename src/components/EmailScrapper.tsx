import React, { useState } from "react";
import { Plus, Code, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Default email scrapers
export const DEFAULT_EMAIL_SCRAPPERS = [
  {
    id: "email-regex",
    name: "Regex Email Extractor",
    type: "rule-based",
    description: "Extract emails using regex pattern",
    icon: Code,
  },
  {
    id: "email-beautifulsoup",
    name: "BeautifulSoup Email Scraper",
    type: "library",
    description: "Extract emails from HTML pages",
    icon: Code,
  },
  {
    id: "email-cheerio",
    name: "Cheerio Email Scraper",
    type: "library",
    description: "Node.js HTML parser for email extraction",
    icon: Code,
  },
  {
    id: "email-hunter",
    name: "Hunter-style AI Extractor",
    type: "ai",
    description: "AI detection of emails from content",
    icon: Brain,
  },
  {
    id: "email-crawler",
    name: "Website Email Crawler",
    type: "crawler",
    description: "Crawl multiple pages and extract emails",
    icon: Code,
  },
];

const EmailScrapper = () => {
  const [scrappers, setScrappers] = useState(DEFAULT_EMAIL_SCRAPPERS);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", description: "" });

  const addScrapper = () => {
    if (!newTool.name) return;

    const tool = {
      id: Date.now().toString(),
      name: newTool.name,
      description: newTool.description,
      type: "custom",
      icon: Code,
    };

    // Add to default array also
    DEFAULT_EMAIL_SCRAPPERS.push(tool);

    // Update UI state
    setScrappers([...DEFAULT_EMAIL_SCRAPPERS]);
    setNewTool({ name: "", description: "" });
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Email Scrappers</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Scrapper
        </Button>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Scrapper</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              placeholder="Tool name"
              value={newTool.name}
              onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newTool.description}
              onChange={(e) =>
                setNewTool({ ...newTool, description: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addScrapper}>Add Scrapper</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scrappers.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selected?.id === tool.id;

          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                isSelected ? "border-blue-500" : "border-transparent"
              }`}
              onClick={() => setSelected(tool)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-medium">{tool.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
                <div className="text-xs text-gray-400 uppercase">
                  {tool.type}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected */}
      {selected && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Selected Scrapper</h3>
          <div className="text-sm">{selected.name}</div>
        </Card>
      )}
    </div>
  );
};

export default EmailScrapper;
