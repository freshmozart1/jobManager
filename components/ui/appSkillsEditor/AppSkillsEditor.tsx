'use client'

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { PersonalInformationSkill } from "@/types";

import { useCategoryFilter } from "./hooks/useCategoryFilter";
import { useSkillsPagination } from "./hooks/useSkillsPagination";
import useSkillRows from "./hooks/useSkillRows";
import { normaliseName } from "./shared";
import { AppSkillsFilters } from "./AppSkillsFilters";
import { AppSkillsTable } from "./AppSkillsTable";
import AppSkillsFooter from "./AppSkillsFooter";
import { AppSkillsSheet } from "./AppSkillsSheet";
import { useAppDrawer } from "@/components/ui/AppDrawer";
import { SkillRow } from ".";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import { AppItemUndoBanner } from "@/components/ui/appItemEditor/AppItemUndoBanner";
import type { ItemEditorController } from "@/components/ui/appItemEditor/useItemEditor";

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

function cloneSkills(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return skills.map((skill) => ({
        ...skill,
        aliases: [...(skill.aliases ?? [])],
    }));
}

function normaliseSkills(value: unknown): PersonalInformationSkill[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;

            const name = typeof source.name === "string" ? source.name.trim() : "";
            const category = typeof source.category === "string" ? source.category.trim() : "";
            const level = typeof source.level === "string" ? source.level.trim() : "";
            const years = typeof source.years === "number" ? source.years : Number(source.years);
            const last_used = typeof source.last_used === "string" ? source.last_used : "";
            const aliasesRaw = Array.isArray(source.aliases) ? source.aliases : [];
            const aliases = aliasesRaw
                .filter((a): a is string => typeof a === "string")
                .map((a) => a.trim())
                .filter(Boolean);
            const primary = Boolean(source.primary);

            if (!name) return null;
            return {
                name,
                aliases,
                category,
                level,
                years: Number.isFinite(years) ? years : 0,
                last_used,
                primary,
            } satisfies PersonalInformationSkill;
        })
        .filter((item): item is PersonalInformationSkill => item !== null);
}

function sortSkills(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return [...skills].sort((a, b) =>
        a.primary === b.primary
            ? 0
            : a.primary
                ? -1
                : 1
    );
}

function getSkillLabel(skill: PersonalInformationSkill): string {
    return skill.name;
}

const NAME_TRUNCATE_AT = 12;
const SEARCH_DEBOUNCE_MS = 150;
const MAX_ALIAS_COUNT = 5;
const MAX_ALIAS_LENGTH = 10;
const MAX_CATEGORY_LENGTH = 30;


