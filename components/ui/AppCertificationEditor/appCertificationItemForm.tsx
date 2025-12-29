import { PersonalInformationCertification } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Label } from "../label";
import { Input } from "../input";
import AppMonthYearPicker from "../appMonthYearPicker";
import { Button } from "../button";
import { LoaderCircle } from "lucide-react";

type CertificationDraftErrors = Partial<Record<keyof PersonalInformationCertification, string>>;

type AppCertificationItemFormProps = {
    mode: "create" | "edit";
    initialValue?: PersonalInformationCertification;
    onSubmit: (item: PersonalInformationCertification) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
};

const DEFAULT_CERTIFICATION_DRAFT: PersonalInformationCertification = {
    name: "",
    issued: "",
    expires: null,
};

function validateDraft(draft: PersonalInformationCertification): CertificationDraftErrors {
    const errors: CertificationDraftErrors = {};

    if (!draft.name.trim()) {
        errors.name = "Certification name is required.";
    }

    if (!draft.issued.trim()) {
        errors.issued = "Issued date is required.";
    } else if (isNaN(Date.parse(draft.issued))) {
        errors.issued = "Issued date is invalid.";
    }

    if (draft.expires && isNaN(Date.parse(draft.expires))) {
        errors.expires = "Expiration date is invalid.";
    }

    return errors;
}

export default function AppCertificationItemForm({
    mode,
    initialValue = DEFAULT_CERTIFICATION_DRAFT,
    onSubmit,
    onCancel,
    disabled
}: AppCertificationItemFormProps) {
    const [draft, setDraft] = useState<PersonalInformationCertification>(initialValue);
    const [errors, setErrors] = useState<CertificationDraftErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const disableActions = disabled || isSaving;
    const isDirty = JSON.stringify(draft) !== JSON.stringify(initialValue);

    const handleSubmit = async () => {
        setHasSubmitted(true);
        const validationErrors = validateDraft(draft);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
        try {
            setIsSaving(true);
            setSubmitError(null);
            await onSubmit(draft);
        } catch (error) {
            console.error("Failed to save certification item:", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to save certification item.");
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
        return messages.length > 0 ? messages.join(' ') : null;
    }, [errors, submitError, hasSubmitted]);

    useEffect(() => {
        setDraft(initialValue ?? DEFAULT_CERTIFICATION_DRAFT);
        setErrors({});
        setHasSubmitted(false);
        setIsSaving(false);
        setSubmitError(null);
    }, [initialValue]);

    return <div className="flex flex-col h-full w-full sm:w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
                {mode === "create" ? "Add certificate" : `Edit ${initialValue?.name ?? "certificate"}`}
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-4" aria-live="polite">
            {errorSummary && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorSummary}
                </div>
            )}
            <div className="space-y-1.5">
                <Label htmlFor="certification-name">Name</Label>
                <Input
                    id="certification-name"
                    value={draft.name}
                    onChange={(event) => {
                        const next = event.target.value;
                        setDraft((prev) => ({ ...prev, name: next }));
                        if (hasSubmitted && next.trim()) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                delete nextErrors.name;
                                return nextErrors;
                            });
                        }
                    }}
                    disabled={disableActions}
                    aria-invalid={Boolean(hasSubmitted && errors.name)}
                />
                {hasSubmitted && errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AppMonthYearPicker
                    id="certification-issued"
                    label="Issued"
                    value={draft.issued ? new Date(draft.issued) : undefined}
                    onChange={(date) => {
                        const isoString = date?.toISOString() ?? "";
                        setDraft((prev) => ({ ...prev, issued: isoString }));
                        if (hasSubmitted) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                if (isoString.trim()) {
                                    delete nextErrors.issued;
                                } else {
                                    nextErrors.issued = "Issued date is required.";
                                }
                                return nextErrors;
                            });
                        }
                    }}
                    required
                    disabled={disableActions}
                    error={hasSubmitted ? errors.issued : undefined}
                />
                <AppMonthYearPicker
                    id="certification-expires"
                    label="Expires"
                    value={draft.expires ? new Date(draft.expires) : undefined}
                    onChange={(date) => {
                        const isoString = date?.toISOString() ?? null;
                        setDraft((prev) => ({ ...prev, expires: isoString }));
                        if (hasSubmitted) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                if (isoString === null || isoString.trim()) {
                                    delete nextErrors.expires;
                                } else {
                                    nextErrors.expires = "Expiration date is invalid.";
                                }
                                return nextErrors;
                            });
                        }
                    }}
                    disabled={disableActions}
                    error={hasSubmitted ? errors.expires : undefined}
                />
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
    </div>
}