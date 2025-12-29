'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppCategoryCombobox } from '@/components/ui/appCategoryCombobox';
import { Plus, X } from 'lucide-react';

const REGIONS = [
    'US',
    'EU',
    'UK',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Netherlands',
    'Switzerland',
    'Singapore',
    'Japan',
    'India',
    'Remote (Worldwide)',
];

const AUTHORIZATION_STATUSES = [
    'Citizen',
    'Permanent Resident',
    'Work Visa',
    'H-1B',
    'L-1',
    'OPT',
    'TN Visa',
    'Green Card',
    'EU Blue Card',
    'Skilled Worker Visa',
    'Student Visa',
    'No Authorization Required',
];

type WorkAuthorization = {
    region: string;
    status: string;
};

type AppWorkAuthorizationListProps = {
    items: WorkAuthorization[];
    onChange: (items: WorkAuthorization[]) => void;
};

export function AppWorkAuthorizationList({ items, onChange }: AppWorkAuthorizationListProps) {
    const [newRegion, setNewRegion] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const canAdd = newRegion.trim() !== '' && newStatus.trim() !== '';

    const handleAdd = () => {
        if (!canAdd) return;
        const newItem: WorkAuthorization = {
            region: newRegion.trim(),
            status: newStatus.trim(),
        };
        onChange([...items, newItem]);
        setNewRegion('');
        setNewStatus('');
    };

    const handleRemove = (index: number) => {
        const next = items.filter((_, i) => i !== index);
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <Label>Work Authorization</Label>

            {/* Existing items */}
            {items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.region}-${item.status}-${index}`}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                        >
                            <span className="flex-1 text-sm">
                                <span className="font-medium">{item.region}</span>
                                <span className="text-muted-foreground"> — </span>
                                <span>{item.status}</span>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemove(index)}
                                aria-label={`Remove ${item.region} authorization`}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add new item */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                    <Label htmlFor="new-region" className="text-xs text-muted-foreground">
                        Region
                    </Label>
                    <AppCategoryCombobox
                        id="new-region"
                        value={newRegion}
                        options={REGIONS}
                        onChange={setNewRegion}
                        placeholder="Select region"
                    />
                </div>
                <div>
                    <Label htmlFor="new-status" className="text-xs text-muted-foreground">
                        Status
                    </Label>
                    <AppCategoryCombobox
                        id="new-status"
                        value={newStatus}
                        options={AUTHORIZATION_STATUSES}
                        onChange={setNewStatus}
                        placeholder="Select status"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAdd}
                    disabled={!canAdd}
                    aria-label="Add work authorization"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
