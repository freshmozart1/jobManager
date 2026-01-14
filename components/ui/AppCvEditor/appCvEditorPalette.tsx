'use client';

import { useDraggable } from '@dnd-kit/core';
import type { CvEducationItem, CvExperienceItem, CvSkillItem, CvCertificationItem } from '@/lib/cvModel';

type AppCvEditorPaletteProps = {
    education: CvEducationItem[];
    experience: CvExperienceItem[];
    skills: CvSkillItem[];
    certifications: CvCertificationItem[];
    placedEducationIds: string[];
    placedExperienceIds: string[];
    placedSkillIds: string[];
    placedCertificationIds: string[];
};

export default function AppCvEditorPalette({
    education,
    experience,
    skills,
    certifications,
    placedEducationIds,
    placedExperienceIds,
    placedSkillIds,
    placedCertificationIds,
}: AppCvEditorPaletteProps) {
    return (
        <div className="space-y-6 w-80 border-r bg-muted/20 overflow-y-auto p-4">
            {/* Education Items */}
            <PaletteGroup title="Education">
                {
                    education.map(
                        item => <PaletteItem
                            key={item.id}
                            itemId={item.id}
                            itemTitle={`${item.degree} in ${item.field}`}
                            itemText={`${item.institution}, ${item.graduation_year}`}
                            disabled={placedEducationIds.includes(item.id)}
                        />
                    )
                }
            </PaletteGroup>

            {/* Experience Items */}
            <PaletteGroup title="Work Experience">
                {
                    experience.map(
                        item => <PaletteItem
                            key={item.id}
                            itemId={item.id}
                            itemTitle={item.role}
                            itemText={item.company}
                            disabled={placedExperienceIds.includes(item.id)}
                        />
                    )
                }
            </PaletteGroup>

            {/* Skills Items */}
            <PaletteGroup title="Skills">
                {
                    skills.map(
                        item => <PaletteItem
                            key={item.id}
                            itemId={item.id}
                            itemTitle={item.name}
                            itemText={`${item.level} - ${item.years} years`}
                            disabled={placedSkillIds.includes(item.id)}
                        />
                    )
                }
            </PaletteGroup>

            {/* Certifications Items */}
            <PaletteGroup title="Certifications">
                {
                    certifications.map(
                        item => <PaletteItem
                            key={item.id}
                            itemId={item.id}
                            itemTitle={item.name}
                            itemText={`Issued: ${item.issued}${item.expires ? ` | Expires: ${item.expires}` : ''}`}
                            disabled={placedCertificationIds.includes(item.id)}
                        />
                    )
                }
            </PaletteGroup>
        </div>
    );
}

type AppPaletteItemProps = {
    itemId: string;
    itemTitle: string;
    itemText: string;
    disabled: boolean;
};

function PaletteItem({ itemId, itemTitle, itemText, disabled }: AppPaletteItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging
    } = useDraggable({
        id: `palette:${itemId}`,
        disabled,
    });
    return <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`p-2 bg-white border rounded text-sm cursor-move ${disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragging ? 'opacity-50' : ''}`}
    >
        <p className='font-semibold text-xs'>{itemTitle}</p>
        <p className='text-xs text-muted-foreground'>{itemText}</p>
    </div>;
}

type AppPaletteGroupProps = {
    title: string;
    children: React.ReactNode;
};

function PaletteGroup({ title, children }: AppPaletteGroupProps) {
    return (
        <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{title}</h3>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}