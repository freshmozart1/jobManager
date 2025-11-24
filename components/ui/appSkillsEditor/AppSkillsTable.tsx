"use client";

import { MouseEvent, RefObject } from "react";

import { PersonalInformationSkill } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SquarePen, Trash2 } from "lucide-react";

type SkillRow = {
    skill: PersonalInformationSkill;
    index: number;
};

type AppSkillsTableProps = {
    pagedRows: SkillRow[];
    anchorIndex: number | null;
    targetIndex: number | null;
    selectedIndices: Set<number>;
    handleRowClick: (rowIndex: number, event: MouseEvent<HTMLTableRowElement>) => void;
    handleDelete: (indicesToRemove: number[]) => Promise<void> | void;
    openEditSheet: (skill: PersonalInformationSkill) => void;
    NAME_TRUNCATE_AT: number;
    bulkDeleteRef: RefObject<HTMLButtonElement | null>;
    selectedIndicesArray: number[];
    bulkDeleteDisabled: boolean;
    showBulkDelete: boolean;
};

export function AppSkillsTable({
    pagedRows,
    anchorIndex,
    targetIndex,
    selectedIndices,
    handleRowClick,
    handleDelete,
    openEditSheet,
    NAME_TRUNCATE_AT,
    bulkDeleteRef,
    selectedIndicesArray,
    bulkDeleteDisabled,
    showBulkDelete,
}: AppSkillsTableProps) {
    const truncateName = (value: string): string => {
        if (value.length <= NAME_TRUNCATE_AT) return value;
        return `${value.slice(0, NAME_TRUNCATE_AT)}…`;
    };

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table aria-label="Skills (searchable by name, category, level, years, aliases)">
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
                                        <TableCell className={cn("max-w-[160px]", skill.primary && "font-semibold")}>
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Edit skill"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openEditSheet(skill);
                                                    }}
                                                >
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

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    <div className="flex min-h-[36px] min-w-[140px] items-center justify-end">
                        <Button
                            ref={bulkDeleteRef}
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(selectedIndicesArray)}
                            disabled={bulkDeleteDisabled}
                            aria-hidden={showBulkDelete ? undefined : true}
                            tabIndex={showBulkDelete ? 0 : -1}
                            className={cn(
                                "transition-all duration-150 ease-out",
                                showBulkDelete ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"
                            )}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
