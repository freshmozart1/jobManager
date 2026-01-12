'use client';

import { Button } from '@/components/ui/button';
import AppCvEditor from '@/components/ui/AppCvEditor';
import useDebounce from '@/hooks/useDebounce';
import useLoadJob from '@/hooks/useLoadJob';
import usePersonal from '@/hooks/usePersonal';
import useToUrl from '@/hooks/useToUrl';
import { Check, LoaderCircle, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    createEmptyCvModel,
    personalEducationToCvEducation,
    personalExperienceToCvExperience,
    personalSkillsToCvSkills,
    type CvModel,
} from '@/lib/cvModel';

export default function CvPage() {
    const jobId = useParams().id as string;
    const router = useRouter();
    const toUrl = useToUrl();
    const [job, loading, error] = useLoadJob(jobId);
    const [personal, , personalLoading] = usePersonal();

    // Track if initial values have been set
    const initializedRef = useRef(false);

    // CV content (CvModel object)
    const [cvModel, setCvModel] = useState<CvModel | null>(null);

    // Save status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);

    // Pending save ref for beforeunload flush
    const pendingPayloadRef = useRef<CvModel | null>(null);

    // Debounced content for auto-save (1000ms)
    const debouncedCvModel = useDebounce(cvModel, 1000);

    // Initial model state
    const [initialModel, setInitialModel] = useState<CvModel | null>(null);

    // Validate if model can be saved
    const canAutosave = (model: CvModel | null): boolean => {
        if (!model) return false;
        const { address } = model.header;
        return !!(
            address.streetAddress?.trim() &&
            address.addressLocality?.trim() &&
            address.addressRegion?.trim() &&
            address.postalCode?.trim() &&
            address.addressCountry?.trim()
        );
    };

    // Check if model has changed from initial
    const isDirty = cvModel && initialModel && JSON.stringify(cvModel) !== JSON.stringify(initialModel);

    // Initialize form from existing artifact or defaults
    useEffect(() => {
        if (initializedRef.current || !job || !personal) return;

        const existingArtifact = job.artifacts?.find((a) => a.type === 'cv');

        // Use existing CvModel or create empty model
        let model: CvModel;
        if (existingArtifact && existingArtifact.type === 'cv' && typeof existingArtifact.content === 'object') {
            model = existingArtifact.content;
        } else {
            model = createEmptyCvModel();
        }

        // Prefill header from personal info if empty
        if (!model.header.name) {
            model.header.name = personal.contact?.name || '';
            model.header.email = personal.contact?.email || '';
            model.header.phone = personal.contact?.phone || '';
        }

        // Prefill address from personal info if empty
        if (!model.header.address.streetAddress) {
            model.header.address.streetAddress = personal.contact?.address?.streetAddress || '';
        }
        if (!model.header.address.addressLocality) {
            model.header.address.addressLocality = personal.contact?.address?.addressLocality || '';
        }
        if (!model.header.address.addressRegion) {
            model.header.address.addressRegion = personal.contact?.address?.addressRegion || '';
        }
        if (!model.header.address.postalCode) {
            model.header.address.postalCode = personal.contact?.address?.postalCode || '';
        }
        if (!model.header.address.addressCountry) {
            model.header.address.addressCountry = personal.contact?.address?.addressCountry || '';
        }

        setInitialModel(model);
        setCvModel(model);
        initializedRef.current = true;
    }, [job, personal]);

    // Auto-save when debounced content changes
    const isFirstRender = useRef(true);
    useEffect(() => {
        // Skip the first render and skip if not initialized
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!initializedRef.current || !debouncedCvModel) return;

        // Check if model can be saved
        if (!canAutosave(debouncedCvModel)) {
            // Show draft status only if model has been edited
            if (isDirty) {
                setSaveStatus('idle');
                setSaveError('Draft (not saved)');
            }
            return;
        }

        const saveArtifact = async () => {
            setSaveStatus('saving');
            setSaveError(null);
            pendingPayloadRef.current = debouncedCvModel;

            try {
                const response = await fetch(toUrl(`/api/jobs/${jobId}/artifacts`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'cv',
                        content: debouncedCvModel,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save');
                }

                pendingPayloadRef.current = null;
                setSaveStatus('saved');

                // Reset to idle after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Error saving CV:', err);
                setSaveStatus('error');
                setSaveError('Failed to save. Will retry...');
            }
        };

        saveArtifact();
    }, [debouncedCvModel, jobId, toUrl, isDirty]);

    // Flush pending saves on beforeunload using sendBeacon
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pendingPayloadRef.current && canAutosave(pendingPayloadRef.current)) {
                navigator.sendBeacon(
                    toUrl(`/api/jobs/${jobId}/artifacts`),
                    JSON.stringify({
                        type: 'cv',
                        content: pendingPayloadRef.current,
                    })
                );
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [jobId, toUrl]);

    // Update handler from editor
    const handleCvChange = useCallback((model: CvModel) => {
        setCvModel(model);
    }, []);

    if (loading || personalLoading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading job details and personal information...</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error || !job || !personal || !initialModel) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p className="text-destructive">
                    {error || (!job ? 'Job' : !personal ? 'Personal information' : 'CV data') + ' not found'}
                </p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    // Prepare available items from personal info
    const availableEducation = personalEducationToCvEducation(personal.education || []);
    const availableExperience = personalExperienceToCvExperience(personal.experience || []);
    const availableSkills = personalSkillsToCvSkills(personal.skills || []);

    return (
        <div className="print:visible">
            {/* Save status indicator */}
            <div className="fixed top-4 right-4 flex items-center gap-2 text-sm print:hidden z-50">
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
                {saveStatus === 'idle' && saveError && (
                    <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-600">{saveError}</span>
                    </>
                )}
            </div>

            <AppCvEditor
                initialModel={initialModel}
                availableEducation={availableEducation}
                availableExperience={availableExperience}
                availableSkills={availableSkills}
                onChange={handleCvChange}
            />
        </div>
    );
}
