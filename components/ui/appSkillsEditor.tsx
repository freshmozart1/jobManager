'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { PersonalInformationSkill } from "@/types";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BadgeInput from "@/components/ui/badgeInput";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppCategoryCombobox } from "@/components/ui/appCategoryCombobox";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/inputGroup";
import { ChevronsUpDown, SquarePen, Trash2, Search } from "lucide-react";

const PAGE_SIZE = 10;

const NAME_TRUNCATE_AT = 12;
const SEARCH_DEBOUNCE_MS = 150;
const BANNER_TIMEOUT_MS = 5000;
const MAX_ALIAS_COUNT = 5;
const MAX_ALIAS_LENGTH = 10;
const MAX_CATEGORY_LENGTH = 30;
const CATEGORY_FILTER_STORAGE_KEY = "personal.skills.categoryFilter";

type SkillDraft = {
    name: string;
    category: string;
    level: string;
    years: string;
    last_used: string;
    aliases: string[];
    primary: boolean;
};

type ValidationErrors = Partial<Record<keyof SkillDraft, string>> & { aliases?: string };

type UndoState = {
    names: string[];
    mergedCount: number;
    snapshot: PersonalInformationSkill[];
};

type AppSkillsEditorProps = {
    skills: PersonalInformationSkill[];
    onChange: (skills: PersonalInformationSkill[]) => void;
    onPersist: (skills: PersonalInformationSkill[]) => Promise<void>;
    onRegisterAddSkill?: (handler: (() => void) | null) => void;
};

function toDraft(skill: PersonalInformationSkill): SkillDraft {
    return {
        name: skill.name,
        category: skill.category,
        level: skill.level,
        years: String(skill.years ?? ""),
        last_used: skill.last_used ?? "",
        aliases: skill.aliases ?? [],
        primary: Boolean(skill.primary),
    };
}

function normaliseName(value: string): string {
    return value.trim().toLowerCase();
}

function truncateName(value: string): string {
    if (value.length <= NAME_TRUNCATE_AT) return value;
    return `${value.slice(0, NAME_TRUNCATE_AT)}…`;
}

function sortByPrimaryFirst(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return [...skills].sort((a, b) => {
        if (a.primary === b.primary) return 0;
        return a.primary ? -1 : 1;
    });
}

function cloneSkills(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return skills.map((skill) => ({
        ...skill,
        aliases: [...(skill.aliases ?? [])],
    }));
}

function validateSkillDraft(
    draft: SkillDraft,
    existing: PersonalInformationSkill[],
    originalName?: string
): ValidationErrors {
    const errors: ValidationErrors = {};

    const trimmedName = draft.name.trim();
    if (!trimmedName) {
        errors.name = "Name is required.";
    } else {
        const normalized = normaliseName(trimmedName);
        const clashes = existing.some((skill) => {
            if (originalName && normaliseName(originalName) === normalized) {
                return false;
            }
            return normaliseName(skill.name) === normalized;
        });
        if (clashes) {
            errors.name = "Name must be unique.";
        }
    }

    const trimmedCategory = draft.category.trim();
    if (!trimmedCategory) {
        errors.category = "Category is required.";
    } else if (trimmedCategory.length > MAX_CATEGORY_LENGTH) {
        errors.category = "Category must be 30 characters or less.";
    }

    const yearsNumber = Number(draft.years);
    if (Number.isNaN(yearsNumber) || yearsNumber < 0) {
        errors.years = "Years must be a non-negative number.";
    }

    if (!/^\d{4}-\d{2}$/.test(draft.last_used)) {
        errors.last_used = "Use YYYY-MM format.";
    } else {
        const [, monthString] = draft.last_used.split("-");
        const month = Number(monthString);
        if (month < 1 || month > 12) {
            errors.last_used = "Month must be between 01 and 12.";
        }
    }

    if (draft.aliases.length > MAX_ALIAS_COUNT) {
        errors.aliases = "Up to 5 aliases allowed.";
    }

    const aliasSet = new Set<string>();
    const nameKey = normaliseName(draft.name);
    for (const alias of draft.aliases) {
        const aliasTrimmed = alias.trim();
        const aliasKey = normaliseName(aliasTrimmed);
        if (aliasTrimmed.length === 0) {
            errors.aliases = "Aliases cannot be empty.";
            break;
        }
        if (aliasTrimmed.length > MAX_ALIAS_LENGTH) {
            errors.aliases = "Aliases must be 10 characters or less.";
            break;
        }
        if (aliasKey === nameKey) {
            errors.aliases = "Aliases must differ from the name.";
            break;
        }
        if (aliasSet.has(aliasKey)) {
            errors.aliases = "Aliases must be unique.";
            break;
        }
        aliasSet.add(aliasKey);
    }

    return errors;
}