function validateSkillDraft(
    draft: SkillDraft,
    existing: PersonalInformationSkill[],
    originalName?: string
): ValidationErrors {
    const errors: ValidationErrors = {};
    const { name, category, years: dYears, last_used, aliases } = draft;
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const years = Number(dYears);
    const aliasSet = new Set<string>();

    if (!trimmedName) errors.name = "Name is required.";
    else {
        const normalized = normaliseName(trimmedName);
        if (existing.some(
            skill => (originalName && normaliseName(originalName) === normalized)
                ? false
                : normaliseName(skill.name) === normalized
        )) errors.name = "Name must be unique.";
    }
    if (!trimmedCategory) errors.category = "Category is required.";
    else if (trimmedCategory.length > MAX_CATEGORY_LENGTH) errors.category = "Category must be 30 characters or less.";
    if (Number.isNaN(years) || years < 0) errors.years = "Years must be a non-negative number.";
    if (!/^\d{4}-\d{2}$/.test(last_used)) errors.last_used = "Use YYYY-MM format.";
    else {
        const month = Number(last_used.split("-")[1]);
        if (month < 1 || month > 12) errors.last_used = "Month must be between 01 and 12.";
    }
    if (aliases.length > MAX_ALIAS_COUNT) errors.aliases = "Up to 5 aliases allowed.";

    const nameKey = normaliseName(name);
    for (const alias of aliases) {
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

export default function AppSkillsEditor({
    skills: skillsProp,
    onChange,
    onPersist,
    onRegisterAddSkill
}: AppSkillsEditorProps) {
    function SkillsEditorInner({ editor }: { editor: ItemEditorController<PersonalInformationSkill> }) {
        const internalSkills = editor.items;

        const [search, setSearch]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
        const [debouncedSearch, setDebouncedSearch]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
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
        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const hiddenLabelRef = useRef<HTMLSpanElement | null>(null);
        const bulkDeleteRef = useRef<HTMLButtonElement | null>(null);
        const [triggerContentWidth, setTriggerContentWidth] = useState(0);
        const [namesLabelWidth, setNamesLabelWidth] = useState(0);
        const lastShowBulkDeleteRef = useRef(false);

        const {
            categoryOptions,
            selectedCategories,
            popoverOpen,
            setPopoverOpen,
            toggleCategory,
            selectAllCategories,
            deselectAllCategories,
            selectedCategoryCount,
            categoryNamesLabel: namesLabel,
            hasCategorySelection,
            allCategoriesSelected,
            triggerAriaLabel,
        }: {
            categoryOptions: string[];
            selectedCategories: Set<string>;
            popoverOpen: boolean;
            setPopoverOpen: Dispatch<SetStateAction<boolean>>;
            toggleCategory: (category: string) => void;
            selectAllCategories: () => void;
            deselectAllCategories: () => void;
            selectedCategoryCount: number;
            categoryNamesLabel: string;
            hasCategorySelection: boolean;
            allCategoriesSelected: boolean;
            triggerAriaLabel: string;
        } = useCategoryFilter(internalSkills);

        useEffect(
            () => {
                const handle: number = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
                return () => window.clearTimeout(handle);
            },
            [search]
        );

        useEffect(
            () => {
                const element: HTMLButtonElement | null = triggerRef.current;
                if (typeof window === "undefined" || !element || typeof window.ResizeObserver === "undefined") return;
                const {
                    paddingLeft,
                    paddingRight
                }: {
                    paddingLeft: string;
                    paddingRight: string
                } = window.getComputedStyle(element);
                const updateWidth: () => void = () => setTriggerContentWidth(Math.max(0, element.getBoundingClientRect().width - (parseFloat(paddingLeft || "0") + parseFloat(paddingRight || "0"))));
                updateWidth();
                const observer: ResizeObserver = new ResizeObserver(() => {
                    updateWidth();
                });
                observer.observe(element);
                return () => observer.disconnect();
            },
            []
        );

        const [skillRows, filteredRows]: SkillRow[][] = useSkillRows(
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
        }: {
            pageIndex: number;
            setPageIndex: Dispatch<SetStateAction<number>>;
            pagedRows: SkillRow[];
            totalPages: number;
            isFirstPage: boolean;
            isLastPage: boolean;
        } = useSkillsPagination(filteredRows);

        const resetSelection: () => void = useCallback<() => void>(
            () => {
                setSelectedIndices(new Set());
                setTargetIndex(null);
                setAnchorIndex(null);
            },
            []
        );

        const openCreateSheet: () => void = useCallback<() => void>(
            () => {
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
            },
            []
        );

        useEffect(
            () => {
                if (!onRegisterAddSkill) return;
                onRegisterAddSkill(openCreateSheet);
                return () => onRegisterAddSkill(null);
            },
            [openCreateSheet]
        );

        const openEditSheet: (skill: PersonalInformationSkill) => void = useCallback<(skill: PersonalInformationSkill) => void>(
            (skill: PersonalInformationSkill) => {
                setSheetMode("edit");
                setDraft({
                    name: skill.name,
                    category: skill.category,
                    level: skill.level,
                    years: String(skill.years ?? ""),
                    last_used: skill.last_used ?? "",
                    aliases: skill.aliases ?? [],
                    primary: Boolean(skill.primary),
                });
                setOriginalName(skill.name);
                setDraftErrors({});
                setSheetOpen(true);
            },
            []
        );

        const updateDraft: (updates: Partial<SkillDraft>) => void = useCallback<(updates: Partial<SkillDraft>) => void>(
            (updates: Partial<SkillDraft>) => {
                setDraft((prev: SkillDraft) => {
                    const next: SkillDraft = { ...prev, ...updates };
                    setDraftErrors(validateSkillDraft(next, internalSkills, originalName));
                    return next;
                });
            },
            [internalSkills, originalName]
        );

        const handleAliasesChange: (aliases: string[]) => void = useCallback<(aliases: string[]) => void>(
            (aliases: string[]) => {
                const sanitized: string[] = aliases.map<string>((alias: string) => alias.trim()).filter(Boolean);
                const setError = (msg: string) => setDraftErrors((prev: ValidationErrors) => ({
                    ...prev,
                    aliases: msg
                }));
                if (sanitized.length > MAX_ALIAS_COUNT) return setError(`Up to ${MAX_ALIAS_COUNT} aliases allowed.`);
                if (sanitized.some((alias) => alias.length > MAX_ALIAS_LENGTH)) return setError(`Aliases must be ${MAX_ALIAS_LENGTH} characters or less.`);
                updateDraft({ aliases: sanitized });
            },
            [updateDraft]
        );

        const upsertSkill = useCallback(
            async () => {
                const errors = validateSkillDraft(draft, internalSkills, originalName);
                setDraftErrors(errors);
                if (Object.keys(errors).length > 0) return;
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

                setSheetOpen(false);
                resetSelection();
                return editor.commit(sortSkills(nextSkills), cloneSkills(internalSkills), "Save failed. Reverted.");
            },
            [
                draft,
                internalSkills,
                originalName,
                sheetMode,
                editor,
                resetSelection,
                setSheetOpen
            ]
        );

        const handleDelete: (indicesToRemove: number[]) => Promise<void> = useCallback<(indicesToRemove: number[]) => Promise<void>>(
            async (indicesToRemove: number[]) => {
                const uniqueIndices: number[] = Array.from<number>(new Set(indicesToRemove)).sort((a: number, b: number) => a - b);
                if (uniqueIndices.length === 0) return;
                resetSelection();
                return editor.deleteByIndices(uniqueIndices, "Failed to delete skills. Item(s) were restored.");
            },
            [
                resetSelection,
                editor
            ]
        );

        const handleUndo: () => Promise<void> = useCallback<() => Promise<void>>(
            async () => {
                resetSelection();
                return editor.undoDelete("Failed to undo delete. Changes were reverted.");
            },
            [
                editor,
                resetSelection
            ]
        );

        const handleRowClick: (
            rowIndex: number,
            event: MouseEvent<HTMLTableRowElement, globalThis.MouseEvent>
        ) => void = useCallback<(
            rowIndex: number,
            event: MouseEvent<HTMLTableRowElement, globalThis.MouseEvent>
        ) => void>(
            (
                rowIndex: number,
                event: MouseEvent<HTMLTableRowElement>
            ) => {
                if (event.shiftKey && anchorIndex !== null) {
                    const filteredIndices: number[] = filteredRows.map<number>(({ index }: { index: number }) => index);
                    const anchorPosition: number = filteredIndices.indexOf(anchorIndex);
                    const targetPosition: number = filteredIndices.indexOf(rowIndex);
                    if (anchorPosition !== -1 && targetPosition !== -1) {
                        setTargetIndex(rowIndex);
                        const [start, end]: [number, number] = anchorPosition < targetPosition
                            ? [anchorPosition, targetPosition]
                            : [targetPosition, anchorPosition];
                        setSelectedIndices(new Set(filteredIndices.slice(start, end + 1)));
                        return;
                    }
                }

                setAnchorIndex(rowIndex);
                setTargetIndex(null);
                setSelectedIndices(new Set());
            },
            [anchorIndex, filteredRows]
        );

        const clearFilters: () => void = useCallback<() => void>(
            () => {
                setSearch("");
                setDebouncedSearch("");
                setPageIndex(0);
                resetSelection();
                if (categoryOptions.length > 0) {
                    selectAllCategories();
                }
            },
            [
                categoryOptions,
                resetSelection,
                selectAllCategories,
                setPageIndex
            ]
        );

        useEffect(
            () => {
                if (typeof window === "undefined") return;
                const frame: number = window.requestAnimationFrame(() => setNamesLabelWidth(
                    hiddenLabelRef.current
                        ? hiddenLabelRef.current.getBoundingClientRect().width
                        : 0
                ));
                return () => window.cancelAnimationFrame(frame);
            },
            [namesLabel]
        );

        const categoryDisplayLabel: string = useMemo<string>(
            () => {
                if (!hasCategorySelection) return categoryOptions.length === 0 ? "No categories available" : "No categories selected";
                if (
                    triggerContentWidth >= 200
                    && namesLabelWidth > 0
                    && namesLabelWidth <= triggerContentWidth
                ) return namesLabel;
                if (allCategoriesSelected) return "All categories";
                return `${selectedCategoryCount} selected`;
            },
            [
                hasCategorySelection,
                categoryOptions,
                triggerContentWidth,
                namesLabelWidth,
                namesLabel,
                allCategoriesSelected,
                selectedCategoryCount
            ]
        );

        const selectAllDisabled = categoryOptions.length === 0 || (hasCategorySelection && selectedCategoryCount === categoryOptions.length);
        const deselectAllDisabled = selectedCategoryCount === 0;

        const selectedIndicesArray: number[] = useMemo<number[]>(
            () => Array.from<number>(selectedIndices).sort((a: number, b: number) => a - b),
            [selectedIndices]
        );
        const showBulkDelete: boolean = selectedIndicesArray.length > 1;
        const bulkDeleteDisabled: boolean = editor.isPersisting;
        const disableSheetSave: boolean = editor.isPersisting || Object.keys(draftErrors).length > 0;

        useEffect(
            () => {
                if (
                    !showBulkDelete
                    && lastShowBulkDeleteRef.current
                    && document.activeElement === bulkDeleteRef.current
                ) document.getElementById("skills-search")?.focus();
                lastShowBulkDeleteRef.current = showBulkDelete;
            },
            [showBulkDelete]
        );

        const { toggleDrawer } = useAppDrawer();

        const drawerContent = useMemo(
            () => <AppSkillsSheet
                setSheetOpen={setSheetOpen}
                sheetMode={sheetMode}
                originalName={originalName}
                draft={draft}
                draftErrors={draftErrors}
                updateDraft={updateDraft}
                handleAliasesChange={handleAliasesChange}
                categoryOptions={categoryOptions}
                isPersisting={editor.isPersisting}
                MAX_CATEGORY_LENGTH={MAX_CATEGORY_LENGTH}
                disableSheetSave={disableSheetSave}
                upsertSkill={upsertSkill}
            />,
            [
                sheetMode,
                originalName,
                draft,
                draftErrors,
                categoryOptions,
                editor.isPersisting,
                disableSheetSave,
                setSheetOpen,
                updateDraft,
                handleAliasesChange,
                upsertSkill
            ]
        );

        const prevSheetOpen = useRef(sheetOpen);

        useEffect(
            () => {
                if (sheetOpen) {
                    toggleDrawer("right", drawerContent, 0, true);
                } else if (prevSheetOpen.current) {
                    toggleDrawer("right", undefined);
                }
                prevSheetOpen.current = sheetOpen;
            },
            [
                sheetOpen,
                drawerContent,
                toggleDrawer
            ]
        );

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

                {editor.persistError && (
                    <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-md px-3 py-2 text-sm">
                        {editor.persistError}
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

                <AppItemUndoBanner
                    undoState={editor.undoState}
                    pauseUndoTimer={editor.pauseUndoTimer}
                    resumeUndoTimer={editor.resumeUndoTimer}
                    onUndo={handleUndo}
                    onDismiss={editor.dismissUndo}
                    truncateAt={NAME_TRUNCATE_AT}
                />

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

    return (
        <AppItemEditor<PersonalInformationSkill>
            items={skillsProp}
            normaliseItems={normaliseSkills}
            sortItems={sortSkills}
            cloneItems={cloneSkills}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={getSkillLabel}
        >
            {(editor) => <SkillsEditorInner editor={editor} />}
        </AppItemEditor>
    );
}