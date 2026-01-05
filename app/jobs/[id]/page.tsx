'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, FileText, Pencil } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppDatePicker from '@/components/ui/appDatePicker';
import { Job, JobArtifact } from '@/types';
import useLoadJob from '@/hooks/useLoadJob';
import useToUrl from '@/hooks/useToUrl';

function getCoverLetterArtifact(job: Job): JobArtifact | undefined {
    return job.artifacts?.find(a => a.type === 'cover-letter');
}

function hasSalary(job: Job): boolean {
    return typeof job.salary === 'string' && job.salary.trim() !== '';
}

function hasSalaryInfo(job: Job): boolean {
    return Array.isArray(job.salaryInfo) && job.salaryInfo.some(info => typeof info === 'string' && info.trim() !== '');
}

function renderSalaryInfo(job: Job) {
    if (!hasSalary(job) && !hasSalaryInfo(job)) return null;
    return (
        <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Salary Information</h3>
            {hasSalary(job) && <p>{job.salary}</p>}
            {hasSalaryInfo(job) && (
                <p>
                    {job.salaryInfo
                        .filter(info => typeof info === 'string' && info.trim() !== '')
                        .join(' - ')}
                </p>
            )}
        </div>
    );
}

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const [job, loading, error, refetch] = useLoadJob(jobId);
    const toUrl = useToUrl();
    const [appliedAtUpdating, setAppliedAtUpdating] = useState(false);
    const [appliedAtError, setAppliedAtError] = useState<string | null>(null);

    const handleAppliedAtChange = async (date: Date | undefined) => {
        setAppliedAtUpdating(true);
        setAppliedAtError(null);
        try {
            const response = await fetch(toUrl(`/api/jobs/${jobId}/apply`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appliedAt: date ? date.toISOString() : null }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update applied date');
            }
            refetch();
        } catch (err) {
            setAppliedAtError(err instanceof Error ? err.message : 'Failed to update applied date');
        } finally {
            setAppliedAtUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading job details...</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p className="text-destructive">{error || 'Job not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div>
            <Button onClick={() => router.back()} variant="outline">
                ← Back to Jobs
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription className="text-lg">{job.companyName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {job.location && (
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Location</h3>
                                <p>{job.location}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">Posted Date</h3>
                            <p>{job.postedAt.toLocaleDateString()}</p>
                        </div>
                        {job.employmentType && (
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Employment Type</h3>
                                <p>{job.employmentType}</p>
                            </div>
                        )}
                        {job.seniorityLevel && (
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Seniority Level</h3>
                                <p>{job.seniorityLevel}</p>
                            </div>
                        )}
                        <AppDatePicker
                            id="applied-at"
                            label="Applied At"
                            value={job.appliedAt}
                            onChange={handleAppliedAtChange}
                            disabled={appliedAtUpdating}
                            placeholder="Select when you applied"
                            description={appliedAtUpdating ? 'Updating...' : undefined}
                            error={appliedAtError || undefined}
                        />
                    </div>

                    {/* Salary Information */}
                    {renderSalaryInfo(job)}
                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Benefits</h3>
                            <ul className="list-disc list-inside">
                                {job.benefits.map((benefit, idx) => (
                                    <li key={idx}>{benefit}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Company Information */}
                    {(job.companyEmployeesCount || job.industries || job.companyWebsite || job.companyLinkedinUrl || job.companyDescription) && (
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-lg mb-4">Company Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.companyEmployeesCount && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Company Size</h4>
                                        <p>{job.companyEmployeesCount} employees</p>
                                    </div>
                                )}
                                {job.industries && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Industries</h4>
                                        <p>{job.industries}</p>
                                    </div>
                                )}
                                {job.companyWebsite && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Website</h4>
                                        <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {job.companyWebsite}
                                        </a>
                                    </div>
                                )}
                                {job.companyLinkedinUrl && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">LinkedIn</h4>
                                        <a href={job.companyLinkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            View on LinkedIn
                                        </a>
                                    </div>
                                )}
                            </div>
                            {job.companyDescription && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                                    <p className="mt-2">{job.companyDescription}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {job.descriptionHtml && (
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-lg mb-4">Job Description</h3>
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
                            />
                        </div>
                    )}

                    {/* Additional Information */}
                    {job.jobFunction && (
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-sm text-muted-foreground">Job Function</h3>
                            <p>{job.jobFunction}</p>
                        </div>
                    )}

                    {(job.applicantsCount && job.applicantsCount !== 0 && job.applicantsCount !== '') && (
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">Applicants</h3>
                            <p>{job.applicantsCount} applicants</p>
                        </div>
                    )}

                    {/* Cover Letter Card */}
                    {(() => {
                        const coverLetter = getCoverLetterArtifact(job);
                        if (!coverLetter) return null;
                        return (
                            <div className="border-t pt-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-lg">Cover Letter</CardTitle>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/jobs/${jobId}/write/cover`}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Link>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {coverLetter.subject && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Subject</h4>
                                                <p className="font-medium">{coverLetter.subject}</p>
                                            </div>
                                        )}
                                        {coverLetter.recipient && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Recipient</h4>
                                                <p className="whitespace-pre-line text-sm">{coverLetter.recipient}</p>
                                            </div>
                                        )}
                                        {coverLetter.content && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Content Preview</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {coverLetter.content}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                                            <span>Created: {coverLetter.createdAt.toLocaleDateString()}</span>
                                            <span>Updated: {coverLetter.updatedAt.toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })()}

                    {/* Apply Button */}
                    {(job.applyUrl || job.link) && (
                        <div className="border-t pt-6 flex gap-4">
                            {job.applyUrl && (
                                <Button asChild className="w-full md:w-auto">
                                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                                        Apply Now
                                    </a>
                                </Button>
                            )}
                            {job.link && (
                                <Button asChild variant="outline" className="w-full md:w-auto">
                                    <a href={job.link} target="_blank" rel="noopener noreferrer">
                                        View on LinkedIn
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
