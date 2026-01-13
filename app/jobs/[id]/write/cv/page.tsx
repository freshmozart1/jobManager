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
    normalizeCvModel,
    sanitizeCvDraftForSave,
    type CvModel,
    type CvModelNormalized,
} from '@/lib/cvModel';

export default function CvPage() {
    const jobId = useParams().id as string;
    const router = useRouter();
    const toUrl = useToUrl();
    const [job, loading, error] = useLoadJob(jobId);
    const [personal, , personalLoading] = usePersonal();
    const initializedRef = useRef(false);
    const isFirstRender = useRef(true);
    const [cvModel, setCvModel] = useState<CvModelNormalized | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);
    const pendingPayloadRef = useRef<CvModel | null>(null);
    const debouncedCvModel = useDebounce(cvModel, 1000);
    const [initialModel, setInitialModel] = useState<CvModelNormalized | null>(null);
    const isDirty = cvModel && initialModel && JSON.stringify(cvModel) !== JSON.stringify(initialModel);

    useEffect(() => {
        if (initializedRef.current || !job || !personal) return;
        const existingArtifact = job.artifacts?.find((a) => a.type === 'cv');
        const model: CvModelNormalized = existingArtifact && existingArtifact.type === 'cv'
            ? normalizeCvModel(existingArtifact.content)
            : createEmptyCvModel();
        for (const headerField of ['name', 'email', 'phone'] as const) {
            if (!model.header[headerField]) model.header[headerField] = personal.contact?.[headerField] || '';
        }
        for (const addressField of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'] as const) {
            if (!model.header.address[addressField]) model.header.address[addressField] = personal.contact?.address?.[addressField] || '';
        }
        setInitialModel(model);
        setCvModel(model);
        initializedRef.current = true;
    }, [job, personal]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!initializedRef.current || !debouncedCvModel || !isDirty) return;
        (async () => {
            setSaveStatus('saving');
            setSaveError(null);
            const sanitized = sanitizeCvDraftForSave(debouncedCvModel);
            pendingPayloadRef.current = sanitized;
            try {
                if (!(await fetch(toUrl(`/api/jobs/${jobId}/artifacts`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'cv',
                        content: sanitized,
                    }),
                })).ok) throw new Error('Failed to save');
                pendingPayloadRef.current = null;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Error saving CV:', err);
                setSaveStatus('error');
                setSaveError('Failed to save. Will retry...');
            }
        })();
    }, [debouncedCvModel, jobId, toUrl, isDirty]);

    // Flush pending saves on beforeunload using sendBeacon
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pendingPayloadRef.current) navigator.sendBeacon(
                toUrl(`/api/jobs/${jobId}/artifacts`),
                JSON.stringify({
                    type: 'cv',
                    content: pendingPayloadRef.current,
                })
            );
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [jobId, toUrl]);

    // Update handler from editor
    const handleCvChange = useCallback((model: CvModel) => setCvModel(model as CvModelNormalized), []);

    if (loading || personalLoading) {
        return <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
            <p>Loading job details and personal information...</p>
            <LoaderCircle className="animate-spin" />
        </div>;
    }

    if (error || !job || !personal || !initialModel) {
        return <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
            <p className="text-destructive">
                {error || (!job ? 'Job' : !personal ? 'Personal information' : 'CV data') + ' not found'}
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>;
    }

    // Prepare available items from personal info
    const { education = [], experience = [], skills = [] } = personal;
    const availableEducation = personalEducationToCvEducation(education);
    const availableExperience = personalExperienceToCvExperience(experience);
    const availableSkills = personalSkillsToCvSkills(skills);

    return <div className="print:visible">
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
    </div>;
}
