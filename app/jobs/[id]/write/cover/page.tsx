'use client';

import { Button } from "@/components/ui/button";
import AppCoverLetterForm, { CoverLetterFormState } from "@/components/ui/appCoverLetterForm";
import useDebounce from "@/hooks/useDebounce";
import useLoadJob from "@/hooks/useLoadJob";
import usePersonal from "@/hooks/usePersonal";
import useToUrl from "@/hooks/useToUrl";
import { Check, LoaderCircle, AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function CoverPage() {
    const jobId = useParams().id as string;
    const router = useRouter();
    const toUrl = useToUrl();
    const [job, loading, error] = useLoadJob(jobId);
    const [personal, , personalLoading] = usePersonal();

    // Track if initial values have been set
    const initializedRef = useRef(false);

    // Form state
    const [formState, setFormState] = useState<CoverLetterFormState>({
        subject: '',
        content: '',
        recipient: '',
        applicant: ''
    });

    // Save status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);

    // Pending save ref for beforeunload flush
    const pendingPayloadRef = useRef<CoverLetterFormState | null>(null);

    // Debounced form state for auto-save (1000ms)
    const debouncedFormState = useDebounce(formState, 1000);

    // Initialize form from existing artifact or defaults
    useEffect(() => {
        if (initializedRef.current || !job || !personal) return;

        const existingArtifact = job.artifacts?.find(a => a.type === 'cover-letter');

        const defaultRecipient = `${job.companyName}\n${job.companyAddress?.streetAddress ?? ''}\n${job.companyAddress?.postalCode ?? ''} ${job.companyAddress?.addressLocality ?? ''}`.trim();
        const defaultApplicant = `${personal.contact.name}\n${personal.contact.email}\n${personal.contact.phone}\n${new Date().toLocaleDateString()}`;

        setFormState({
            subject: existingArtifact?.subject ?? '',
            content: existingArtifact?.content ?? '',
            recipient: existingArtifact?.recipient ?? defaultRecipient,
            applicant: existingArtifact?.applicant ?? defaultApplicant
        });

        initializedRef.current = true;
    }, [job, personal]);

    // Auto-save when debounced form state changes
    const isFirstRender = useRef(true);
    useEffect(() => {
        // Skip the first render and skip if not initialized
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!initializedRef.current) return;

        const saveArtifact = async () => {
            setSaveStatus('saving');
            setSaveError(null);
            pendingPayloadRef.current = debouncedFormState;

            try {
                const response = await fetch(toUrl(`/api/jobs/${jobId}/artifacts`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'cover-letter',
                        content: debouncedFormState.content,
                        subject: debouncedFormState.subject,
                        recipient: debouncedFormState.recipient,
                        applicant: debouncedFormState.applicant
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save');
                }

                pendingPayloadRef.current = null;
                setSaveStatus('saved');

                // Reset to idle after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Error saving cover letter:', err);
                setSaveStatus('error');
                setSaveError('Failed to save. Will retry...');
            }
        };

        saveArtifact();
    }, [debouncedFormState, jobId, toUrl]);

    // Flush pending saves on beforeunload using sendBeacon
    useEffect(
        () => {
            const handleBeforeUnload = () => {
                if (pendingPayloadRef.current) navigator.sendBeacon(toUrl(`/api/jobs/${jobId}/artifacts`), JSON.stringify({
                    type: 'cover-letter',
                    content: pendingPayloadRef.current.content,
                    subject: pendingPayloadRef.current.subject,
                    recipient: pendingPayloadRef.current.recipient,
                    applicant: pendingPayloadRef.current.applicant
                }));
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        },
        [jobId, toUrl]
    );

    // Update handlers
    const updateFormState = useCallback((newState: CoverLetterFormState) => {
        setFormState(newState);
    }, []);

    if (loading || personalLoading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading job details and personal information...</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error || !job || !personal) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p className="text-destructive">{error || (!job ? 'Job' : 'Personal information') + ' not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return <div className="print:visible">
        {/* Save status indicator */}
        <div className="fixed top-4 right-4 flex items-center gap-2 text-sm print:hidden">
            {saveStatus === 'saving' && (
                <>
                    <LoaderCircle className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving...</span>
                </>
            )}
            {saveStatus === 'saved' && (
                <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                </>
            )}
            {saveStatus === 'error' && (
                <>
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">{saveError}</span>
                </>
            )}
        </div>

        <AppCoverLetterForm
            value={formState}
            onChange={updateFormState}
        />
    </div>;
}