import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

type AppPromptsGridProps = {
    prompts: PromptDocument[];
    onClick: (promptId: string) => void;
    className?: string;
};
export default function AppPromptsGrid({ prompts, className, onClick }: AppPromptsGridProps) {
    return <div className={`${className} grid grid-cols-3 auto-rows-auto gap-4`}>
        {prompts.length
            ? prompts.map((prompt, i) => <Card key={i}>
                <CardHeader>
                    <CardTitle>{prompt.name}</CardTitle>
                    <CardDescription>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Created at:</td>
                                    <td>{prompt.createdAt.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Updated at:</td>
                                    <td>{prompt.updatedAt.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <button onClick={() => onClick(prompt._id)}>Select</button>
                </CardFooter>
            </Card>)
            : null}
    </div>
}