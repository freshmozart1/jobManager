'use client';

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrapedJob } from "@/types";
import { cn } from "@/lib/utils";

const ACTOR_NAME = 'curious_coder/linkedin-jobs-scraper';
const CARD_OFFSET_Y = 12;
const CARD_SCALE_STEP = 0.02;

type FeedbackLabel = 'like' | 'dislike';

type FetchState = {
    status: 'idle' | 'loading' | 'ready' | 'error';
    message?: string;
};

export default function AppTriage() {
    const [jobs, setJobs] = useState<ScrapedJob[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' });

    useEffect(() => {
        let isMounted = true;
        setFetchState({ status: 'loading' });
        fetch(`/api/jobs/scrape?actorName=${encodeURIComponent(ACTOR_NAME)}&count=10`)
            .then(async res => {
                const text = await res.text();
                if (!res.ok) throw new Error(text || 'Failed to load jobs');
                return JSON.parse(text) as ScrapedJob[];
            })
            .then(data => {
                if (!isMounted) return;
                setJobs(data.slice(0, 10));
                setFetchState({ status: 'ready' });
            })
            .catch(error => {
                if (!isMounted) return;
                setFetchState({ status: 'error', message: error?.message ?? 'Failed to load jobs' });
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const remainingJobs = useMemo(() => jobs.slice(currentIndex), [jobs, currentIndex]);
    const activeJob = remainingJobs[0];

    const handleFeedback = (job: ScrapedJob, label: FeedbackLabel) => {
        void fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job, label })
        }).catch(() => undefined);
        setCurrentIndex(prev => prev + 1);
    };

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
            <div>
                <h1 className="text-2xl font-semibold">Job Triage</h1>
                <p className="text-sm text-muted-foreground">Review 10 recent jobs and mark them as like or dislike.</p>
            </div>

            {fetchState.status === 'loading' && (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Loading jobs…</div>
            )}

            {fetchState.status === 'error' && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
                    {fetchState.message || 'Failed to load jobs.'}
                </div>
            )}

            {fetchState.status === 'ready' && remainingJobs.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No more jobs to review.</div>
            )}

            {fetchState.status === 'ready' && remainingJobs.length > 0 && (
                <div className="relative min-h-[560px]">
                    {remainingJobs.map((job, index) => {
                        const stackIndex = index;
                        const isTop = stackIndex === 0;
                        const scale = 1 - Math.min(stackIndex, 8) * CARD_SCALE_STEP;
                        const translateY = stackIndex * CARD_OFFSET_Y;
                        return (
                            <div
                                key={job.id}
                                className="absolute inset-0"
                                style={{
                                    transform: `translateY(${translateY}px) scale(${scale})`,
                                    zIndex: 100 - stackIndex
                                }}
                            >
                                <Card
                                    className={cn(
                                        "h-full w-full",
                                        isTop ? "pointer-events-auto" : "pointer-events-none"
                                    )}
                                >
                                    <CardHeader className="space-y-2">
                                        <CardTitle className="text-xl">{job.title}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {job.companyName} • {job.location}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex h-full flex-col gap-4 pb-8">
                                        <div className="text-sm text-muted-foreground">
                                            <p><span className="font-medium text-foreground">Employment:</span> {job.employmentType}</p>
                                            <p><span className="font-medium text-foreground">Seniority:</span> {job.seniorityLevel || 'Not specified'}</p>
                                            <p><span className="font-medium text-foreground">Salary:</span> {job.salary || 'Not listed'}</p>
                                        </div>
                                        <div className="text-sm leading-relaxed text-muted-foreground">
                                            {job.descriptionText}
                                        </div>
                                        {isTop && (
                                            <div className="mt-auto flex gap-3">
                                                <Button
                                                    variant="secondary"
                                                    className="flex-1"
                                                    onClick={() => handleFeedback(job, 'dislike')}
                                                >
                                                    Dislike
                                                </Button>
                                                <Button
                                                    className="flex-1"
                                                    onClick={() => handleFeedback(job, 'like')}
                                                >
                                                    Like
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeJob && fetchState.status === 'ready' && (
                <div className="text-sm text-muted-foreground">{currentIndex + 1} / {jobs.length} reviewed</div>
            )}
        </div>
    );
}
