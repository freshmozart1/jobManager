'use client';
import { Suspense, use } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

const columns: ColumnDef<Job>[] = [
    {
        accessorKey: 'title',
        header: 'Job',
    },
    {
        accessorKey: 'companyName',
        header: 'Company'
    },
    {
        accessorKey: 'postedAt',
        header: 'Posted at',
        cell: ({ row }) => (new Date(row.getValue('postedAt')).toLocaleDateString())
    },
    {
        accessorKey: 'applyUrl',
        header: 'Apply here',
        cell: ({ row }) => (<a href={row.getValue('applyUrl')}>Apply</a>)
    }
];

// Child component that waits for the filterAgent results and then renders the merged table.
function FinalMergedTable({ jobs, filterAgent }: { jobs: Job[]; filterAgent: FilterAgentPromise; }) {
    const filterAgentResults = use<FilterAgentResult>(filterAgent);
    const mergedJobs = (() => {
        if (!filterAgentResults?.jobs?.length) return jobs;
        const map = new Map<string, Job>();
        for (const j of jobs) map.set(j.id, j);
        for (const j of filterAgentResults.jobs) if (!map.has(j.id)) map.set(j.id, j);
        return Array.from(map.values());
    })();
    const filteredIds = new Set(filterAgentResults.jobs.map(j => j.id));
    const table = useReactTable({
        data: mergedJobs,
        columns,
        getCoreRowModel: getCoreRowModel()
    });
    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={filteredIds.has((row.original as Job).id) ? 'bg-green-50 dark:bg-green-900/30' : undefined}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

// Fallback table shown while filterAgent (child) is still pending: first row is a loading indicator, followed by the original jobs.
function LoadingTable({ jobs }: { jobs: Job[] }) {
    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel()
    });
    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                <TableRow key="loading-indicator">
                    <TableCell colSpan={columns.length} className="text-sm text-muted-foreground">Filtering additional jobs…</TableCell>
                </TableRow>
                {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function FilteredJobsList({ fetchJobs, filterAgent }: { fetchJobs: Promise<Job[]>; filterAgent: FilterAgentPromise; }) {
    const jobs = use<Job[]>(fetchJobs);
    return (
        <div className="overflow-hidden rounded-md border col-span-2 col-start-2">
            <Suspense fallback={<LoadingTable jobs={jobs} />}>
                <FinalMergedTable jobs={jobs} filterAgent={filterAgent} />
            </Suspense>
        </div>
    );
}