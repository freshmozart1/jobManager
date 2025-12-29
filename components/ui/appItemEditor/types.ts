"use client";

import type { ReactNode } from "react";

/**
 * Base field definition with common properties.
 */
type BaseFieldDefinition<T, K extends keyof T> = {
    /** Field name (key of T) */
    name: K;
    /** Display label */
    label: string;
    /** Whether the field is required */
    required?: boolean;
    /** Placeholder text */
    placeholder?: string;
};

/**
 * Text input field (renders Input component).
 */
export type TextFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "text";
    /** Maximum character length */
    maxLength?: number;
};

/**
 * Textarea field (renders Textarea component).
 */
export type TextareaFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "textarea";
    /** Number of rows */
    rows?: number;
    /** Maximum character length */
    maxLength?: number;
};

/**
 * Number input field (renders Input[type=number]).
 */
export type NumberFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "number";
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
};

/**
 * Date picker field (renders AppMonthYearPicker, stores as Date).
 */
export type DateFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "date";
    /** Allow clearing the date value */
    allowClear?: boolean;
};

/**
 * Date picker field (renders AppMonthYearPicker, stores as ISO string).
 */
export type DateStringFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "dateString";
    /** Allow clearing the date value (sets to empty string or null) */
    allowClear?: boolean;
    /** Use null instead of empty string when cleared */
    nullOnClear?: boolean;
};

/**
 * Select/Combobox field (renders AppCategoryCombobox).
 */
export type SelectFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "select";
    /** Available options */
    options: string[];
};

/**
 * Tags input field (renders BadgeInput).
 */
export type TagsFieldDefinition<T, K extends keyof T = keyof T> = BaseFieldDefinition<T, K> & {
    type: "tags";
};

/**
 * Union of all field definition types.
 */
export type FieldDefinition<T> =
    | TextFieldDefinition<T, keyof T>
    | TextareaFieldDefinition<T, keyof T>
    | NumberFieldDefinition<T, keyof T>
    | DateFieldDefinition<T, keyof T>
    | DateStringFieldDefinition<T, keyof T>
    | SelectFieldDefinition<T, keyof T>
    | TagsFieldDefinition<T, keyof T>;

/**
 * Validation error record (field name → error message).
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Configuration for generic editor.
 */
export type EditorConfig<T> = {
    /** Singular label for the item type (e.g., "career goal") */
    singularLabel: string;
    /** Plural label for the item type (e.g., "career goals") */
    pluralLabel: string;
    /** Form field definitions */
    fields: FieldDefinition<T>[];
    /** Default value for new items */
    defaultValue: T;
    /** Get display label for an item (used in undo banner) */
    getItemLabel: (item: T) => string;
    /** Get title for card display */
    getCardTitle: (item: T) => string;
    /** Render card content */
    renderCardContent: (item: T) => ReactNode;
    /** Optional card description (subtitle) */
    getCardDescription?: (item: T) => ReactNode;
    /** Optional card meta (displayed below title/description, above content) */
    getCardMeta?: (item: T) => ReactNode;
    /** Optional card content className */
    cardContentClassName?: string;
    /** Optional cross-field validation (escape hatch) */
    validate?: (draft: T) => ValidationErrors<T>;
    /** Optional custom isDirty check (escape hatch for Date comparisons etc.) */
    isDirty?: (draft: T, initial: T) => boolean;
    /** Normalize items from unknown source */
    normaliseItems: (value: unknown) => T[];
    /** Sort items */
    sortItems?: (items: T[]) => T[];
    /** Transform draft before submission (e.g., add computed fields) */
    transformBeforeSubmit?: (draft: T) => T;
};

/**
 * Props for the generic item form.
 */
export type GenericItemFormProps<T> = {
    mode: "create" | "edit";
    initialValue?: T;
    onSubmit: (item: T) => Promise<void>;
    onCancel?: () => void;
    disabled?: boolean;
    config: EditorConfig<T>;
};

/**
 * Props for the generic card container.
 */
export type GenericCardContainerProps<T> = {
    config: EditorConfig<T>;
};

/**
 * Props for the generic card.
 */
export type GenericCardProps<T> = {
    item: T;
    index: number;
    config: EditorConfig<T>;
};
