import { Job } from "@/types";
import { useCallback, useEffect, useState } from "react";
import useToUrl from "./useToUrl";


/**
 * Custom hook to load job details by LinkedIn job ID.
 * @param jobId The LinkedIn ID of the job in the database
 * @returns Job, loading state, error, and refetch function
 */
export default function useLoadJob(jobId: string): [Job | null, boolean, string | null, () => void] {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchKey, setFetchKey] = useState(0);
    const toUrl = useToUrl();

    const refetch = useCallback(() => {
        setFetchKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;
        setLoading(true);
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
                    const { postedAt, filteredAt, appliedAt, artifacts, ...rest } = result.payload;
                    return {
                        ...(rest as Omit<Job, 'postedAt' | 'filteredAt' | 'appliedAt' | 'artifacts'>),
                        postedAt: new Date(postedAt),
                        filteredAt: new Date(filteredAt),
                        ...(appliedAt ? { appliedAt: new Date(appliedAt) } : {}),
                        ...(artifacts ? {
                            artifacts: artifacts.map(a => ({
                                ...a,
                                createdAt: new Date(a.createdAt),
                                updatedAt: new Date(a.updatedAt)
                            }))
                        } : {})
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
    }, [jobId, toUrl, fetchKey]);

    return [job, loading, error, refetch];
}