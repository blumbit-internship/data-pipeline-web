import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ToolDefinition } from "@/types/tools";

interface JobsListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  toolFilter: string;
  onToolFilterChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  tools: ToolDefinition[];
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
}

export function JobsListFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  toolFilter,
  onToolFilterChange,
  pageSize,
  onPageSizeChange,
  tools,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: JobsListFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by file name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-40">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select value={toolFilter} onValueChange={onToolFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Tools" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tools</SelectItem>
          {tools.map((tool) => (
            <SelectItem key={tool.id} value={tool.name}>
              {tool.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {typeof dateFrom === "string" && onDateFromChange && (
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-[165px]"
        />
      )}
      {typeof dateTo === "string" && onDateToChange && (
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-[165px]"
        />
      )}
      <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 / page</SelectItem>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="25">25 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
          <SelectItem value="100">100 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
