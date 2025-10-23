import { AppJobsTable } from "@/components/ui/appJobsTable";
import { NoBaseUrlError } from "@/lib/errors";
import { runFilterAgentMock } from "@/lib/filterAgentMock";
import { ObjectId } from "mongodb";
import { Suspense, useCallback, useMemo } from "react";

export default function SearchPage() {
    const BASE_URL = useMemo(() => process.env.BASE_URL, []);
    if (!BASE_URL) throw new NoBaseUrlError();
    const fetchJobs = useCallback((apiEndpoint: string) => fetch(apiEndpoint).then(res => res.json()).then(data => (data as Job[]).map(job => ({ ...job, postedAt: new Date(job.postedAt) }))), []);
    return (
        <Suspense fallback={<div>Loading jobs...</div>}>
            <AppJobsTable
                jobsPromise={fetchJobs(`${BASE_URL}/api/jobs`)}
                filterAgent={runFilterAgentMock(new ObjectId(), { artificialDelayMsPerJob: 1000 })}
                className="col-span-4 col-start-1"
            />
        </Suspense>
    );
}