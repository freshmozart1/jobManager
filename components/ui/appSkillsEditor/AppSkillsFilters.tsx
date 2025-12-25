"use client";

import { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/inputGroup";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ChevronsUpDown } from "lucide-react";

import { normaliseName } from ".";

type AppSkillsFiltersProps = {
    search: string;
    setSearch: (value: string) => void;
    resetSelection: () => void;
    setPageIndex: (page: number) => void;
    popoverOpen: boolean;
    setPopoverOpen: (open: boolean) => void;
    triggerRef: RefObject<HTMLButtonElement | null>;
    hiddenLabelRef: RefObject<HTMLSpanElement | null>;
    categoryDisplayLabel: string;
    triggerAriaLabel: string;
    namesLabel: string;
    selectAllCategories: () => void;
    deselectAllCategories: () => void;
    selectAllDisabled: boolean;
    deselectAllDisabled: boolean;
    categoryOptions: string[];
    selectedCategories: Set<string>;
    toggleCategory: (category: string) => void;
    clearFilters: () => void;
};

export function AppSkillsFilters({
    search,
    setSearch,
    resetSelection,
    setPageIndex,
    popoverOpen,
    setPopoverOpen,
    triggerRef,
    hiddenLabelRef,
    categoryDisplayLabel,
    triggerAriaLabel,
    namesLabel,
    selectAllCategories,
    deselectAllCategories,
    selectAllDisabled,
    deselectAllDisabled,
    categoryOptions,
    selectedCategories,
    toggleCategory,
    clearFilters,
}: AppSkillsFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-3">
                <div>
                    <InputGroup className="[--radius:0.5rem] min-w-[200px] static">
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
                    <div className="flex-1">
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
                                <div
                                    className="max-h-[300px] overflow-y-auto px-3 py-2"
                                    role="group"
                                    aria-labelledby="skills-category-checklist"
                                >
                                    <p
                                        id="skills-category-checklist"
                                        className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                                    >
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
                                                        <label
                                                            htmlFor={checkboxId}
                                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                                        >
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
    );
}
