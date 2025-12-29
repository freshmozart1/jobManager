import { PersonalInformationCareerGoal } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Label } from "../label";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { Button } from "../button";
import { LoaderCircle } from "lucide-react";

type CareerGoalDraftErrors = Partial<Record<"topic" | "description", string>>;

type AppCareerGoalItemFormProps = {
    mode: "create" | "edit";
    initialValue?: PersonalInformationCareerGoal;
    onSubmit: (item: PersonalInformationCareerGoal) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
};

const DEFAULT_CAREER_GOAL_DRAFT: PersonalInformationCareerGoal = {
    topic: "",
    description: "",
    reason_lite: "",
};

function validateDraft(draft: PersonalInformationCareerGoal): CareerGoalDraftErrors {
    const errors: CareerGoalDraftErrors = {};

    if (!draft.topic.trim()) {
        errors.topic = "Topic is required.";
    }

    if (!draft.description.trim()) {
        errors.description = "Description is required.";
    }

    return errors;
}

export default function AppCareerGoalItemForm({
    mode,
    initialValue = DEFAULT_CAREER_GOAL_DRAFT,
    onSubmit,
    onCancel,
    disabled
}: AppCareerGoalItemFormProps) {
    const [draft, setDraft] = useState<PersonalInformationCareerGoal>(initialValue);
    const [errors, setErrors] = useState<CareerGoalDraftErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const disableActions = disabled || isSaving;
    const isDirty = draft.topic !== initialValue.topic || draft.description !== initialValue.description;

    const handleSubmit = async () => {
        setHasSubmitted(true);
        const validationErrors = validateDraft(draft);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
        try {
            setIsSaving(true);
            setSubmitError(null);
            await onSubmit({ ...draft, reason_lite: "" });
        } catch (error) {
            console.error("Failed to save career goal:", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to save career goal.");
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
        setDraft(initialValue ?? DEFAULT_CAREER_GOAL_DRAFT);
        setErrors({});
        setHasSubmitted(false);
        setIsSaving(false);
        setSubmitError(null);
    }, [initialValue]);

    return <div className="flex flex-col h-full w-full sm:w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
                {mode === "create" ? "Add career goal" : `Edit ${initialValue?.topic ?? "career goal"}`}
            </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-4" aria-live="polite">
            {errorSummary && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorSummary}
                </div>
            )}
            <div className="space-y-1.5">
                <Label htmlFor="career-goal-topic">Topic</Label>
                <Input
                    id="career-goal-topic"
                    value={draft.topic}
                    onChange={(event) => {
                        const next = event.target.value;
                        setDraft((prev) => ({ ...prev, topic: next }));
                        if (hasSubmitted && next.trim()) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                delete nextErrors.topic;
                                return nextErrors;
                            });
                        }
                    }}
                    disabled={disableActions}
                    aria-invalid={Boolean(hasSubmitted && errors.topic)}
                    placeholder="e.g., Become a Staff Engineer"
                />
                {hasSubmitted && errors.topic && <p className="text-sm text-destructive">{errors.topic}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="career-goal-description">Description</Label>
                <Textarea
                    id="career-goal-description"
                    value={draft.description}
                    rows={5}
                    onChange={(event) => {
                        const next = event.target.value;
                        setDraft((prev) => ({ ...prev, description: next }));
                        if (hasSubmitted && next.trim()) {
                            setErrors((prev) => {
                                const nextErrors = { ...prev };
                                delete nextErrors.description;
                                return nextErrors;
                            });
                        }
                    }}
                    disabled={disableActions}
                    aria-invalid={Boolean(hasSubmitted && errors.description)}
                    placeholder="Describe the goal"
                />
                {hasSubmitted && errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
