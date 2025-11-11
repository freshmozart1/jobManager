'use client';
import { useParams, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Job } from '@/types';
import useLoadJob from '@/hooks/useLoadJob';

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
    const [job, loading, error] = useLoadJob(jobId);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
