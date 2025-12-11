"use client";

import { useEffect, useMemo, useState } from "react";

import { SkillRow } from "..";

const PAGE_SIZE = 10;

export function useSkillsPagination(filteredRows: SkillRow[]) {
    const [pageIndex, setPageIndex] = useState(0);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex >= totalPages - 1;

    useEffect(() => {
        if (pageIndex > totalPages - 1) {
            setPageIndex(Math.max(0, totalPages - 1));
        }
    }, [pageIndex, totalPages]);

    const pagedRows = useMemo(() => {
        const start = pageIndex * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, pageIndex]);

    return {
        pageIndex,
        setPageIndex,
        pagedRows,
        totalPages,
        isFirstPage,
        isLastPage,
    } as const;
}
