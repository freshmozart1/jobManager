'use client';
import { AppJobsTable } from "@/components/ui/appJobsTable";
import { useEffect, useState } from "react";
import useToUrl from "@/hooks/useToUrl";
import { LoaderCircle } from "lucide-react";
import { Job, JobWithNewFlag } from "@/types";

export default function SearchPage() {
    const toUrl = useToUrl();
    const [dbJobs, setDbJobs] = useState<JobWithNewFlag[] | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(toUrl('/api/jobs?filterResult=true'), { signal: controller.signal })
            .then(res => res.json())
            .then((data: Job[]) => data.map(job => ({ ...job, postedAt: new Date(job.postedAt), new: false })))
            .then(jobs => setDbJobs(jobs));
        return () => {
            if (controller.signal.aborted === false) {
                controller.abort('Component cleanup: either unmounting or dependencies changed');
            }
        };
    }, [toUrl]);

    return (
        dbJobs
            ? <>
                <AppJobsTable jobs={dbJobs} />
            </>
            : <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading jobs from database</p>
                <LoaderCircle className="animate-spin" />
            </div>
    );
}