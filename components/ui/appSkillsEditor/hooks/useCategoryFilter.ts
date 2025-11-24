"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PersonalInformationSkill } from "@/types";

import { normaliseName } from "../shared";

const CATEGORY_FILTER_STORAGE_KEY = "personal.skills.categoryFilter";

export function useCategoryFilter(internalSkills: PersonalInformationSkill[]) {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
    const [popoverOpen, setPopoverOpen] = useState(false);
    const selectionInitialisedRef = useRef(false);
    const previousCategoryOptionsRef = useRef<string[]>([]);

    const categoryOptions = useMemo(() => {
        const categories = new Map<string, string>();
        internalSkills.forEach((skill) => {
            const trimmed = skill.category.trim();
            if (!trimmed) return;
            const key = normaliseName(trimmed);
            if (!categories.has(key)) {
                categories.set(key, trimmed);
            }
        });
        return Array.from(categories.values()).sort((a, b) => a.localeCompare(b));
    }, [internalSkills]);

    const persistCategorySelection = (next: Set<string>) => {
        if (typeof window === "undefined") {
            return;
        }
        const sorted = Array.from(next).sort((a, b) => a.localeCompare(b));
        window.localStorage.setItem(CATEGORY_FILTER_STORAGE_KEY, JSON.stringify(sorted));
    };

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (categoryOptions.length === 0) {
            const empty = new Set<string>();
            setSelectedCategories(empty);
            window.localStorage.removeItem(CATEGORY_FILTER_STORAGE_KEY);
            selectionInitialisedRef.current = true;
            previousCategoryOptionsRef.current = categoryOptions;
            return;
        }

        const previousOptions = previousCategoryOptionsRef.current;

        if (!selectionInitialisedRef.current) {
            let storedValues: string[] = [];
            const raw = window.localStorage.getItem(CATEGORY_FILTER_STORAGE_KEY);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        storedValues = parsed.filter((value): value is string => typeof value === "string");
                    }
                } catch (error) {
                    console.error("Failed to parse stored category filter", error);
                }
            }
            const filteredStored = storedValues.filter((value) => categoryOptions.includes(value));
            const initialValues = filteredStored.length > 0 ? filteredStored : categoryOptions;
            const initialSet = new Set(initialValues);
            setSelectedCategories(initialSet);
            persistCategorySelection(initialSet);
            selectionInitialisedRef.current = true;
            previousCategoryOptionsRef.current = categoryOptions;
            return;
        }

        setSelectedCategories((prev) => {
            const previouslySelectedAll = previousOptions.length > 0 && prev.size === previousOptions.length && previousOptions.every((option) => prev.has(option));
            const filtered = categoryOptions.filter((category) => prev.has(category));
            const nextValues = previouslySelectedAll || filtered.length === 0 ? categoryOptions : filtered;
            const nextSet = new Set(nextValues);
            const changed = nextSet.size !== prev.size || Array.from(nextSet).some((value) => !prev.has(value));
            if (!changed) {
                return prev;
            }
            persistCategorySelection(nextSet);
            return nextSet;
        });

        previousCategoryOptionsRef.current = categoryOptions;
    }, [categoryOptions]);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            persistCategorySelection(next);
            return next;
        });
    };

    const selectAllCategories = () => {
        setSelectedCategories((prev) => {
            if (categoryOptions.length === 0) {
                const empty = new Set<string>();
                persistCategorySelection(empty);
                return empty;
            }
            const allSelected = prev.size === categoryOptions.length && categoryOptions.every((category) => prev.has(category));
            if (allSelected) {
                return prev;
            }
            const next = new Set(categoryOptions);
            persistCategorySelection(next);
            return next;
        });
    };

    const deselectAllCategories = () => {
        setSelectedCategories((prev) => {
            if (prev.size === 0) {
                return prev;
            }
            const next = new Set<string>();
            persistCategorySelection(next);
            return next;
        });
    };

    return {
        categoryOptions,
        selectedCategories,
        popoverOpen,
        setPopoverOpen,
        toggleCategory,
        selectAllCategories,
        deselectAllCategories,
    } as const;
}
