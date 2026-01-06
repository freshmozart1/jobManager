'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, FileText, Pencil, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
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

function hasCompensationInfo(job: Job): boolean {
    return hasSalary(job) || hasSalaryInfo(job) || (Array.isArray(job.benefits) && job.benefits.length > 0);
}

function hasCompanyInfo(job: Job): boolean {
    return !!(job.companyEmployeesCount || job.industries || job.companyWebsite || job.companyLinkedinUrl || job.companyDescription);
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

    const coverLetter = getCoverLetterArtifact(job);

    return (
        <>
            <div className="p-6 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Header Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{job.title}</CardTitle>
                            <CardDescription className="text-lg">{job.companyName}</CardDescription>
                            <CardAction>
                                <Button onClick={() => router.back()} variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Jobs
                                </Button>
                            </CardAction>
                        </CardHeader>
                    </Card>

                    {/* Quick Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        </CardContent>
                    </Card>

                    {/* Job Description Card */}
                    {job.descriptionHtml && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Job Description</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
                                />
                                {/* Additional metadata */}
                                {(job.jobFunction || (job.applicantsCount && job.applicantsCount !== 0 && job.applicantsCount !== '')) && (
                                    <div className="border-t pt-4 grid grid-cols-2 gap-4">
                                        {job.jobFunction && (
                                            <div>
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
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Cover Letter Card */}
                    {coverLetter && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle>Cover Letter</CardTitle>
                                </div>
                                <CardAction>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/jobs/${jobId}/write/cover`}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </Link>
                                    </Button>
                                </CardAction>
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
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Company Information Card */}
                    {hasCompanyInfo(job) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
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
                                {job.companyDescription && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">About</h4>
                                        <p className="text-sm mt-1">{job.companyDescription}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Compensation Card */}
                    {hasCompensationInfo(job) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Compensation & Benefits</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(hasSalary(job) || hasSalaryInfo(job)) && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Salary</h4>
                                        {hasSalary(job) && <p>{job.salary}</p>}
                                        {hasSalaryInfo(job) && (
                                            <p>
                                                {job.salaryInfo
                                                    .filter(info => typeof info === 'string' && info.trim() !== '')
                                                    .join(' - ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {job.benefits && job.benefits.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-muted-foreground">Benefits</h4>
                                        <ul className="list-disc list-inside text-sm mt-1">
                                            {job.benefits.map((benefit, idx) => (
                                                <li key={idx}>{benefit}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Sticky Actions Footer */}
            {(job.applyUrl || job.link) && (
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 flex justify-center gap-4">
                    {job.applyUrl && (
                        <Button asChild>
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                                Apply Now
                            </a>
                        </Button>
                    )}
                    {job.link && (
                        <Button asChild variant="outline">
                            <a href={job.link} target="_blank" rel="noopener noreferrer">
                                View on LinkedIn
                            </a>
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
