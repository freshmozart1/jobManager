import FilteredJobsList from "@/components/filteredJobsList";
import { runFilterAgent } from "@/lib/agents";
import { runFilterAgentMock } from "@/lib/filterAgentMock";
import { fetchJobs } from "@/lib/jobs";

import { Suspense } from "react";

export default function SearchPage() {
    return (
        <>
            <Suspense fallback={<div>Initializing agent...</div>}>
                <FilteredJobsList fetchJobs={fetchJobs()} filterAgent={runFilterAgentMock({ artificialDelayMsPerJob: 1000 })} />
            </Suspense>
        </>
    );
}