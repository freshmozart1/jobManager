'use client';
import { use } from "react";
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
        header: 'Posted at'
    },
    {
        accessorKey: 'applyUrl',
        header: 'Apply here',
        cell: ({ row }) => (<a href={row.getValue('applyUrl')}>Apply</a>)
    }
];

export default function FilteredJobsList({ filterAgent }: { filterAgent: FilterAgentPromise; }) {
    const filterAgentResults = use<FilterAgentResult>(filterAgent);
    const table = useReactTable({
        data: filterAgentResults.jobs,
        columns,
        getCoreRowModel: getCoreRowModel()
    });
    // return (<div>{filterAgentResults.jobs.map((job, index) => <p key={index}>{job.title}</p>)}</div>);
    return (<div className="overflow-hidden rounded-md border">
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>);
}