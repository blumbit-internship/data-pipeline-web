import { createContext, useContext, type ReactNode } from "react";
import { useJobs, type Job, type StartJobInput } from "@/hooks/useJobs";

interface JobsContextType {
  jobs: Job[];
  addJob: (input: StartJobInput) => Promise<void>;
  stopJob: (id: string) => Promise<void>;
  restartJob: (
    id: string,
    opts?: { retryFailedOnly?: boolean; selectedProvider?: string; retryStatusBuckets?: string[] },
  ) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  reloadJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const jobsState = useJobs();
  return <JobsContext.Provider value={jobsState}>{children}</JobsContext.Provider>;
}

export function useJobsContext() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobsContext must be used within JobsProvider");
  return ctx;
}
