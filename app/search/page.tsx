'use client';
import { AppJobsTable } from "@/components/ui/appJobsTable";
import AppPromptsGrid from "@/components/ui/appPromptsGrid";
import { useEffect, useState } from "react";
import useToUrl from "@/hooks/useToUrl";
import { LoaderCircle } from "lucide-react";

export default function SearchPage() {
    const toUrl = useToUrl();
    const [dbJobs, setDbJobs] = useState<JobWithNewFlag[] | null>(null);
    const [prompts, setPrompts] = useState<PromptDocument[] | null>(null);
    const [promptId, setPromptId] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            fetch(toUrl('/api/jobs'), { signal: controller.signal }).then(res => res.json()).then((data: Job[]) => data.map(job => ({ ...job, postedAt: new Date(job.postedAt), new: false }))),
            fetch(toUrl('/api/prompts?agentType=filter'), { signal: controller.signal }).then(res => res.json()).then((data: PromptDocument[]) => data.map(prompt => ({ ...prompt, createdAt: new Date(prompt.createdAt), updatedAt: new Date(prompt.updatedAt) })))
        ]).then(([jobs, prompts]) => {
            setDbJobs(jobs);
            setPrompts(prompts);
        });
        return () => {
            if (controller.signal.aborted === false) {
                controller.abort('Component cleanup: either unmounting or dependencies changed');
            }
        };
    }, [toUrl]);

    useEffect(() => {
        console.log('promptId changed:', promptId);
        const controller = new AbortController();
        if (promptId) {
            console.log('Starting filtering for promptId:', promptId);
            fetch(toUrl('/api/mock/filter'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    promptId,
                    actorName: "curious_coder/linkedin-jobs-scraper"
                })
            }).then(res => res.json()).then((data: FilterAgentResult) => {
                data.jobs = data.jobs.map(job => ({ ...job, postedAt: new Date(job.postedAt), new: true }));
                data.rejects = data.rejects.map(job => ({ ...job, postedAt: new Date(job.postedAt) }));
                setDbJobs(prevDbJobs => {
                    if (!prevDbJobs) return data.jobs.map(j => ({ ...j, new: true }));
                    const existingJobIds = new Set(prevDbJobs.map(j => j.id));
                    const newJobs = data.jobs.filter(j => !existingJobIds.has(j.id)).map(j => ({ ...j, new: true }));
                    return [...newJobs, ...prevDbJobs];
                });
            }).catch(err => {
                if (err.name === 'AbortError') {
                    console.log('Filtering fetch aborted');
                } else {
                    console.error('Error during filtering fetch:', err);
                }
            }).finally(() => setPromptId(null));
        }
        return () => {
            if (controller.signal.aborted === false) {
                controller.abort('Component cleanup: either unmounting or dependencies changed');
            }
        };
    }, [promptId, toUrl]);

    return (
        dbJobs && prompts
            ? <>
                <AppJobsTable jobs={dbJobs} />
                <AppPromptsGrid prompts={prompts} onClick={(prompt: PromptDocument) => setPromptId(prompt._id)} filterAgentRunning={promptId !== null} />
            </>
            : <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading jobs and prompts from database</p>
                <LoaderCircle className="animate-spin" />
            </div>
    );
}