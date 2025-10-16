import FilteredJobsList from "@/components/filteredJobsList";
import { getFilterInstructions } from "@/lib/prompts";
import { Suspense } from "react";

export default function SearchPage() {
    return (
        <>
            <Suspense fallback={<div>Initializing agent...</div>}>
                <FilteredJobsList filterInstructions={getFilterInstructions()} />
            </Suspense>
        </>
    );
}