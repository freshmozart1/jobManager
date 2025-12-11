"use client";

import { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BadgeInput from "@/components/ui/badgeInput";
import { AppCategoryCombobox } from "@/components/ui/appCategoryCombobox";

export type SkillDraft = {
    name: string;
    category: string;
    level: string;
    years: string;
    last_used: string;
    aliases: string[];
    primary: boolean;
};

export type ValidationErrors = Partial<Record<keyof SkillDraft, string>> & { aliases?: string };

type AppSkillsSheetProps = {
    setSheetOpen: Dispatch<SetStateAction<boolean>>;
    sheetMode: "create" | "edit";
    originalName: string | undefined;
    draft: SkillDraft;
    draftErrors: ValidationErrors;
    updateDraft: (updates: Partial<SkillDraft>) => void;
    handleAliasesChange: (aliases: string[]) => void;
    categoryOptions: string[];
    isPersisting: boolean;
    MAX_CATEGORY_LENGTH: number;
    disableSheetSave: boolean;
    upsertSkill: () => Promise<void> | void;
};

export function AppSkillsSheet({
    setSheetOpen,
    sheetMode,
    originalName,
    draft,
    draftErrors,
    updateDraft,
    handleAliasesChange,
    categoryOptions,
    isPersisting,
    MAX_CATEGORY_LENGTH,
    disableSheetSave,
    upsertSkill,
}: AppSkillsSheetProps) {
    return (
        <div className="flex flex-col gap-4 h-full">
            <span className="p-4">{sheetMode === "create" ? "Add skill" : `Edit ${originalName}`}</span>
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
                            <p>Up to 5 aliases, each 10 chars.</p>
                            {draftErrors.aliases && <p>Fix to enable save.</p>}
                        </TooltipContent>
                    </Tooltip>
                    {draftErrors.aliases && <p className="text-sm text-destructive">{draftErrors.aliases}</p>}
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="skill-primary" className="font-medium">
                            Primary skill
                        </Label>
                        <p className="text-sm text-muted-foreground">Primary skills appear first on initial load.</p>
                    </div>
                    <Checkbox
                        id="skill-primary"
                        checked={draft.primary}
                        onCheckedChange={(checked) => updateDraft({ primary: Boolean(checked) })}
                    />
                </div>
            </div>
            <div className="mt-auto flex flex-col gap-2 p-4">
                <div className="flex w-full justify-between gap-3">
                    <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => void upsertSkill()} disabled={disableSheetSave}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
