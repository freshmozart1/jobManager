'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useToUrl from '@/hooks/useToUrl';
import { LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PromptDetailPage() {
    const params = useParams();
    const router = useRouter();
    const promptId = params.id as string;
    const toUrl = useToUrl();
    const [prompt, setPrompt] = useState<PromptDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [promptText, setPromptText] = useState('');
    const [agentType, setAgentType] = useState<AgentType>('filter');

    useEffect(() => {
        const controller = new AbortController();
        fetch(toUrl(`/api/prompts/${promptId}`), { signal: controller.signal })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch prompt details');
                }
                return res.json();
            })
            .then((data: PromptDocument) => {
                setPrompt(data);
                setName(data.name);
                setPromptText(data.prompt);
                setAgentType(data.agentType);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError('Failed to load prompt details');
                    setLoading(false);
                }
            });
        return () => controller.abort();
    }, [promptId, toUrl]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const response = await fetch(toUrl(`/api/prompts/${promptId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    prompt: promptText,
                    agentType,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update prompt');
            }

            const updatedPrompt = await response.json();
            setPrompt(updatedPrompt);
            setSuccessMessage('Prompt updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to save prompt');
            console.error('Error saving prompt:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading prompt details...</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error && !prompt) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Button onClick={() => router.back()} className="mb-4" variant="outline">
                ← Back
            </Button>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Edit Prompt</CardTitle>
                    <CardDescription>
                        {prompt?.createdAt && `Created: ${new Date(prompt.createdAt).toLocaleDateString()}`}
                        {prompt?.updatedAt && ` | Last updated: ${new Date(prompt.updatedAt).toLocaleDateString()}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Prompt Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter prompt name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agentType">Agent Type</Label>
                        <Select value={agentType} onValueChange={(value) => setAgentType(value as AgentType)}>
                            <SelectTrigger id="agentType">
                                <SelectValue placeholder="Select agent type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="filter">Filter</SelectItem>
                                <SelectItem value="writer">Writer</SelectItem>
                                <SelectItem value="evaluator">Evaluator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">Prompt Text</Label>
                        <Textarea
                            id="prompt"
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Enter prompt text"
                            rows={15}
                            className="font-mono text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-destructive text-sm">{error}</p>
                    )}

                    {successMessage && (
                        <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
                    )}

                    <div className="flex gap-4">
                        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                            {saving ? (
                                <>
                                    <LoaderCircle className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button onClick={() => router.back()} variant="outline" className="w-full md:w-auto">
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
