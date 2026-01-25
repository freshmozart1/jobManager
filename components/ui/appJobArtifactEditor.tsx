'use client';
import { useRouter } from 'next/navigation';
import { Plus, FileText, FileUser } from 'lucide-react';
import AppEditableCard from '@/components/ui/appItemEditor/appEditableCard';
import { cn } from '@/lib/utils';
import type { JobArtifact } from '@/types';

type AppJobArtifactEditorProps = {
    jobId: string;
    artifacts?: JobArtifact[];
    disabled?: boolean;
};

export default function AppJobArtifactEditor({ jobId, artifacts = [], disabled = false }: AppJobArtifactEditorProps) {
    const router = useRouter();

    // Resolve artifacts by type
    const coverLetterArtifact = artifacts.find((a) => a.type === 'cover-letter');
    const cvArtifact = artifacts.find((a) => a.type === 'cv');

    const handleCoverLetterEdit = () => {
        router.push(`/jobs/${jobId}/write/cover`);
    };

    const handleCoverLetterDelete = () => {
        console.info('delete artifact', { jobId, type: 'cover-letter' });
    };

    const handleCvEdit = () => {
        router.push(`/jobs/${jobId}/write/cv`);
    };

    const handleCvDelete = () => {
        console.info('delete artifact', { jobId, type: 'cv' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Letter Slot */}
            {coverLetterArtifact ? (
                <AppEditableCard
                    title={
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span>Cover Letter</span>
                        </div>
                    }
                    editAriaLabel="Edit cover letter"
                    deleteAriaLabel="Delete cover letter"
                    onEdit={handleCoverLetterEdit}
                    onDelete={handleCoverLetterDelete}
                    disabled={disabled}
                >
                    <div className="space-y-3">
                        {coverLetterArtifact.subject && (
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground">Subject</h4>
                                <p className="font-medium">{coverLetterArtifact.subject}</p>
                            </div>
                        )}
                        {coverLetterArtifact.content && (
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground">Content Preview</h4>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {coverLetterArtifact.content}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                            <span>Created: {coverLetterArtifact.createdAt.toLocaleDateString()}</span>
                            <span>Updated: {coverLetterArtifact.updatedAt.toLocaleDateString()}</span>
                        </div>
                    </div>
                </AppEditableCard>
            ) : (
                <button
                    type="button"
                    onClick={handleCoverLetterEdit}
                    disabled={disabled}
                    className={cn(
                        'flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring',
                        disabled && 'cursor-not-allowed opacity-60'
                    )}
                >
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Add cover letter
                    </span>
                </button>
            )}

            {/* CV Slot */}
            {cvArtifact ? (
                <AppEditableCard
                    title={
                        <div className="flex items-center gap-2">
                            <FileUser className="h-5 w-5 text-muted-foreground" />
                            <span>CV</span>
                        </div>
                    }
                    editAriaLabel="Edit CV"
                    deleteAriaLabel="Delete CV"
                    onEdit={handleCvEdit}
                    onDelete={handleCvDelete}
                    disabled={disabled}
                >
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Content Preview</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {cvArtifact.content?.header?.name || 'Untitled CV'} • {cvArtifact.content?.slots?.experience?.length || 0} experience items
                            </p>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                            <span>Created: {cvArtifact.createdAt.toLocaleDateString()}</span>
                            <span>Updated: {cvArtifact.updatedAt.toLocaleDateString()}</span>
                        </div>
                    </div>
                </AppEditableCard>
            ) : (
                <button
                    type="button"
                    onClick={handleCvEdit}
                    disabled={disabled}
                    className={cn(
                        'flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring',
                        disabled && 'cursor-not-allowed opacity-60'
                    )}
                >
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Add CV
                    </span>
                </button>
            )}
        </div>
    );
}
