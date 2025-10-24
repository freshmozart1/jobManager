import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, LoaderCircle, SquarePen } from "lucide-react";
import Link from "next/link";

type AppPromptsGridProps = {
    prompts: PromptDocument[];
    onClick: (prompt: PromptDocument) => void;
    filterAgentRunning: boolean;
    className?: string;
};
export default function AppPromptsGrid({ prompts, className, onClick, filterAgentRunning }: AppPromptsGridProps) {
    return <div className={`${className ?? ''} grid grid-cols-3 auto-rows-auto gap-4`}>
        {prompts.length
            ? prompts.map((prompt, i) => <Card key={i} className={(i + 1) % 3 === 1 ? 'rounded-l-none' : (i + 1) % 3 === 0 ? 'rounded-r-none' : ''}>
                <CardHeader>
                    <CardTitle>{prompt.name}</CardTitle>
                </CardHeader>
                <CardFooter className="inline-flex justify-between">
                    <Button className="cursor-pointer" onClick={() => onClick(prompt)} disabled={filterAgentRunning}>
                        {filterAgentRunning ? <LoaderCircle className="animate-spin" /> : <Play />}
                    </Button>
                    <Button className="cursor-pointer" variant="ghost" asChild>
                        <Link href={`/prompts/${prompt._id}`}>
                            <SquarePen />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>)
            : null}
    </div>
}