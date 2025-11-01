'use client'

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BadgeInput from "@/components/ui/badgeInput";
import AppMonthYearPicker from "@/components/ui/appMonthYearPicker";
import { PersonalInformationExperienceItem } from "@/types";
import { normaliseTags } from "@/lib/utils";
import { MaxTagCount, MaxTagLength } from "@/lib/constants";

const MAX_SUMMARY_LENGTH = 2000;

export type ExperienceDraft = {
    from?: Date;
    to?: Date;
    role: string;
    company: string;
    summary: string;
    tags: string[];
};

export type ExperienceDraftErrors = Partial<Record<keyof ExperienceDraft, string>>;

export type AppExperienceItemFormProps = {
    open: boolean;
    mode: "create" | "edit";
    initialValue?: PersonalInformationExperienceItem;
    onOpenChange: (next: boolean) => void;
    onSubmit: (item: PersonalInformationExperienceItem) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
};

const DEFAULT_DRAFT: ExperienceDraft = {
    from: undefined,
    to: undefined,
    role: "",
    company: "",
    summary: "",
    tags: [],
};

function toDraft(source?: PersonalInformationExperienceItem): ExperienceDraft {
    if (!source) return { ...DEFAULT_DRAFT };
    return {
        from: source.from ? new Date(source.from) : undefined,
        to: source.to ? new Date(source.to) : undefined,
        role: source.role ?? "",
        company: source.company ?? "",
        summary: source.summary ?? "",
        tags: Array.isArray(source.tags) ? normaliseTags(source.tags) : [],
    };
}

function toPayload(draft: ExperienceDraft): PersonalInformationExperienceItem {
    if (!draft.from) {
        throw new Error("Cannot build payload without start date.");
    }
    return {
        from: new Date(draft.from),
        to: draft.to ? new Date(draft.to) : undefined,
        role: draft.role.trim(),
        company: draft.company.trim(),
        summary: draft.summary.trim(),
        tags: normaliseTags(draft.tags),
    };
}

function validateDraft(draft: ExperienceDraft): ExperienceDraftErrors {
    const errors: ExperienceDraftErrors = {};

    if (!draft.from) {
        errors.from = "Start month is required.";
    }

    if (!draft.role.trim()) {
        errors.role = "Role is required.";
    }

    if (!draft.company.trim()) {
        errors.company = "Company is required.";
    }

    if (!draft.summary.trim()) {
        errors.summary = "Summary is required.";
    } else if (draft.summary.length > MAX_SUMMARY_LENGTH) {
        errors.summary = `Summary must be ${MAX_SUMMARY_LENGTH} characters or fewer.`;
    }

    if (draft.to && draft.from && draft.to.getTime() < draft.from.getTime()) {
        errors.to = "End month cannot be before the start month.";
    }

    if (draft.tags.length > MaxTagCount) {
        errors.tags = `Up to ${MaxTagCount} tags allowed.`;
    } else if (draft.tags.some((tag) => tag.length > MaxTagLength)) {
        errors.tags = `Tags must be ${MaxTagLength} characters or fewer.`;
    }

    return errors;
}

