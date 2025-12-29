import { PersonalInformationLanguageSpoken } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Button } from "../button";
import { LoaderCircle } from "lucide-react";
import { AppCategoryCombobox } from "../appCategoryCombobox";

type LanguageDraftErrors = Partial<Record<keyof PersonalInformationLanguageSpoken, string>>;

type AppLanguageItemFormProps = {
    mode: "create" | "edit";
    initialValue?: PersonalInformationLanguageSpoken;
    onSubmit: (item: PersonalInformationLanguageSpoken) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
};

const DEFAULT_LANGUAGE_DRAFT: PersonalInformationLanguageSpoken = {
    language: "",
    level: "",
};

const LANGUAGE_LEVEL_OPTIONS = [
    "Native",
    "Fluent",
    "Advanced",
    "Intermediate",
    "Basic",
];

function validateDraft(draft: PersonalInformationLanguageSpoken): LanguageDraftErrors {
    const errors: LanguageDraftErrors = {};

    if (!draft.language.trim()) {
        errors.language = "Language name is required.";
    }

    if (!draft.level.trim()) {
        errors.level = "Proficiency level is required.";
    }

    return errors;
}

export default function AppLanguageItemForm({
    mode,
    initialValue = DEFAULT_LANGUAGE_DRAFT,
    onSubmit,
    onCancel,
    disabled
}: AppLanguageItemFormProps) {
    const [draft, setDraft] = useState<PersonalInformationLanguageSpoken>(initialValue);
    const [errors, setErrors] = useState<LanguageDraftErrors>({});
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
            console.error("Failed to save language item:", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to save language item.");
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
        setDraft(initialValue ?? DEFAULT_LANGUAGE_DRAFT);
        setErrors({});
        setHasSubmitted(false);
        setIsSaving(false);
        setSubmitError(null);
    }, [initialValue]);

    return <div className="flex flex-col h-full w-full sm:w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
                {mode === "create" ? "Add language" : `Edit ${initialValue?.language ?? "language"}`}
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-4" aria-live="polite">
            {errorSummary && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorSummary}
                </div>
            )}
            <div className="space-y-1.5">
                <Label htmlFor="language-name">Language</Label>
                <Input
                    id="language-name"
                    value={draft.language}
                    onChange={(event) => {
                        const next = event.target.value;
                        setDraft((prev) => ({ ...prev, language: next }));
                        if (hasSubmitted && next.trim()) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                delete nextErrors.language;
                                return nextErrors;
                            });
                        }
                    }}
                    disabled={disableActions}
                    aria-invalid={Boolean(hasSubmitted && errors.language)}
                    placeholder="e.g. English, Spanish, German"
                />
                {hasSubmitted && errors.language && <p className="text-sm text-destructive">{errors.language}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="language-level">Proficiency Level</Label>
                <AppCategoryCombobox
                    id="language-level"
                    value={draft.level}
                    options={LANGUAGE_LEVEL_OPTIONS}
                    onChange={(next) => {
                        setDraft((prev) => ({ ...prev, level: next }));
                        if (hasSubmitted && next.trim()) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                delete nextErrors.level;
                                return nextErrors;
                            });
                        }
                    }}
                    placeholder="Select or type a level"
                    disabled={disableActions}
                    error={hasSubmitted ? errors.level : undefined}
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
