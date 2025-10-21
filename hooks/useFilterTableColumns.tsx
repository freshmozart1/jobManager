import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

function SVGJobIndicator({ newJob }: { newJob: boolean }) {
    const BaseSVG = ({ className }: { className: string }) => <svg
        className={`size-4 grow-0 stroke-1 ${className}`}
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
    return newJob ? <BaseSVG className="fill-green-100 stroke-green-200" /> : <BaseSVG className="fill-transparent" />;
}

export function useFilterTableColumns() {
    return useMemo<ColumnDef<JobWithNewFlag>[]>(() => [
        {
            accessorKey: 'new',
            header: '',
            enableSorting: false,
            cell: ({ cell: { getValue } }) => <SVGJobIndicator newJob={getValue<boolean>()} />,
            id: 'new',
        },
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
        }
    ], []);
}