export default function AppExperienceItemForm({
    open,
    mode,
    initialValue,
    onOpenChange,
    onSubmit,
    onCancel,
    disabled,
}: AppExperienceItemFormProps) {
    const [draft, setDraft] = useState<ExperienceDraft>(() => toDraft(initialValue));
    const [errors, setErrors] = useState<ExperienceDraftErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setDraft(toDraft(initialValue));
            setErrors({});
            setHasSubmitted(false);
            setSubmitError(null);
        }
    }, [open, initialValue]);

    const disableActions = disabled || isSaving;

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
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save experience item", error);
            setSubmitError(error instanceof Error ? error.message : "Failed to save experience item.");
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

    const handleTagsChange = (next: string[]) => {
        let errorMessage: string | undefined;
        let sanitized = normaliseTags(next);

        if (sanitized.some((tag) => tag.length > MaxTagLength)) {
            errorMessage = `Tags must be ${MaxTagLength} characters or fewer.`;
            sanitized = sanitized.filter((tag) => tag.length <= MaxTagLength);
        }

        if (sanitized.length > MaxTagCount) {
            errorMessage = `Up to ${MaxTagCount} tags allowed.`;
            sanitized = sanitized.slice(0, MaxTagCount);
        }

        setDraft((prev) => ({ ...prev, tags: sanitized }));
        setErrors((prev) => {
            const nextErrors = { ...prev };
            if (errorMessage) {
                nextErrors.tags = errorMessage;
            } else {
                delete nextErrors.tags;
            }
            return nextErrors;
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{mode === "create" ? "Add experience" : `Edit ${initialValue?.role ?? "experience"}`}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto space-y-4 px-4" aria-live="polite">
                    {errorSummary && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {errorSummary}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AppMonthYearPicker
                            id="experience-from"
                            label="Start month"
                            value={draft.from}
                            onChange={(date) => {
                                setDraft((prev) => ({ ...prev, from: date ?? prev.from }));
                                if (hasSubmitted) {
                                    setErrors((prev) => {
                                        const nextErrors = { ...prev };
                                        if (date) delete nextErrors.from;
                                        return nextErrors;
                                    });
                                }
                            }}
                            required
                            disabled={disableActions}
                            error={hasSubmitted ? errors.from : undefined}
                        />
                        <AppMonthYearPicker
                            id="experience-to"
                            label="End month"
                            value={draft.to}
                            onChange={(date) => {
                                setDraft((prev) => ({ ...prev, to: date ?? undefined }));
                                if (hasSubmitted) {
                                    setErrors((prev) => {
                                        const nextErrors = { ...prev };
                                        if (!date || !draft.from || date.getTime() >= draft.from.getTime()) {
                                            delete nextErrors.to;
                                        } else {
                                            nextErrors.to = "End month cannot be before the start month.";
                                        }
                                        return nextErrors;
                                    });
                                }
                            }}
                            allowClear
                            disabled={disableActions}
                            error={hasSubmitted ? errors.to : undefined}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="experience-role">Role</Label>
                            <Input
                                id="experience-role"
                                value={draft.role}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setDraft((prev) => ({ ...prev, role: next }));
                                    if (hasSubmitted && next.trim()) {
                                        setErrors((prev) => {
                                            const nextErrors = { ...prev };
                                            delete nextErrors.role;
                                            return nextErrors;
                                        });
                                    }
                                }}
                                disabled={disableActions}
                                aria-invalid={Boolean(hasSubmitted && errors.role)}
                            />
                            {hasSubmitted && errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="experience-company">Company</Label>
                            <Input
                                id="experience-company"
                                value={draft.company}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setDraft((prev) => ({ ...prev, company: next }));
                                    if (hasSubmitted && next.trim()) {
                                        setErrors((prev) => {
                                            const nextErrors = { ...prev };
                                            delete nextErrors.company;
                                            return nextErrors;
                                        });
                                    }
                                }}
                                disabled={disableActions}
                                aria-invalid={Boolean(hasSubmitted && errors.company)}
                            />
                            {hasSubmitted && errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="experience-summary">Summary</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Textarea
                                    id="experience-summary"
                                    value={draft.summary}
                                    onChange={(event) => {
                                        const next = event.target.value;
                                        setDraft((prev) => ({ ...prev, summary: next }));
                                        if (hasSubmitted && next.trim() && next.length <= MAX_SUMMARY_LENGTH) {
                                            setErrors((prev) => {
                                                const nextErrors = { ...prev };
                                                delete nextErrors.summary;
                                                return nextErrors;
                                            });
                                        }
                                    }}
                                    rows={5}
                                    disabled={disableActions}
                                    aria-invalid={Boolean(hasSubmitted && errors.summary)}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Provide context for the role. {draft.summary.length}/{MAX_SUMMARY_LENGTH}</p>
                                {errors.summary && <p>Fix to enable save.</p>}
                            </TooltipContent>
                        </Tooltip>
                        {hasSubmitted && errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="experience-tags">Tags</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <BadgeInput
                                        id="experience-tags"
                                        value={draft.tags}
                                        onChange={handleTagsChange}
                                        placeholder="Type tag and press ','"
                                        disabled={disableActions}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Up to {MaxTagCount} tags, each ≤{MaxTagLength} chars.</p>
                                {errors.tags && <p>Fix to enable save.</p>}
                            </TooltipContent>
                        </Tooltip>
                        {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
                    </div>
                </div>
                <SheetFooter>
                    <div className="flex w-full justify-between gap-3">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => {
                                onCancel?.();
                                onOpenChange(false);
                            }}
                            disabled={disableActions}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={() => void handleSubmit()} disabled={disableActions}>
                            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
