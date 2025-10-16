import { use } from "react";

export default function FilteredJobsList({ filterInstructions }: { filterInstructions: Promise<string[]>; }) {
    const _instructions = use<string[]>(filterInstructions);
    return (<div>{_instructions.map((instruction, index) => <p key={index}>{instruction}</p>)}</div>);
}