'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { PersonalInformationSkill } from "@/types";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BadgeInput from "@/components/ui/badgeInput";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 10;

const NAME_TRUNCATE_AT = 12;
const SEARCH_DEBOUNCE_MS = 150;
const BANNER_TIMEOUT_MS = 5000;
const MAX_ALIAS_COUNT = 5;
const MAX_ALIAS_LENGTH = 10;

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

export default function AppSkillsEditor({ skills, onChange, onPersist }: AppSkillsEditorProps) {
    const initialisedRef = useRef(false);
    const previousSkillsRef = useRef<PersonalInformationSkill[]>(cloneSkills(skills));

    const [internalSkills, setInternalSkills] = useState<PersonalInformationSkill[]>(() => sortByPrimaryFirst(skills));
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
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

    const skillRows = useMemo(() => {
        return internalSkills.map((skill, index) => ({ skill, index }));
    }, [internalSkills]);

    const filteredRows = useMemo(() => {
        return skillRows.filter(({ skill }) => {
            const matchesCategory = categoryFilter === "all" || normaliseName(skill.category) === normaliseName(categoryFilter);
            if (!matchesCategory) return false;
            if (!debouncedSearch) return true;
            const value = debouncedSearch;
            const haystack = [
                skill.name,
                skill.category,
                skill.level,
                ...skill.aliases,
            ]
                .filter(Boolean)
                .map((part) => part.toLowerCase());
            return haystack.some((part) => part.includes(value));
        });
    }, [skillRows, categoryFilter, debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

    useEffect(() => {
        if (pageIndex > totalPages - 1) {
            setPageIndex(Math.max(0, totalPages - 1));
        }
    }, [pageIndex, totalPages]);

    const pagedRows = useMemo(() => {
        const start = pageIndex * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, pageIndex]);

    const categoryOptions = useMemo(() => {
        const categories = new Set<string>();
        internalSkills.forEach((skill) => {
            if (skill.category.trim()) {
                categories.add(skill.category);
            }
        });
        return Array.from(categories).sort((a, b) => a.localeCompare(b));
    }, [internalSkills]);

    useEffect(() => {
        if (categoryFilter !== "all" && !categoryOptions.includes(categoryFilter)) {
            setCategoryFilter("all");
        }
    }, [categoryFilter, categoryOptions]);

    const resetSelection = () => {
        setSelectedIndices(new Set());
        setTargetIndex(null);
        setAnchorIndex(null);
    };

    const openCreateSheet = () => {
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
    };

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
                if (end - start <= 1) {
                    setSelectedIndices(new Set());
                } else {
                    const inner = filteredIndices.slice(start + 1, end);
                    setSelectedIndices(new Set(inner));
                }
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
        setCategoryFilter("all");
        setPageIndex(0);
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
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="skills-search">Search skills</Label>
                    <Input
                        id="skills-search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPageIndex(0);
                            resetSelection();
                        }}
                        placeholder="Search by name, category, level, or alias"
                    />
                </div>
                <div className="w-full sm:w-60 space-y-1.5">
                    <Label htmlFor="skills-category">Category filter</Label>
                    <div className="flex items-center gap-2">
                        <Select
                            value={categoryFilter}
                            onValueChange={(value) => {
                                setCategoryFilter(value);
                                setPageIndex(0);
                                resetSelection();
                            }}
                        >
                            <SelectTrigger id="skills-category" className="w-full">
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {categoryOptions.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => {
                            clearFilters();
                            resetSelection();
                        }} className="shrink-0">
                            Clear
                        </Button>
                    </div>
                </div>
                <Button onClick={openCreateSheet} className="sm:self-start">
                    Add Skill
                </Button>
            </div>

            {persistError && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-md px-3 py-2 text-sm">
                    {persistError}
                </div>
            )}

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Years</TableHead>
                            <TableHead>Last used</TableHead>
                            <TableHead>Aliases</TableHead>
                            <TableHead className="text-center">Primary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
                                        <TableCell>{skill.category || "—"}</TableCell>
                                        <TableCell>{skill.level || "—"}</TableCell>
                                        <TableCell>{skill.years.toString()}</TableCell>
                                        <TableCell>
                                            <Tooltip>
                                                <TooltipTrigger>{skill.last_used || "—"}</TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>Use YYYY-MM (e.g. 2024-09).</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip>
                                                <TooltipTrigger className="flex items-center gap-1">
                                                    <span>{skill.aliases.length}</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>Up to 5 aliases, each ≤10 chars.</p>
                                                    {skill.aliases.length > 0 && (
                                                        <ul className="mt-1 space-y-0.5">
                                                            {skill.aliases.map((alias) => (
                                                                <li key={alias}>{alias}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Tooltip>
                                                <TooltipTrigger className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full border", skill.primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                                                >
                                                    {skill.primary ? "●" : "○"}
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>Marks skill as primary; primary skills appear first on initial load.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={(event) => {
                                                    event.stopPropagation();
                                                    openEditSheet(skill);
                                                }}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleDelete([index]);
                                                    }}
                                                >
                                                    Delete
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
                    <span className="text-sm text-muted-foreground">{filteredRows.length} skills</span>
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

                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setPageIndex((prev) => Math.max(0, prev - 1));
                                }}
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
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>

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
                            <Input
                                id="skill-category"
                                value={draft.category}
                                onChange={(event) => updateDraft({ category: event.target.value })}
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
                            <div>
                                <p className="font-medium">Primary skill</p>
                                <p className="text-sm text-muted-foreground">Primary skills appear first on initial load.</p>
                            </div>
                            <Button
                                variant={draft.primary ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateDraft({ primary: !draft.primary })}
                            >
                                {draft.primary ? "Primary" : "Make primary"}
                            </Button>
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
