'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { PersonalInformationSkill } from "@/types";

import { useCategoryFilter } from "./hooks/useCategoryFilter";
import { useSkillsPagination } from "./hooks/useSkillsPagination";
import { useUndoBanner } from "./hooks/useUndoBanner";
import useSkillRows from "./hooks/useSkillRows";
import { normaliseName } from "./shared";
import { AppSkillsFilters } from "./AppSkillsFilters";
import { AppSkillsTable } from "./AppSkillsTable";
import { AppSkillsUndoBanner } from "./AppSkillsUndoBanner";
import AppSkillsFooter from "./AppSkillsFooter";
import { AppSkillsSheet } from "./AppSkillsSheet";

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

type AppSkillsEditorProps = {
    skills: PersonalInformationSkill[];
    onChange: (skills: PersonalInformationSkill[]) => void;
    onPersist: (skills: PersonalInformationSkill[]) => Promise<void>;
    onRegisterAddSkill?: (handler: (() => void) | null) => void;
};

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

const NAME_TRUNCATE_AT = 12;
const SEARCH_DEBOUNCE_MS = 150;
const MAX_ALIAS_COUNT = 5;
const MAX_ALIAS_LENGTH = 10;
const MAX_CATEGORY_LENGTH = 30;

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
    const [isPersisting, setIsPersisting] = useState(false);
    const [persistError, setPersistError] = useState<string | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const hiddenLabelRef = useRef<HTMLSpanElement | null>(null);
    const bulkDeleteRef = useRef<HTMLButtonElement | null>(null);
    const [triggerContentWidth, setTriggerContentWidth] = useState(0);
    const [namesLabelWidth, setNamesLabelWidth] = useState(0);
    const lastShowBulkDeleteRef = useRef(false);

    const { categoryOptions, selectedCategories, popoverOpen, setPopoverOpen, toggleCategory, selectAllCategories, deselectAllCategories } =
        useCategoryFilter(internalSkills);

    const { undoState, setUndoState, pauseUndoTimer, resumeUndoTimer, clearUndo } = useUndoBanner();

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

    const [skillRows, filteredRows] = useSkillRows(
        internalSkills,
        selectedCategories,
        debouncedSearch,
        categoryOptions
    );

    const {
        pageIndex,
        setPageIndex,
        pagedRows,
        totalPages,
        isFirstPage,
        isLastPage,
    } = useSkillsPagination(filteredRows);

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
            nextSkills = internalSkills.map((existing) =>
                normaliseName(existing.name) === normaliseName(originalName ?? "") ? skill : existing
            );
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
        clearUndo();
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

    const clearFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setPageIndex(0);
        resetSelection();
        if (categoryOptions.length > 0) {
            selectAllCategories();
        }
    };

    const selectedCategoryArray = useMemo(() => {
        return Array.from(selectedCategories).sort((a, b) => a.localeCompare(b));
    }, [selectedCategories]);

    const selectedCategoryCount = selectedCategoryArray.length;
    const hasCategorySelection = selectedCategoryCount > 0;
    const namesLabel = selectedCategoryArray.join(", ");
    const allCategoriesSelected =
        hasCategorySelection && selectedCategoryCount === categoryOptions.length && categoryOptions.length > 0;

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

    const shouldShowNames =
        hasCategorySelection && triggerContentWidth >= 200 && namesLabelWidth > 0 && namesLabelWidth <= triggerContentWidth;

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

    const selectAllDisabled =
        categoryOptions.length === 0 || (hasCategorySelection && selectedCategoryCount === categoryOptions.length);
    const deselectAllDisabled = selectedCategoryCount === 0;

    const selectedIndicesArray = useMemo(
        () => Array.from(selectedIndices).sort((a, b) => a - b),
        [selectedIndices]
    );
    const showBulkDelete = selectedIndicesArray.length > 1;
    const bulkDeleteDisabled = isPersisting;
    const disableSheetSave = isPersisting || Object.keys(draftErrors).length > 0;

    useEffect(() => {
        if (!showBulkDelete && lastShowBulkDeleteRef.current) {
            if (document.activeElement === bulkDeleteRef.current) {
                const searchInput = document.getElementById("skills-search") as HTMLInputElement | null;
                searchInput?.focus();
            }
        }
        lastShowBulkDeleteRef.current = showBulkDelete;
    }, [showBulkDelete]);

    return (
        <div className="space-y-4">
            <AppSkillsFilters
                search={search}
                setSearch={setSearch}
                resetSelection={resetSelection}
                setPageIndex={setPageIndex}
                popoverOpen={popoverOpen}
                setPopoverOpen={setPopoverOpen}
                triggerRef={triggerRef}
                hiddenLabelRef={hiddenLabelRef}
                categoryDisplayLabel={categoryDisplayLabel}
                triggerAriaLabel={triggerAriaLabel}
                namesLabel={namesLabel}
                selectAllCategories={selectAllCategories}
                deselectAllCategories={deselectAllCategories}
                selectAllDisabled={selectAllDisabled}
                deselectAllDisabled={deselectAllDisabled}
                categoryOptions={categoryOptions}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                clearFilters={clearFilters}
            />

            {persistError && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-md px-3 py-2 text-sm">
                    {persistError}
                </div>
            )}

            <AppSkillsTable
                pagedRows={pagedRows}
                anchorIndex={anchorIndex}
                targetIndex={targetIndex}
                selectedIndices={selectedIndices}
                handleRowClick={handleRowClick}
                handleDelete={handleDelete}
                openEditSheet={openEditSheet}
                NAME_TRUNCATE_AT={NAME_TRUNCATE_AT}
                bulkDeleteRef={bulkDeleteRef}
                selectedIndicesArray={selectedIndicesArray}
                bulkDeleteDisabled={bulkDeleteDisabled}
                showBulkDelete={showBulkDelete}
            />

            <AppSkillsUndoBanner
                undoState={undoState}
                pauseUndoTimer={pauseUndoTimer}
                resumeUndoTimer={resumeUndoTimer}
                handleUndo={handleUndo}
                handleClearUndo={clearUndo}
                NAME_TRUNCATE_AT={NAME_TRUNCATE_AT}
            />

            {/* <AppSkillsSheet
                sheetOpen={sheetOpen}
                setSheetOpen={setSheetOpen}
                sheetMode={sheetMode}
                originalName={originalName}
                draft={draft}
                draftErrors={draftErrors}
                updateDraft={updateDraft}
                handleAliasesChange={handleAliasesChange}
                categoryOptions={categoryOptions}
                isPersisting={isPersisting}
                MAX_CATEGORY_LENGTH={MAX_CATEGORY_LENGTH}
                disableSheetSave={disableSheetSave}
                upsertSkill={upsertSkill}
            /> */}

            <AppSkillsFooter
                debouncedSearch={debouncedSearch}
                allCategoriesSelected={allCategoriesSelected}
                categoryOptions={categoryOptions}
                filteredRowsCount={filteredRows.length}
                skillRowsCount={skillRows.length}
                totalPages={totalPages}
                pageIndex={pageIndex}
                setPageIndex={setPageIndex}
                isFirstPage={isFirstPage}
                isLastPage={isLastPage}
            />
        </div>
    );
}