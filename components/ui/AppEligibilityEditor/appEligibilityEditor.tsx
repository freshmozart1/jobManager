'use client';

import { useState } from 'react';
import { type PersonalInformationEligibility } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import BadgeInput from '@/components/ui/badgeInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppWorkAuthorizationList } from './appWorkAuthorizationList';
import { LoaderCircle, Save, MapPin, Clock } from 'lucide-react';

const TIME_ZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'America/New_York (Eastern)' },
    { value: 'America/Chicago', label: 'America/Chicago (Central)' },
    { value: 'America/Denver', label: 'America/Denver (Mountain)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific)' },
    { value: 'America/Toronto', label: 'America/Toronto (Eastern Canada)' },
    { value: 'America/Vancouver', label: 'America/Vancouver (Pacific Canada)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
    { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (CET)' },
    { value: 'Europe/Zurich', label: 'Europe/Zurich (CET)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
    { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST)' },
];

type AppEligibilityEditorProps = {
    eligibility: PersonalInformationEligibility;
    onChange: (eligibility: PersonalInformationEligibility) => void;
    onPersist: (eligibility: PersonalInformationEligibility) => Promise<void>;
    saving?: boolean;
};

export default function AppEligibilityEditor({
    eligibility,
    onChange,
    onPersist,
    saving = false,
}: AppEligibilityEditorProps) {
    const [isSaving, setIsSaving] = useState(false);

    const isLoading = saving || isSaving;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onPersist(eligibility);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Work Authorization */}
            <AppWorkAuthorizationList
                items={eligibility.work_authorization}
                onChange={(items) =>
                    onChange({ ...eligibility, work_authorization: items })
                }
            />

            {/* Security Clearance */}
            <div>
                <Label htmlFor="security-clearance">Security Clearance</Label>
                <Input
                    id="security-clearance"
                    value={eligibility.security_clearance ?? ''}
                    onChange={(e) =>
                        onChange({
                            ...eligibility,
                            security_clearance: e.target.value || null,
                        })
                    }
                    placeholder="e.g., Secret, Top Secret, None"
                />
            </div>

            {/* Relocation */}
            <div className="space-y-3">
                <Label>Relocation</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="relocation-willing"
                        checked={eligibility.relocation.willing}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...eligibility,
                                relocation: {
                                    ...eligibility.relocation,
                                    willing: checked === true,
                                },
                            })
                        }
                    />
                    <Label htmlFor="relocation-willing" className="font-normal cursor-pointer">
                        Willing to relocate
                    </Label>
                </div>
                {eligibility.relocation.willing && (
                    <BadgeInput
                        id="relocation-regions"
                        label="Preferred Relocation Regions"
                        value={eligibility.relocation.regions}
                        onChange={(regions) =>
                            onChange({
                                ...eligibility,
                                relocation: { ...eligibility.relocation, regions },
                            })
                        }
                        placeholder="Type region and press ','"
                        icon={MapPin}
                    />
                )}
            </div>

            {/* Remote Work */}
            <div className="space-y-3">
                <Label>Remote Work</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remote-willing"
                        checked={eligibility.remote.willing}
                        onCheckedChange={(checked) =>
                            onChange({
                                ...eligibility,
                                remote: {
                                    ...eligibility.remote,
                                    willing: checked === true,
                                },
                            })
                        }
                    />
                    <Label htmlFor="remote-willing" className="font-normal cursor-pointer">
                        Willing to work remotely
                    </Label>
                </div>
                {eligibility.remote.willing && (
                    <div>
                        <Label htmlFor="time-zone" className="text-xs text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Preferred Time Zone
                        </Label>
                        <Select
                            value={eligibility.remote.time_zone}
                            onValueChange={(value) =>
                                onChange({
                                    ...eligibility,
                                    remote: { ...eligibility.remote, time_zone: value },
                                })
                            }
                        >
                            <SelectTrigger id="time-zone">
                                <SelectValue placeholder="Select time zone" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIME_ZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Availability */}
            <div>
                <Label htmlFor="notice-period">Notice Period (days)</Label>
                <Input
                    id="notice-period"
                    type="number"
                    min={0}
                    value={eligibility.availability.notice_period_days}
                    onChange={(e) =>
                        onChange({
                            ...eligibility,
                            availability: {
                                ...eligibility.availability,
                                notice_period_days: Number(e.target.value) || 0,
                            },
                        })
                    }
                />
            </div>

            {/* Work Schedule Constraints */}
            <div className="space-y-3">
                <Label>Work Schedule Constraints</Label>
                <p className="text-xs text-muted-foreground">
                    Check the boxes if you are willing to work during these times
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="schedule-weekends"
                            checked={eligibility.work_schedule_constraints.weekends}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...eligibility,
                                    work_schedule_constraints: {
                                        ...eligibility.work_schedule_constraints,
                                        weekends: checked === true,
                                    },
                                })
                            }
                        />
                        <Label htmlFor="schedule-weekends" className="font-normal cursor-pointer">
                            Weekends
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="schedule-nights"
                            checked={eligibility.work_schedule_constraints.nights}
                            onCheckedChange={(checked) =>
                                onChange({
                                    ...eligibility,
                                    work_schedule_constraints: {
                                        ...eligibility.work_schedule_constraints,
                                        nights: checked === true,
                                    },
                                })
                            }
                        />
                        <Label htmlFor="schedule-nights" className="font-normal cursor-pointer">
                            Nights
                        </Label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <LoaderCircle className="animate-spin" /> : <Save />}
                Save Eligibility
            </Button>
        </div>
    );
}
