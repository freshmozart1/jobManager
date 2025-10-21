import { JobsTable } from "@/components/jobsTable";
import { runFilterAgent } from "@/lib/agents";
import { runFilterAgentMock } from "@/lib/filterAgentMock";
import { fetchJobs } from "@/lib/jobs";

import { Suspense } from "react";

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading jobs...</div>}>
            <JobsTable
                jobsPromise={fetchJobs()}
                filterAgent={runFilterAgentMock({ artificialDelayMsPerJob: 1000 })}
                className="col-span-4 col-start-1"
            />
        </Suspense>
    );
}