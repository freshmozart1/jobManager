'use client';

import { useDndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { CvEducationItem, CvExperienceItem, CvSkillItem, CvCertificationItem } from '@/lib/cvModel';
import { useMemo } from 'react';

type SlotType = 'education' | 'experience' | 'skills' | 'certifications';

type AppCvEditorSlotProps = {
    slotType: SlotType;
    title: string;
    items: (CvEducationItem | CvExperienceItem | CvSkillItem | CvCertificationItem)[];
    style?: React.CSSProperties;
    onRemove: (itemId: string) => void;
};

export default function AppCvEditorSlot({
    slotType,
    title,
    items,
    style,
    onRemove,
}: AppCvEditorSlotProps) {
    const slotId = useMemo(() => `slot:${slotType}`, [slotType]);
    const { over } = useDndContext();
    const { setNodeRef, isOver } = useDroppable({
        id: slotId,
    });

    const isOverSlot = useMemo(() => {
        if (!over) return false;
        const overId = over.id ? String(over.id) : null;
        return isOver || overId === slotId || (overId?.startsWith(`${slotId}:`) ?? false);
    }, [isOver, over, slotId]);

    return (
        <div
            className={`min-h-[100px] relative`}
            style={{
                ...style,
                display: 'grid',
                gridTemplateAreas: '"stack"'
            }}
        >
            <div
                className={`${isOverSlot
                    ? 'bg-primary/5'
                    : ''}`}
                style={{
                    gridArea: 'stack',
                    position: 'relative',
                    pointerEvents: 'none',
                    top: '-5mm',
                    left: '-5mm',
                    width: 'calc(100% + 10mm)',
                    height: 'calc(100% + 10mm)',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s ease-in-out',
                }}></div>
            <div
                ref={setNodeRef}
                style={{
                    gridArea: 'stack',
                }}>
                <span>{title}</span>
                <hr style={{
                    margin: '0.25em 0'
                }} />
                <SortableContext id={slotId} items={items.map((item) => `slot:${slotType}:${item.id}`)} strategy={verticalListSortingStrategy}>
                    <div
                        className="space-y-2">
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
                                Drag {slotType} items here from the palette
                            </p>
                        )}
                    </div>
                </SortableContext>
            </div>
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
    item: CvEducationItem | CvExperienceItem | CvSkillItem | CvCertificationItem;
    slotType: SlotType;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
            }}
            {...attributes}
            {...listeners}
            className="p-2 rounded bg-white text-sm flex items-center justify-between cursor-move group"
        >
            <div className="flex-1">
                {slotType === 'education' && 'degree' in item && !isDragging && (
                    <>
                        <p className="font-semibold text-xs">
                            {item.degree} in {item.field}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {item.institution}, {item.graduation_year}
                        </p>
                    </>
                )}
                {slotType === 'experience' && 'role' in item && !isDragging && (
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
                {slotType === 'skills' && 'name' in item && !isDragging && (
                    <span className="font-semibold text-xs">{item.name}</span>
                )}
                {slotType === 'certifications' && 'issued' in item && !isDragging && (
                    <>
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Issued: {item.issued}
                            {'expires' in item && item.expires && ` | Expires: ${item.expires}`}
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