export default function AppSkillsEditor({ skills, onChange, onPersist, onRegisterAddSkill }: AppSkillsEditorProps) {
    const initialisedRef = useRef(false);
    const previousSkillsRef = useRef<PersonalInformationSkill[]>(cloneSkills(skills));

    const [internalSkills, setInternalSkills] = useState<PersonalInformationSkill[]>(() => sortByPrimaryFirst(skills));
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
    const [draft, setDraft] = useState<SkillDraft>({
        name: "",
        category: "",
        level: "",
        years: "",
        last_used: "",
        aliases: [],
        primary: false,
    });
    const [originalName, setOriginalName] = useState<string | undefined>(undefined);
    const [draftErrors, setDraftErrors] = useState<ValidationErrors>({});
    const [undoState, setUndoState] = useState<UndoState | null>(null);
    const undoTimerRef = useRef<number | null>(null);
    const undoRemainingRef = useRef<number>(BANNER_TIMEOUT_MS);
    const undoStartRef = useRef<number>(0);
    const [isPersisting, setIsPersisting] = useState(false);
    const [persistError, setPersistError] = useState<string | null>(null);
    const selectionInitialisedRef = useRef(false);
    const previousCategoryOptionsRef = useRef<string[]>([]);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const hiddenLabelRef = useRef<HTMLSpanElement | null>(null);
    const [triggerContentWidth, setTriggerContentWidth] = useState(0);
    const [namesLabelWidth, setNamesLabelWidth] = useState(0);

    useEffect(() => {
        if (!initialisedRef.current) {
            initialisedRef.current = true;
            previousSkillsRef.current = cloneSkills(skills);
            return;
        }
        setInternalSkills(skills);
        previousSkillsRef.current = cloneSkills(skills);
    }, [skills]);

    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        if (!undoState) {
            undoRemainingRef.current = BANNER_TIMEOUT_MS;
            if (undoTimerRef.current) {
                window.clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;
            }
            return;
        }
        undoStartRef.current = Date.now();
        if (undoTimerRef.current) {
            window.clearTimeout(undoTimerRef.current);
        }
        undoTimerRef.current = window.setTimeout(() => {
            setUndoState(null);
            undoTimerRef.current = null;
        }, undoRemainingRef.current);
    }, [undoState]);

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
        const element = triggerRef.current;
        if (!element || typeof window.ResizeObserver === "undefined") {
            return;
        }

        const updateWidth = () => {
            const style = window.getComputedStyle(element);
            const paddingLeft = parseFloat(style.paddingLeft || "0");
            const paddingRight = parseFloat(style.paddingRight || "0");
            const width = element.getBoundingClientRect().width - (paddingLeft + paddingRight);
            setTriggerContentWidth(Math.max(0, width));
        };

        updateWidth();

        const observer = new ResizeObserver(() => {
            updateWidth();
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const skillRows = useMemo(() => {
        return internalSkills.map((skill, index) => ({ skill, index }));
    }, [internalSkills]);

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

    const filteredRows = useMemo(() => {
        if (categoryOptions.length === 0) {
            return skillRows.filter(({ skill }) => {
                if (!debouncedSearch) return true;
                const value = debouncedSearch;
                const haystack = [
                    skill.name,
                    skill.category,
                    skill.level,
                    skill.years != null ? String(skill.years) : null,
                    ...skill.aliases,
                ]
                    .filter((part): part is string => typeof part === "string" && part.length > 0)
                    .map((part) => part.toLowerCase());
                return haystack.some((part) => part.includes(value));
            });
        }

        if (selectedCategories.size === 0) {
            return [];
        }

        const allCategoriesSelected = selectedCategories.size === categoryOptions.length;

        return skillRows.filter(({ skill }) => {
            const trimmedCategory = skill.category.trim();
            if (trimmedCategory.length === 0) {
                if (!allCategoriesSelected) {
                    return false;
                }
            } else if (!selectedCategories.has(trimmedCategory)) {
                return false;
            }

            if (!debouncedSearch) return true;
            const value = debouncedSearch;
            const haystack = [
                skill.name,
                skill.category,
                skill.level,
                skill.years != null ? String(skill.years) : null,
                ...skill.aliases,
            ]
                .filter((part): part is string => typeof part === "string" && part.length > 0)
                .map((part) => part.toLowerCase());
            return haystack.some((part) => part.includes(value));
        });
    }, [skillRows, selectedCategories, debouncedSearch, categoryOptions]);

    const selectedCategoryArray = useMemo(() => {
        return Array.from(selectedCategories).sort((a, b) => a.localeCompare(b));
    }, [selectedCategories]);

    const selectedCategoryCount = selectedCategoryArray.length;
    const hasCategorySelection = selectedCategoryCount > 0;
    const namesLabel = selectedCategoryArray.join(", ");
    const allCategoriesSelected = hasCategorySelection && selectedCategoryCount === categoryOptions.length && categoryOptions.length > 0;

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const frame = window.requestAnimationFrame(() => {
            if (!hiddenLabelRef.current) {
                setNamesLabelWidth(0);
                return;
            }
            const width = hiddenLabelRef.current.getBoundingClientRect().width;
            setNamesLabelWidth(width);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [namesLabel]);

    const shouldShowNames = hasCategorySelection && triggerContentWidth >= 200 && namesLabelWidth > 0 && namesLabelWidth <= triggerContentWidth;

    let categoryDisplayLabel: string;
    if (!hasCategorySelection) {
        categoryDisplayLabel = categoryOptions.length === 0 ? "No categories available" : "No categories selected";
    } else if (shouldShowNames) {
        categoryDisplayLabel = namesLabel;
    } else if (allCategoriesSelected) {
        categoryDisplayLabel = "All categories";
    } else {
        categoryDisplayLabel = `${selectedCategoryCount} selected`;
    }

    const triggerAriaLabel = hasCategorySelection
        ? `Filter categories: ${namesLabel || `${selectedCategoryCount} selected`}`
        : categoryOptions.length === 0
            ? "Filter categories: none available"
            : "Filter categories: none selected";

    const selectAllDisabled = categoryOptions.length === 0 || (hasCategorySelection && selectedCategoryCount === categoryOptions.length);
    const deselectAllDisabled = selectedCategoryCount === 0;

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex >= totalPages - 1;

    useEffect(() => {
        if (pageIndex > totalPages - 1) {
            setPageIndex(Math.max(0, totalPages - 1));
        }
    }, [pageIndex, totalPages]);

    const pagedRows = useMemo(() => {
        const start = pageIndex * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, pageIndex]);


    const resetSelection = () => {
        setSelectedIndices(new Set());
        setTargetIndex(null);
        setAnchorIndex(null);
    };

    const openCreateSheet = useCallback(() => {
        setSheetMode("create");
        setDraft({
            name: "",
            category: "",
            level: "",
            years: "",
            last_used: "",
            aliases: [],
            primary: false,
        });
        setOriginalName(undefined);
        setDraftErrors({});
        setSheetOpen(true);
    }, []);

    useEffect(() => {
        if (!onRegisterAddSkill) {
            return;
        }
        onRegisterAddSkill(openCreateSheet);
        return () => {
            onRegisterAddSkill(null);
        };
    }, [onRegisterAddSkill, openCreateSheet]);

    const openEditSheet = (skill: PersonalInformationSkill) => {
        setSheetMode("edit");
        setDraft(toDraft(skill));
        setOriginalName(skill.name);
        setDraftErrors({});
        setSheetOpen(true);
    };

    const updateDraft = (updates: Partial<SkillDraft>) => {
        setDraft((prev) => {
            const next = { ...prev, ...updates };
            setDraftErrors(validateSkillDraft(next, internalSkills, originalName));
            return next;
        });
    };

    const handleAliasesChange = (aliases: string[]) => {
        const sanitized = aliases.map((alias) => alias.trim()).filter(Boolean);
        if (sanitized.length > MAX_ALIAS_COUNT) {
            setDraftErrors((prev) => ({ ...prev, aliases: "Up to 5 aliases allowed." }));
            return;
        }
        if (sanitized.some((alias) => alias.length > MAX_ALIAS_LENGTH)) {
            setDraftErrors((prev) => ({ ...prev, aliases: "Aliases must be 10 characters or less." }));
            return;
        }
        updateDraft({ aliases: sanitized });
    };

    const pauseUndoTimer = () => {
        if (!undoState || undoTimerRef.current === null) return;
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        const elapsed = Date.now() - undoStartRef.current;
        undoRemainingRef.current = Math.max(0, undoRemainingRef.current - elapsed);
    };

    const resumeUndoTimer = () => {
        if (!undoState) return;
        if (undoRemainingRef.current <= 0) {
            setUndoState(null);
            return;
        }
        undoStartRef.current = Date.now();
        undoTimerRef.current = window.setTimeout(() => {
            setUndoState(null);
            undoTimerRef.current = null;
        }, undoRemainingRef.current);
    };

    const persistSkills = async (nextSkills: PersonalInformationSkill[]) => {
        setIsPersisting(true);
        setPersistError(null);
        try {
            await onPersist(nextSkills);
            previousSkillsRef.current = cloneSkills(nextSkills);
        } catch (error) {
            console.error("Failed to persist skills", error);
            setPersistError("Save failed. Reverted.");
            setInternalSkills(previousSkillsRef.current);
            onChange(previousSkillsRef.current);
        } finally {
            setIsPersisting(false);
        }
    };

    const upsertSkill = async () => {
        const errors = validateSkillDraft(draft, internalSkills, originalName);
        setDraftErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }
        const skill: PersonalInformationSkill = {
            name: draft.name.trim(),
            category: draft.category.trim(),
            level: draft.level.trim(),
            years: Number(draft.years),
            last_used: draft.last_used,
            aliases: draft.aliases.map((alias) => alias.trim()),
            primary: draft.primary,
        };

        let nextSkills: PersonalInformationSkill[];
        if (sheetMode === "create") {
            nextSkills = [...internalSkills, skill];
        } else {
            nextSkills = internalSkills.map((existing) => (normaliseName(existing.name) === normaliseName(originalName ?? "") ? skill : existing));
        }

        setInternalSkills(nextSkills);
        onChange(nextSkills);
        setSheetOpen(false);
        resetSelection();
        await persistSkills(nextSkills);
    };

    const handleDelete = async (indicesToRemove: number[]) => {
        const uniqueIndices = Array.from(new Set(indicesToRemove)).sort((a, b) => a - b);
        if (uniqueIndices.length === 0) return;
        const snapshot = cloneSkills(internalSkills);
        const remaining = internalSkills.filter((_, index) => !uniqueIndices.includes(index));
        const removedNames = uniqueIndices.map((index) => internalSkills[index]?.name).filter(Boolean) as string[];

        setInternalSkills(remaining);
        onChange(remaining);
        resetSelection();

        setUndoState((prev) => {
            if (!prev) {
                undoRemainingRef.current = BANNER_TIMEOUT_MS;
                return {
                    names: removedNames,
                    mergedCount: 1,
                    snapshot,
                };
            }
            const uniqueNames = Array.from(new Set([...prev.names, ...removedNames])).sort((a, b) => a.localeCompare(b));
            return {
                names: uniqueNames,
                mergedCount: prev.mergedCount + 1,
                snapshot: prev.snapshot,
            };
        });

        await persistSkills(remaining);
    };

    const handleUndo = async () => {
        if (!undoState) return;
        const restored = cloneSkills(undoState.snapshot);
        setInternalSkills(restored);
        onChange(restored);
        setUndoState(null);
        undoRemainingRef.current = BANNER_TIMEOUT_MS;
        if (undoTimerRef.current) {
            window.clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }
        await persistSkills(restored);
    };

    const handleRowClick = (rowIndex: number, event: MouseEvent<HTMLTableRowElement>) => {
        if (event.shiftKey && anchorIndex !== null) {
            const filteredIndices = filteredRows.map(({ index }) => index);
            const anchorPosition = filteredIndices.indexOf(anchorIndex);
            const targetPosition = filteredIndices.indexOf(rowIndex);
            if (anchorPosition !== -1 && targetPosition !== -1) {
                setTargetIndex(rowIndex);
                const [start, end] = anchorPosition < targetPosition ? [anchorPosition, targetPosition] : [targetPosition, anchorPosition];
                const selected = filteredIndices.slice(start, end + 1);
                setSelectedIndices(new Set(selected));
                return;
            }
        }

        setAnchorIndex(rowIndex);
        setTargetIndex(null);
        setSelectedIndices(new Set());
    };

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
        setPageIndex(0);
        resetSelection();
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
        setPageIndex(0);
        resetSelection();
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
        setPageIndex(0);
        resetSelection();
    };

    const clearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setPageIndex(0);
        resetSelection();
        setSelectedCategories(() => {
            if (categoryOptions.length === 0) {
                const empty = new Set<string>();
                persistCategorySelection(empty);
                return empty;
            }
            const next = new Set(categoryOptions);
            persistCategorySelection(next);
            return next;
        });
    };

    const handleClearUndo = () => {
        setUndoState(null);
        undoRemainingRef.current = BANNER_TIMEOUT_MS;
        if (undoTimerRef.current) {
            window.clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }
    };

    const selectedIndicesArray = useMemo(
        () => Array.from(selectedIndices).sort((a, b) => a - b),
        [selectedIndices]
    );

    const deleteButtonDisabled = selectedIndicesArray.length === 0 || isPersisting;
    const disableSheetSave = isPersisting || Object.keys(draftErrors).length > 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-3">
                    <div>
                        <InputGroup className="[--radius:0.5rem] min-w-[200px]">
                            <InputGroupAddon align="inline-start" className="px-4 py-2">
                                <Search className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput
                                id="skills-search"
                                aria-label="Search skills"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPageIndex(0);
                                    resetSelection();
                                }}
                                placeholder="Name, category, level, alias"
                            />
                        </InputGroup>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="skills-category-trigger"
                                        ref={triggerRef}
                                        variant="outline"
                                        className="w-full min-w-[200px] justify-between px-3"
                                        aria-label={triggerAriaLabel}
                                    >
                                        <span className="truncate font-normal text-sm">{categoryDisplayLabel}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start">
                                    <div className="flex items-center justify-between border-b px-3 py-2">
                                        <Button variant="ghost" size="sm" onClick={selectAllCategories} disabled={selectAllDisabled}>
                                            Select all
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={deselectAllCategories} disabled={deselectAllDisabled}>
                                            Deselect all
                                        </Button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto px-3 py-2" role="group" aria-labelledby="skills-category-checklist">
                                        <p id="skills-category-checklist" className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Categories
                                        </p>
                                        {categoryOptions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No categories available.</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {categoryOptions.map((category) => {
                                                    const checkboxId = `skills-category-${normaliseName(category)}`;
                                                    const checked = selectedCategories.has(category);
                                                    return (
                                                        <li key={category}>
                                                            <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm cursor-pointer">
                                                                <Checkbox
                                                                    id={checkboxId}
                                                                    checked={checked}
                                                                    onCheckedChange={() => toggleCategory(category)}
                                                                />
                                                                <span className="truncate">{category}</span>
                                                            </label>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <span
                                ref={hiddenLabelRef}
                                className="pointer-events-none absolute left-[-9999px] top-[-9999px] whitespace-nowrap text-sm font-normal"
                                aria-hidden="true"
                            >
                                {namesLabel}
                            </span>
                        </div>
                        <Button variant="ghost" onClick={clearFilters} className="shrink-0">
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {persistError && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-md px-3 py-2 text-sm">
                    {persistError}
                </div>
            )}

            <div className="overflow-hidden rounded-md border">
                <Table aria-label="Skills (searchable by name, category, level, years, aliases)">
                    {/* Display only name and actions; remaining fields stay editable/searchable via the sheet. */}
                    <TableBody>
                        {pagedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                                    No skills found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagedRows.map(({ skill, index }) => {
                                const isAnchor = anchorIndex === index;
                                const isTarget = targetIndex === index && targetIndex !== null;
                                const isSelected = selectedIndices.has(index);
                                const rowClass = cn({
                                    "ring-1 ring-primary": isAnchor || isTarget,
                                });
                                const tooltipName = skill.name;
                                const displayName = truncateName(skill.name);
                                return (
                                    <TableRow
                                        key={skill.name}
                                        data-state={isSelected ? "selected" : undefined}
                                        className={rowClass}
                                        onClick={(event) => handleRowClick(index, event)}
                                    >
                                        <TableCell className={cn("max-w-[160px]", skill.primary && "font-semibold")}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger className="w-full text-left">
                                                    {displayName}
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>Full name: {tooltipName}</p>
                                                    {tooltipName.length > NAME_TRUNCATE_AT && <p>Truncated for display.</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" aria-label="Edit skill" onClick={(event) => {
                                                    event.stopPropagation();
                                                    openEditSheet(skill);
                                                }}>
                                                    <SquarePen className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Delete skill"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDelete([index]);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {(debouncedSearch || (!allCategoriesSelected && categoryOptions.length > 0))
                            ? `${filteredRows.length}/${skillRows.length} skills`
                            : `${filteredRows.length} skills`}
                    </span>
                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setPageIndex((prev) => Math.max(0, prev - 1));
                                        }}
                                        aria-disabled={isFirstPage}
                                        className={isFirstPage ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            isActive={page === pageIndex}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setPageIndex(page);
                                            }}
                                        >
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                {!isLastPage && (
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
                                            }}
                                        />
                                    </PaginationItem>
                                )}
                            </PaginationContent>
                        </Pagination>
                    )}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(selectedIndicesArray)}
                            disabled={deleteButtonDisabled}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>

                {undoState && (
                    <div
                        className="bg-muted border rounded-md px-3 py-2 text-sm flex items-center justify-between gap-3"
                        onMouseEnter={pauseUndoTimer}
                        onMouseLeave={resumeUndoTimer}
                    >
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                            <span>
                                {undoState.mergedCount > 1 ? `Merged ${undoState.mergedCount} groups` : "Deleted"}
                            </span>
                            <span className="font-medium text-foreground">
                                {undoState.names
                                    .map((name) => (name.length > NAME_TRUNCATE_AT ? `${name.slice(0, NAME_TRUNCATE_AT)}…` : name))
                                    .join(", ")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleUndo}>
                                Undo
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleClearUndo}>
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{sheetMode === "create" ? "Add skill" : `Edit ${originalName}`}</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 px-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="skill-name">Name</Label>
                            <Input
                                id="skill-name"
                                value={draft.name}
                                onChange={(event) => updateDraft({ name: event.target.value })}
                                aria-invalid={Boolean(draftErrors.name)}
                            />
                            {draftErrors.name && <p className="text-sm text-destructive">{draftErrors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="skill-category">Category</Label>
                            <AppCategoryCombobox
                                id="skill-category"
                                value={draft.category}
                                options={categoryOptions}
                                onChange={(category) => updateDraft({ category })}
                                error={draftErrors.category}
                                disabled={isPersisting}
                                maxLength={MAX_CATEGORY_LENGTH}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="skill-level">Level</Label>
                            <Input
                                id="skill-level"
                                value={draft.level}
                                onChange={(event) => updateDraft({ level: event.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="skill-years">Years</Label>
                                <Input
                                    id="skill-years"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={draft.years}
                                    onChange={(event) => updateDraft({ years: event.target.value })}
                                    aria-invalid={Boolean(draftErrors.years)}
                                />
                                {draftErrors.years && <p className="text-sm text-destructive">{draftErrors.years}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="skill-last-used">Last used</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Input
                                            id="skill-last-used"
                                            value={draft.last_used}
                                            onChange={(event) => updateDraft({ last_used: event.target.value })}
                                            placeholder="YYYY-MM"
                                            aria-invalid={Boolean(draftErrors.last_used)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>Use YYYY-MM (e.g. 2024-09).</p>
                                        {draftErrors.last_used && <p>Fix to enable save.</p>}
                                    </TooltipContent>
                                </Tooltip>
                                {draftErrors.last_used && <p className="text-sm text-destructive">{draftErrors.last_used}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Aliases</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <BadgeInput
                                            id="skill-aliases"
                                            value={draft.aliases}
                                            onChange={handleAliasesChange}
                                            placeholder="Type alias and press ','"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>Up to 5 aliases, each ≤10 chars.</p>
                                    {draftErrors.aliases && <p>Fix to enable save.</p>}
                                </TooltipContent>
                            </Tooltip>
                            {draftErrors.aliases && <p className="text-sm text-destructive">{draftErrors.aliases}</p>}
                        </div>
                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="skill-primary" className="font-medium">Primary skill</Label>
                                <p className="text-sm text-muted-foreground">Primary skills appear first on initial load.</p>
                            </div>
                            <Checkbox
                                id="skill-primary"
                                checked={draft.primary}
                                onCheckedChange={(checked) => updateDraft({ primary: Boolean(checked) })}
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <div className="flex w-full justify-between gap-3">
                            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => void upsertSkill()} disabled={disableSheetSave}>
                                Save
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
