'use client'

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonalInformationEducation } from "@/types";

export type EducationDraft = {
    degree: string;
    field: string;
    institution: string;
    graduation_year: string;
};

export type EducationDraftErrors = Partial<Record<keyof EducationDraft, string>>;

export type AppEducationItemFormProps = {
    mode: "create" | "edit";
    initialValue?: PersonalInformationEducation;
    onSubmit: (item: PersonalInformationEducation) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
};

const DEFAULT_DRAFT: EducationDraft = {
    degree: "",
    field: "",
    institution: "",
    graduation_year: "",
};

function toDraft(source?: PersonalInformationEducation): EducationDraft {
    if (!source) return { ...DEFAULT_DRAFT };
    return {
        degree: source.degree,
        field: source.field,
        institution: source.institution,
        graduation_year: String(source.graduation_year),
    };
}

function toPayload(draft: EducationDraft): PersonalInformationEducation {
    return {
        degree: draft.degree.trim(),
        field: draft.field.trim(),
        institution: draft.institution.trim(),
        graduation_year: Number(draft.graduation_year),
    };
}

function validateDraft(draft: EducationDraft): EducationDraftErrors {
    const errors: EducationDraftErrors = {};

    if (!draft.degree.trim()) {
        errors.degree = "Degree is required.";
    }

    if (!draft.field.trim()) {
        errors.field = "Field of study is required.";
    }

    if (!draft.institution.trim()) {
        errors.institution = "Institution is required.";
    }

    const year = Number(draft.graduation_year);
    if (!draft.graduation_year || !Number.isFinite(year)) {
        errors.graduation_year = "Valid graduation year is required.";
    }

    return errors;
}

function areDraftsEqual(a: EducationDraft, b: EducationDraft): boolean {
    return (
        a.degree === b.degree &&
        a.field === b.field &&
        a.institution === b.institution &&
        a.graduation_year === b.graduation_year
    );
}

export default function AppEducationItemForm({
    mode,
    initialValue,
    onSubmit,
    onCancel,
    disabled,
}: AppEducationItemFormProps) {
    const [draft, setDraft] = useState<EducationDraft>(() => toDraft(initialValue));
    const [errors, setErrors] = useState<EducationDraftErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        setDraft(toDraft(initialValue));
        setErrors({});
        setHasSubmitted(false);
        setSubmitError(null);
    }, [initialValue]);

    const disableActions = disabled || isSaving;

    const isDirty = useMemo(() => {
        return !areDraftsEqual(draft, toDraft(initialValue));
    }, [draft, initialValue]);

    const handleSubmit = async () => {
        setHasSubmitted(true);
        const validation = validateDraft(draft);
        setErrors(validation);
        if (Object.keys(validation).length > 0) {
            return;
        }
        try {
            setIsSaving(true);
            setSubmitError(null);
            await onSubmit(toPayload(draft));
            onCancel?.();
        } catch (error) {
            console.error("Failed to save education item", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to save education item.");
        } finally {
            setIsSaving(false);
        }
    };

    const errorSummary = useMemo(() => {
        if (!hasSubmitted) return null;
        const messages = Object.values(errors).filter(Boolean) as string[];
        if (submitError) {
            messages.unshift(submitError);
        }
        return messages.length > 0 ? messages.join(" ") : null;
    }, [errors, submitError, hasSubmitted]);

    return (
        <div className="flex flex-col h-full w-full sm:w-[400px]">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">
                    {mode === "create" ? "Add education" : `Edit ${initialValue?.degree ?? "education"}`}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4" aria-live="polite">
                {errorSummary && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errorSummary}
                    </div>
                )}
                <div className="space-y-1.5">
                    <Label htmlFor="education-degree">Degree</Label>
                    <Input
                        id="education-degree"
                        value={draft.degree}
                        onChange={(event) => {
                            const next = event.target.value;
                            setDraft((prev) => ({ ...prev, degree: next }));
                            if (hasSubmitted && next.trim()) {
                                setErrors((prev) => {
                                    const nextErrors = { ...prev };
                                    delete nextErrors.degree;
                                    return nextErrors;
                                });
                            }
                        }}
                        disabled={disableActions}
                        aria-invalid={Boolean(hasSubmitted && errors.degree)}
                    />
                    {hasSubmitted && errors.degree && <p className="text-sm text-destructive">{errors.degree}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="education-field">Field of Study</Label>
                    <Input
                        id="education-field"
                        value={draft.field}
                        onChange={(event) => {
                            const next = event.target.value;
                            setDraft((prev) => ({ ...prev, field: next }));
                            if (hasSubmitted && next.trim()) {
                                setErrors((prev) => {
                                    const nextErrors = { ...prev };
                                    delete nextErrors.field;
                                    return nextErrors;
                                });
                            }
                        }}
                        disabled={disableActions}
                        aria-invalid={Boolean(hasSubmitted && errors.field)}
                    />
                    {hasSubmitted && errors.field && <p className="text-sm text-destructive">{errors.field}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="education-institution">Institution</Label>
                    <Input
                        id="education-institution"
                        value={draft.institution}
                        onChange={(event) => {
                            const next = event.target.value;
                            setDraft((prev) => ({ ...prev, institution: next }));
                            if (hasSubmitted && next.trim()) {
                                setErrors((prev) => {
                                    const nextErrors = { ...prev };
                                    delete nextErrors.institution;
                                    return nextErrors;
                                });
                            }
                        }}
                        disabled={disableActions}
                        aria-invalid={Boolean(hasSubmitted && errors.institution)}
                    />
                    {hasSubmitted && errors.institution && <p className="text-sm text-destructive">{errors.institution}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="education-year">Graduation Year</Label>
                    <Input
                        id="education-year"
                        type="number"
                        value={draft.graduation_year}
                        onChange={(event) => {
                            const next = event.target.value;
                            setDraft((prev) => ({ ...prev, graduation_year: next }));
                            if (hasSubmitted && next && Number.isFinite(Number(next))) {
                                setErrors((prev) => {
                                    const nextErrors = { ...prev };
                                    delete nextErrors.graduation_year;
                                    return nextErrors;
                                });
                            }
                        }}
                        disabled={disableActions}
                        aria-invalid={Boolean(hasSubmitted && errors.graduation_year)}
                    />
                    {hasSubmitted && errors.graduation_year && <p className="text-sm text-destructive">{errors.graduation_year}</p>}
                </div>
            </div>
            <div className="flex w-full justify-between gap-3 p-4 border-t mt-auto">
                <Button
                    variant="ghost"
                    type="button"
                    onClick={onCancel}
                    disabled={disableActions}
                >
                    Cancel
                </Button>
                <Button type="button" onClick={() => void handleSubmit()} disabled={disableActions || !isDirty}>
                    {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
        </div>
    );
}
