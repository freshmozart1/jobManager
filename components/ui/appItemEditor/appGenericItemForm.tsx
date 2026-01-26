"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AppMonthYearPicker from "@/components/ui/appMonthYearPicker";
import { AppCategoryCombobox } from "@/components/ui/appCategoryCombobox";
import BadgeInput from "@/components/ui/badgeInput";

import type {
    EditorConfig,
    FieldDefinition,
    ValidationErrors,
    TextFieldDefinition,
    TextareaFieldDefinition,
    NumberFieldDefinition,
    DateFieldDefinition,
    DateStringFieldDefinition,
    SelectFieldDefinition,
    SkillsFieldDefinition,
} from "./types";

type AppGenericItemFormProps<T> = {
    mode: "create" | "edit";
    initialValue?: T;
    onSubmit: (item: T) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
    config: EditorConfig<T>;
};

function getFieldValue<T>(draft: T, name: keyof T): unknown {
    return draft[name];
}

function setFieldValue<T>(draft: T, name: keyof T, value: unknown): T {
    return { ...draft, [name]: value };
}

function defaultIsDirty<T>(draft: T, initial: T, fields: FieldDefinition<T>[]): boolean {
    for (const field of fields) {
        const draftVal = getFieldValue(draft, field.name);
        const initVal = getFieldValue(initial, field.name);

        if (field.type === "date") {
            const draftDate = draftVal instanceof Date ? draftVal.getTime() : draftVal;
            const initDate = initVal instanceof Date ? initVal.getTime() : initVal;
            if (draftDate !== initDate) return true;
        } else if (field.type === "skills") {
            const draftSkills = Array.isArray(draftVal) ? draftVal : [];
            const initSkills = Array.isArray(initVal) ? initVal : [];
            if (draftSkills.length !== initSkills.length) return true;
            if (draftSkills.some((t, i) => t !== initSkills[i])) return true;
        } else if (draftVal !== initVal) {
            return true;
        }
    }
    return false;
}

function validateRequired<T>(draft: T, fields: FieldDefinition<T>[]): ValidationErrors<T> {
    const errors: ValidationErrors<T> = {};

    for (const field of fields) {
        if (!field.required) continue;

        const value = getFieldValue(draft, field.name);

        switch (field.type) {
            case "text":
            case "textarea":
            case "select":
                if (typeof value !== "string" || !value.trim()) {
                    errors[field.name] = `${field.label} is required.`;
                }
                break;
            case "number":
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    errors[field.name] = `${field.label} is required.`;
                }
                break;
            case "date":
                if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
                    errors[field.name] = `${field.label} is required.`;
                }
                break;
            case "dateString":
                if (typeof value !== "string" || !value.trim()) {
                    errors[field.name] = `${field.label} is required.`;
                }
                break;
            case "skills":
                if (!Array.isArray(value) || value.length === 0) {
                    errors[field.name] = `${field.label} is required.`;
                }
                break;
        }
    }

    return errors;
}

