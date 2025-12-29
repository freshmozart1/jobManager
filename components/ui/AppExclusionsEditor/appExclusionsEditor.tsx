'use client';

import { Briefcase, Building, Building2, Code, LoaderCircle, Save } from 'lucide-react';
import BadgeInput from '@/components/ui/badgeInput';
import { Button } from '@/components/ui/button';
import type { PersonalInformationExclusions } from '@/types';

type AppExclusionsEditorProps = {
    exclusions: PersonalInformationExclusions;
    onChange: (exclusions: PersonalInformationExclusions) => void;
    onSave: () => void;
    saving?: boolean;
};

export default function AppExclusionsEditor({
    exclusions,
    onChange,
    onSave,
    saving
}: AppExclusionsEditorProps) {
    return (
        <>
            <div className="space-y-4">
                <div>
                    <BadgeInput
                        id="avoid-roles"
                        label="Avoid Roles"
                        value={exclusions.avoid_roles}
                        onChange={(avoid_roles: string[]) => onChange({ ...exclusions, avoid_roles })}
                        placeholder="Type role and press ','"
                        icon={Briefcase}
                    />
                </div>
                <div>
                    <BadgeInput
                        id="avoid-technologies"
                        label="Avoid Technologies"
                        value={exclusions.avoid_technologies}
                        onChange={(avoid_technologies: string[]) => onChange({ ...exclusions, avoid_technologies })}
                        placeholder="Type technology and press ','"
                        icon={Code}
                    />
                </div>
                <div>
                    <BadgeInput
                        id="avoid-industries"
                        label="Avoid Industries"
                        value={exclusions.avoid_industries}
                        onChange={(avoid_industries: string[]) => onChange({ ...exclusions, avoid_industries })}
                        placeholder="Type industry and press ','"
                        icon={Building2}
                    />
                </div>
                <div>
                    <BadgeInput
                        id="avoid-companies"
                        label="Avoid Companies"
                        value={exclusions.avoid_companies}
                        onChange={(avoid_companies: string[]) => onChange({ ...exclusions, avoid_companies })}
                        placeholder="Type company and press ','"
                        icon={Building}
                    />
                </div>
            </div>
            <Button
                onClick={onSave}
                disabled={saving}
            >
                {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
                Save Exclusions
            </Button>
        </>
    );
}
