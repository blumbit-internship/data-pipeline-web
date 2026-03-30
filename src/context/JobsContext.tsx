import { createContext, useContext, type ReactNode } from "react";
import { useJobs, type Job, type StartJobInput } from "@/hooks/useJobs";

interface JobsContextType {
  jobs: Job[];
  addJob: (input: StartJobInput) => Promise<void>;
  stopJob: (id: string) => void;
  restartJob: (id: string) => void;
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
