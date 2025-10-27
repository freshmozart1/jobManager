'use client';
import { useFilterTableColumns } from "@/hooks/useFilterTableColumns";
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, Table as TanStackTable, PaginationState, getPaginationRowModel, SortDirection } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useToUrl from "@/hooks/useToUrl";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"
import { JobWithNewFlag } from "@/types";
type JobsTableProps = {
    jobs: JobWithNewFlag[];
    className?: string;
};

function SVGSortIcon({ direction }: { direction: false | SortDirection }) {
    const SVGBase = ({ d }: { d: string }) => <svg
        aria-hidden="true"
        className="size-3 text-foreground"
        viewBox="0 0 12 12"
        fill="currentColor"
        stroke="none"
        strokeWidth="0"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d={d} />
    </svg>;
    return <SVGBase d={direction === 'asc' ? "M6 3l-3 4h6L6 3z" : "M6 9l3-4H3l3 4z"} />;
}

export function AppJobsTable({ jobs, className }: JobsTableProps) {
    const router = useRouter();
    const toUrl = useToUrl();
    const [sorting, setSorting] = useState<SortingState>([{ id: 'postedAt', desc: true }]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
    const columns = useFilterTableColumns();
    const table: TanStackTable<JobWithNewFlag> = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        state: {
            sorting,
            pagination
        }
    });

    const handleRowClick = (job: JobWithNewFlag) => {
        router.push(toUrl(`/jobs/${job.id}`));
    };

    return (
        <table className={`text-sm ${className ?? ''}`} style={{ minHeight: 370.5, overflow: 'hidden' }}>
            <thead>
                {table.getHeaderGroups().map(({ id: headerGroupId, headers }) => (
                    <tr key={headerGroupId}>
                        {headers.map(({ id: headerId, isPlaceholder, column: { columnDef: { header }, getIsSorted, id: columnId }, getContext }) => {
                            const isPostedAt = columnId === 'postedAt';
                            const sortedState = getIsSorted();
                            return (
                                <th key={headerId} className={`h-10 min-w-[32px] font-medium whitespace-nowrap border-b`}>
                                    {isPlaceholder ? null : (
                                        <div
                                            className={
                                                "flex items-center" +
                                                (isPostedAt ? " cursor-pointer select-none" : "")
                                            }
                                            onClick={
                                                isPostedAt
                                                    ? () =>
                                                        setSorting(prev => {
                                                            const current = prev.find(s => s.id === 'postedAt');
                                                            const desc = current ? current.desc : true;
                                                            return [{ id: 'postedAt', desc: !desc }];
                                                        })
                                                    : undefined
                                            }
                                            title={
                                                isPostedAt
                                                    ? `Sort ${sortedState === 'desc' ? 'ascending' : 'descending'}`
                                                    : undefined
                                            }
                                        >
                                            {flexRender(header, getContext())}
                                            {isPostedAt ? (
                                                <SVGSortIcon direction={sortedState} />
                                            ) : null}
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map(({ id: rowId, getVisibleCells, original }, rowIndex, { length: rowCount }) => (
                    <tr
                        key={rowId}
                        className={`${rowIndex < rowCount - 1 ? 'border-b ' : ''}hover:bg-muted/50 cursor-pointer`}
                        onClick={() => handleRowClick(original)}
                    >
                        {getVisibleCells().map(({ id: cellId, column, getContext }) => (
                            column.columnDef.id !== 'new' ? <td key={cellId} className="p-2 align-middle">
                                <div className="flex gap-2 items-start">
                                    <span className="line-clamp-2">{flexRender(column.columnDef.cell, getContext())}</span>
                                </div>
                            </td> : <td key={cellId} className="p-2">{flexRender(column.columnDef.cell, getContext())}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={columns.length}>
                        <Pagination>
                            <PaginationContent>
                                {
                                    table.getPageCount() <= 1
                                        ? null
                                        : Array.from({ length: table.getPageCount() }, (_, i) =>
                                            <PaginationItem key={i}>
                                                <PaginationLink onClick={() => table.setPageIndex(i)} isActive={table.getState().pagination.pageIndex === i}>
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                }
                            </PaginationContent>
                        </Pagination>
                    </td>
                </tr>
            </tfoot>
        </table>
    );
}