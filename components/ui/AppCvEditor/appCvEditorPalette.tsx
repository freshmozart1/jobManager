'use client';

import { useDraggable } from '@dnd-kit/core';
import type { CvEducationItem, CvExperienceItem, CvSkillItem } from '@/lib/cvModel';

type AppCvEditorPaletteProps = {
    education: CvEducationItem[];
    experience: CvExperienceItem[];
    skills: CvSkillItem[];
    placedEducationIds: string[];
    placedExperienceIds: string[];
    placedSkillIds: string[];
};

export default function AppCvEditorPalette({
    education,
    experience,
    skills,
    placedEducationIds,
    placedExperienceIds,
    placedSkillIds,
}: AppCvEditorPaletteProps) {
    return (
        <div className="space-y-6">
            {/* Education Items */}
            <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Education</h3>
                <div className="space-y-2">
                    {education.map((item) => {
                        const isPlaced = placedEducationIds.includes(item.id);
                        return (
                            <PaletteEducationItem key={item.id} item={item} disabled={isPlaced} />
                        );
                    })}
                </div>
            </div>

            {/* Experience Items */}
            <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Work Experience</h3>
                <div className="space-y-2">
                    {experience.map((item) => {
                        const isPlaced = placedExperienceIds.includes(item.id);
                        return (
                            <PaletteExperienceItem key={item.id} item={item} disabled={isPlaced} />
                        );
                    })}
                </div>
            </div>

            {/* Skills Items */}
            <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Skills</h3>
                <div className="space-y-2">
                    {skills.map((item) => {
                        const isPlaced = placedSkillIds.includes(item.id);
                        return <PaletteSkillItem key={item.id} item={item} disabled={isPlaced} />;
                    })}
                </div>
            </div>
        </div>
    );
}

function PaletteEducationItem({ item, disabled }: { item: CvEducationItem; disabled: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${item.id}`,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`p-2 bg-white border rounded text-sm cursor-move ${
                disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragging ? 'opacity-50' : ''}`}
        >
            <p className="font-semibold text-xs">
                {item.degree} in {item.field}
            </p>
            <p className="text-xs text-muted-foreground">
                {item.institution}, {item.graduation_year}
            </p>
        </div>
    );
}

function PaletteExperienceItem({
    item,
    disabled,
}: {
    item: CvExperienceItem;
    disabled: boolean;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${item.id}`,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`p-2 bg-white border rounded text-sm cursor-move ${
                disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragging ? 'opacity-50' : ''}`}
        >
            <p className="font-semibold text-xs">{item.role}</p>
            <p className="text-xs text-muted-foreground">{item.company}</p>
        </div>
    );
}

function PaletteSkillItem({ item, disabled }: { item: CvSkillItem; disabled: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${item.id}`,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`p-2 bg-white border rounded text-sm cursor-move ${
                disabled ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragging ? 'opacity-50' : ''}`}
        >
            <p className="font-semibold text-xs">{item.name}</p>
            <p className="text-xs text-muted-foreground">
                {item.level} - {item.years} years
            </p>
        </div>
    );
}
