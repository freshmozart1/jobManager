'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { CvEducationItem, CvExperienceItem, CvSkillItem } from '@/lib/cvModel';

type SlotType = 'education' | 'experience' | 'skills';

type AppCvEditorSlotProps = {
    slotType: SlotType;
    title: string;
    items: (CvEducationItem | CvExperienceItem | CvSkillItem)[];
    onRemove: (itemId: string) => void;
};

export default function AppCvEditorSlot({
    slotType,
    title,
    items,
    onRemove,
}: AppCvEditorSlotProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot:${slotType}`,
    });

    const sortableIds = items.map((item) => `slot:${slotType}:${item.id}`);

    return (
        <div
            ref={setNodeRef}
            className={`mb-6 min-h-[100px] p-4 border-2 border-dashed rounded-lg ${isOver ? 'border-primary bg-primary/5' : 'border-gray-300'
                }`}
        >
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{title}</h3>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {items.map((item) => (
                        <SortableSlotItem
                            key={item.id}
                            id={`slot:${slotType}:${item.id}`}
                            item={item}
                            slotType={slotType}
                            onRemove={() => onRemove(item.id)}
                        />
                    ))}
                    {items.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                            Drag items here from the palette
                        </p>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableSlotItem({
    id,
    item,
    slotType,
    onRemove,
}: {
    id: string;
    item: CvEducationItem | CvExperienceItem | CvSkillItem;
    slotType: SlotType;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-2 bg-white border rounded text-sm flex items-start justify-between cursor-move group"
        >
            <div className="flex-1 min-w-0">
                {slotType === 'education' && 'degree' in item && (
                    <>
                        <p className="font-semibold text-xs">
                            {item.degree} in {item.field}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {item.institution}, {item.graduation_year}
                        </p>
                    </>
                )}
                {slotType === 'experience' && 'role' in item && (
                    <>
                        <p className="font-semibold text-xs">{item.role}</p>
                        <p className="text-xs text-muted-foreground">{item.company}</p>
                        {'from' in item &&
                            typeof item.from === 'string' &&
                            item.from.trim() !== '' && (
                                <p className="text-xs text-muted-foreground">
                                    {item.from} –{' '}
                                    {'to' in item &&
                                    typeof item.to === 'string' &&
                                    item.to.trim() !== ''
                                        ? item.to
                                        : 'Present'}
                                </p>
                            )}
                        {'summary' in item && item.summary.trim() !== '' && (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">
                                {item.summary}
                            </p>
                        )}
                    </>
                )}
                {slotType === 'skills' && 'name' in item && (
                    <>
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {item.level} - {item.years} years
                        </p>
                    </>
                )}
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-muted-foreground hover:text-destructive shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
