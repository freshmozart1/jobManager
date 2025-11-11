import { Job } from "@/types";
import { useEffect, useState } from "react";
import useToUrl from "./useToUrl";


/**
 * Custom hook to load job details by LinkedIn job ID.
 * @param jobId The LinkedIn ID of the job in the database
 * @returns Job, loading state and error
 */
export default function useLoadJob(jobId: string): [Job | null, boolean, string | null] {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const toUrl = useToUrl();

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;
        fetch(toUrl(`/api/jobs/${jobId}`), { signal: controller.signal })
            .then(async res => {
                if (res.status === 404) {
                    return { kind: 'error', message: 'Job not found' } as const;
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch job details');
                }
                const payload = await res.json() as Job;
                return { kind: 'success', payload } as const;
            })
            .then(result => {
                if (!isActive) return;
                if (result.kind === 'error') {
                    setError(result.message);
                    setJob(null);
                    return;
                }
                setJob(() => {
                    const { postedAt, filteredAt, ...rest } = result.payload;
                    return {
                        ...(rest as Omit<Job, 'postedAt' | 'filteredAt'>),
                        postedAt: new Date(postedAt),
                        filteredAt: new Date(filteredAt)
                    };
                });
                setError(null);
            })
            .catch(err => {
                if (!isActive) return;
                if (err.name !== 'AbortError') {
                    setError('Failed to load job details');
                }
            })
            .finally(() => {
                if (!isActive) return;
                setLoading(false);
            });
        return () => {
            isActive = false;
            controller.abort();
        };
    }, [jobId, toUrl]);

    return [job, loading, error];
}