'use client';
import { useFilterTableColumns } from "@/hooks/useFilterTableColumns";
import { flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, Table as TanStackTable } from "@tanstack/react-table";
import { use, useState, useEffect } from "react";

type JobsTableProps = {
    jobsPromise: Promise<Job[]>;
    filterAgent: FilterAgentPromise;
    className?: string;
};

export function JobsTable({ jobsPromise, filterAgent, className }: JobsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'postedAt', desc: true }]);
    const [filtering, setFiltering] = useState<boolean>(true);
    const columns = useFilterTableColumns();
    const [data, setData] = useState<JobWithNewFlag[]>(use(jobsPromise).map(j => ({ ...j, new: false })));
    const table: TanStackTable<JobWithNewFlag> = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        defaultColumn: {
            maxSize: 25
        }

    });

    useEffect(() => {
        if (!filtering) return;
        filterAgent.then(({ jobs }) => {
            if (!jobs?.length) return;
            setData(prev => {
                const map = new Map<string, JobWithNewFlag>();
                for (const j of prev) map.set(j.id, j);
                for (const j of jobs) if (!map.has(j.id)) map.set(j.id, { ...j, new: true });
                return Array.from(map.values());
            });
        });
        return () => setFiltering(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterAgent]);

    return (
        <table className={`text-sm ${className ?? ''}`}>
            <thead style={{ maxWidth: table.getHeaderGroups().reduce((acc, group) => acc + group.headers.reduce((max, header) => Math.max(max, header.getSize()), 0), 0) }}>
                {table.getHeaderGroups().map(({ id: headerGroupId, headers }) => (
                    <tr key={headerGroupId}>
                        {headers.map(({ id: headerId, isPlaceholder, column: { columnDef: { header }, getIsSorted, id: columnId }, getContext }) => {
                            const isPostedAt = columnId === 'postedAt';
                            const sortedState = getIsSorted();
                            return (
                                <th key={headerId} className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap border-b">
                                    {isPlaceholder ? null : (
                                        <div
                                            className={
                                                "break-words overflow-hidden" +
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
                                            {isPostedAt
                                                ? {
                                                    asc: '🔼',
                                                    desc: '🔽',
                                                }[sortedState as string] ?? null
                                                : null}
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
                        className={`${rowIndex < rowCount - 1 ? 'border-b' : ''} transition-colors hover:bg-muted/50`}
                    >
                        {getVisibleCells().map(({ id: cellId, column, getContext }) => (
                            <td key={cellId} className="p-2">
                                <div className="flex gap-2 items-center">
                                    {original.new && column.id === 'title'
                                        ? <svg
                                            className="size-4 grow-0 fill-green-100 stroke-1 stroke-green-200"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        : null
                                    }
                                    <span className="line-clamp-2">{flexRender(column.columnDef.cell, getContext())}</span>
                                </div>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table >
    );
}