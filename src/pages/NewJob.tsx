import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadPanel } from "@/components/FileUploadPanel";
import { useJobsContext } from "@/context/JobsContext";
import { useNavigate } from "react-router-dom";
import type { StartJobInput } from "@/hooks/useJobs";

const NewJob = () => {
  const { addJob } = useJobsContext();
  const navigate = useNavigate();

  const handleStart = async (input: StartJobInput) => {
    await addJob(input);
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Create a New Job</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your data file or paste a Google Sheets link, then select a processing tool.
          </p>
        </div>
        <FileUploadPanel onStartJob={handleStart} />
      </div>
    </DashboardLayout>
  );
};

export default NewJob;
