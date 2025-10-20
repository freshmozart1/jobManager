import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

export function useFilterTableColumns() {
    return useMemo<ColumnDef<JobWithNewFlag>[]>(() => [
        {
            accessorKey: 'title',
            header: 'Job',
            enableSorting: false,
        },
        {
            accessorKey: 'companyName',
            header: 'Company',
            enableSorting: false,
        },
        {
            accessorKey: 'postedAt',
            header: 'Posted at',
            cell: ({ cell: { getValue } }) => getValue<Date>().toLocaleDateString(),
            sortingFn: 'datetime',
            sortUndefined: "last",
        },
        {
            accessorKey: 'applyUrl',
            header: 'Apply here',
            cell: ({ row }) => (<a href={row.getValue<string>('applyUrl')} > Apply </a>),
            enableSorting: false,
        }
    ], []);
}