function renderField<T>(
    field: FieldDefinition<T>,
    draft: T,
    setDraft: React.Dispatch<React.SetStateAction<T>>,
    errors: ValidationErrors<T>,
    setErrors: React.Dispatch<React.SetStateAction<ValidationErrors<T>>>,
    hasSubmitted: boolean,
    disabled: boolean,
    idPrefix: string
): React.ReactNode {
    const id = `${idPrefix}-${String(field.name)}`;
    const error = hasSubmitted ? errors[field.name] : undefined;
    const value = getFieldValue(draft, field.name);

    const clearFieldError = () => {
        if (hasSubmitted) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field.name];
                return next;
            });
        }
    };

    switch (field.type) {
        case "text": {
            const textField = field as TextFieldDefinition<T, keyof T>;
            return (
                <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{textField.label}</Label>
                    <Input
                        id={id}
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => {
                            const next = e.target.value;
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (next.trim()) clearFieldError();
                        }}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        placeholder={textField.placeholder}
                        maxLength={textField.maxLength}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
            );
        }

        case "textarea": {
            const textareaField = field as TextareaFieldDefinition<T, keyof T>;
            return (
                <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{textareaField.label}</Label>
                    <Textarea
                        id={id}
                        value={typeof value === "string" ? value : ""}
                        rows={textareaField.rows ?? 5}
                        onChange={(e) => {
                            const next = e.target.value;
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (next.trim()) clearFieldError();
                        }}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        placeholder={textareaField.placeholder}
                        maxLength={textareaField.maxLength}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
            );
        }

        case "number": {
            const numberField = field as NumberFieldDefinition<T, keyof T>;
            return (
                <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{numberField.label}</Label>
                    <Input
                        id={id}
                        type="number"
                        value={typeof value === "number" ? value : ""}
                        onChange={(e) => {
                            const next = e.target.value === "" ? undefined : Number(e.target.value);
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (typeof next === "number" && Number.isFinite(next)) clearFieldError();
                        }}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        placeholder={numberField.placeholder}
                        min={numberField.min}
                        max={numberField.max}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
            );
        }

        case "date": {
            const dateField = field as DateFieldDefinition<T, keyof T>;
            return (
                <div key={id}>
                    <AppMonthYearPicker
                        id={id}
                        label={dateField.label}
                        value={value instanceof Date ? value : undefined}
                        onChange={(next) => {
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (next) clearFieldError();
                        }}
                        required={dateField.required}
                        disabled={disabled}
                        placeholder={dateField.placeholder}
                        allowClear={dateField.allowClear}
                        error={error}
                    />
                </div>
            );
        }

        case "dateString": {
            const dateStringField = field as DateStringFieldDefinition<T, keyof T>;
            const dateValue = typeof value === "string" && value ? new Date(value) : undefined;
            return (
                <div key={id}>
                    <AppMonthYearPicker
                        id={id}
                        label={dateStringField.label}
                        value={dateValue}
                        onChange={(next) => {
                            const isoString = next?.toISOString() ?? (dateStringField.nullOnClear ? null : "");
                            setDraft((prev) => setFieldValue(prev, field.name, isoString));
                            if (next) clearFieldError();
                        }}
                        required={dateStringField.required}
                        disabled={disabled}
                        placeholder={dateStringField.placeholder}
                        allowClear={dateStringField.allowClear}
                        error={error}
                    />
                </div>
            );
        }

        case "select": {
            const selectField = field as SelectFieldDefinition<T, keyof T>;
            return (
                <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{selectField.label}</Label>
                    <AppCategoryCombobox
                        id={id}
                        value={typeof value === "string" ? value : ""}
                        options={selectField.options}
                        onChange={(next) => {
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (next.trim()) clearFieldError();
                        }}
                        error={error}
                        placeholder={selectField.placeholder}
                        disabled={disabled}
                    />
                </div>
            );
        }

        case "skills": {
            const skillsField = field as SkillsFieldDefinition<T, keyof T>;
            return (
                <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{skillsField.label}</Label>
                    <BadgeInput
                        id={id}
                        value={Array.isArray(value) ? value : []}
                        onChange={(next) => {
                            setDraft((prev) => setFieldValue(prev, field.name, next));
                            if (next.length > 0) clearFieldError();
                        }}
                        placeholder={skillsField.placeholder}
                        disabled={disabled}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
            );
        }

        default:
            return null;
    }
}

export default function AppGenericItemForm<T>({
    mode,
    initialValue,
    onSubmit,
    onCancel,
    disabled,
    config,
}: AppGenericItemFormProps<T>) {
    const effectiveInitial = initialValue ?? config.defaultValue;
    const [draft, setDraft] = useState<T>(effectiveInitial);
    const [errors, setErrors] = useState<ValidationErrors<T>>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const disableActions = disabled || isSaving;
    const isDirty = config.isDirty
        ? config.isDirty(draft, effectiveInitial)
        : defaultIsDirty(draft, effectiveInitial, config.fields);

    const idPrefix = `${config.singularLabel.replace(/\s+/g, "-").toLowerCase()}-form`;

    const handleSubmit = async () => {
        setHasSubmitted(true);

        // Validate required fields
        const requiredErrors = validateRequired(draft, config.fields);
        // Custom validation (escape hatch)
        const customErrors = config.validate ? config.validate(draft) : {};
        const allErrors = { ...requiredErrors, ...customErrors };

        setErrors(allErrors);
        if (Object.keys(allErrors).length > 0) return;

        try {
            setIsSaving(true);
            setSubmitError(null);
            const finalItem = config.transformBeforeSubmit ? config.transformBeforeSubmit(draft) : draft;
            await onSubmit(finalItem);
        } catch (error) {
            console.error(`Failed to save ${config.singularLabel}:`, error);
            setSubmitError(error instanceof Error ? error.message : `Failed to save ${config.singularLabel}.`);
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

    useEffect(() => {
        setDraft(effectiveInitial);
        setErrors({});
        setHasSubmitted(false);
        setIsSaving(false);
        setSubmitError(null);
    }, [effectiveInitial]);

    const titleText =
        mode === "create"
            ? `Add ${config.singularLabel}`
            : `Edit ${initialValue ? config.getCardTitle(initialValue) : config.singularLabel}`;

    return (
        <div className="flex flex-col h-full w-full sm:w-[400px]">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">{titleText}</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-4" aria-live="polite">
                {errorSummary && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errorSummary}
                    </div>
                )}
                {config.fields.map((field) =>
                    renderField(field, draft, setDraft, errors, setErrors, hasSubmitted, disableActions, idPrefix)
                )}
            </div>
            <div className="flex w-full justify-between gap-3 p-4 border-t mt-auto">
                <Button variant="ghost" type="button" onClick={onCancel} disabled={disableActions}>
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
