import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface UseJobsListStateOptions {
  includeDateRange?: boolean;
  debounceMs?: number;
  initialPageSize?: number;
}

export function useJobsListState(options?: UseJobsListStateOptions) {
  const includeDateRange = options?.includeDateRange ?? false;
  const debounceMs = options?.debounceMs ?? 350;
  const initialPageSize = options?.initialPageSize ?? 5;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, toolFilter, pageSize, dateFrom, dateTo]);

  return {
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    toolFilter,
    setToolFilter,
    dateFrom: includeDateRange ? dateFrom : undefined,
    setDateFrom: includeDateRange ? setDateFrom : undefined,
    dateTo: includeDateRange ? dateTo : undefined,
    setDateTo: includeDateRange ? setDateTo : undefined,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
}
