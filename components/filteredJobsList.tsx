import { use } from "react";

export default function FilteredJobsList({ filterAgent }: { filterAgent: FilterAgentPromise; }) {
    const filterAgentResults = use<FilterAgentResult>(filterAgent);
    return (<div>{filterAgentResults.jobs.map((job, index) => <p key={index}>{job.title}</p>)}</div>);
}