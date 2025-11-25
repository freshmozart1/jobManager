import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type AppSkillsFooterProps = {
    debouncedSearch: string;
    allCategoriesSelected: boolean;
    categoryOptions: string[];
    filteredRowsCount: number;
    skillRowsCount: number;
    totalPages: number;
    pageIndex: number;
    setPageIndex: (page: number | ((prev: number) => number)) => void;
    isFirstPage: boolean;
    isLastPage: boolean;
};

export default function AppSkillsFooter({
    debouncedSearch,
    allCategoriesSelected,
    categoryOptions,
    filteredRowsCount,
    skillRowsCount,
    totalPages,
    pageIndex,
    setPageIndex,
    isFirstPage,
    isLastPage,
}: AppSkillsFooterProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {debouncedSearch || (!allCategoriesSelected && categoryOptions.length > 0)
                        ? `${filteredRowsCount}/${skillRowsCount}\u00A0skills`
                        : `${filteredRowsCount}\u00A0skills`}
                </span>
                {totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setPageIndex((prev) => Math.max(0, prev - 1));
                                    }}
                                    aria-disabled={isFirstPage}
                                    className={isFirstPage ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === pageIndex}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setPageIndex(page);
                                        }}
                                    >
                                        {page + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            {!isLastPage && (
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
                                        }}
                                    />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                )}
                <div className="flex items-center gap-2" />
            </div>
        </div>
    );
}