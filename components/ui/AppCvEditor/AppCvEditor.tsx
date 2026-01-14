'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type {
    CvModel,
    CvModelNormalized,
    CvEducationItem,
    CvExperienceItem,
    CvSkillItem,
    CvCertificationItem,
} from '@/lib/cvModel';
import AppCvEditorPalette from './appCvEditorPalette';
import AppCvEditorPreview from './appCvEditorPreview';
import AppCvEditorToolbar from './appCvEditorToolbar';

export type AppCvEditorProps = {
    initialModel: CvModelNormalized;
    availableEducation: CvEducationItem[];
    availableExperience: CvExperienceItem[];
    availableSkills: CvSkillItem[];
    availableCertifications: CvCertificationItem[];
    onChange: (model: CvModel) => void;
};

type SlotType = 'education' | 'experience' | 'skills' | 'certifications';

/**
 * Main CV Editor component with drag/drop, fixed slots, and A4 preview
 */
export default function AppCvEditor({
    initialModel,
    availableEducation,
    availableExperience,
    availableSkills,
    availableCertifications,
    onChange,
}: AppCvEditorProps) {
    const [model, setModel] = useState<CvModelNormalized>(initialModel);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Track changes and call onChange with model
    useEffect(() => {
        onChange(model);
    }, [model, onChange]);

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;

        // Determine source and target
        const [sourceType, sourceId] = activeIdStr.split(':');
        const [targetType, targetId] = overIdStr.split(':');

        // Palette → Slot: add item to slot
        if (sourceType === 'palette') {
            const slotType = targetType === 'slot' ? targetId : null;
            if (!slotType) return;

            const addItemToSlot = (itemId: string, slot: SlotType) => {
                const available = slot === 'education' ? availableEducation
                    : slot === 'experience' ? availableExperience
                        : slot === 'skills' ? availableSkills
                            : availableCertifications;
                const item = available.find((i) => i.id === itemId);
                if (item && !model.slots[slot].some((i) => i.id === item.id)) {
                    setModel((prev) => ({
                        ...prev,
                        slots: {
                            ...prev.slots,
                            [slot]: [...prev.slots[slot], item],
                        },
                    }));
                }
            };

            const [itemType] = sourceId.split('-');

            if (itemType === 'edu' && slotType === 'education') addItemToSlot(sourceId, 'education');
            else if (itemType === 'exp' && slotType === 'experience') addItemToSlot(sourceId, 'experience');
            else if (itemType === 'skill' && slotType === 'skills') addItemToSlot(sourceId, 'skills');
            else if (itemType === 'cert' && slotType === 'certifications') addItemToSlot(sourceId, 'certifications');
        }

        // Slot → Slot: reorder within same slot
        if (sourceType === 'slot' && targetType === 'slot' && sourceId === targetId) {
            const slotType = sourceId as SlotType;
            const items = model.slots[slotType];
            const oldIndex = items.findIndex((item) => `slot:${slotType}:${item.id}` === activeIdStr);
            const newIndex = items.findIndex((item) => `slot:${slotType}:${item.id}` === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) setModel((prev) => ({
                ...prev,
                slots: {
                    ...prev.slots,
                    [slotType]: arrayMove(items as unknown[], oldIndex, newIndex),
                },
            }));
        }
    };

    // Remove item from slot
    const handleRemove = useCallback((slotType: SlotType, itemId: string) => {
        setModel((prev) => ({
            ...prev,
            slots: {
                ...prev.slots,
                [slotType]: prev.slots[slotType].filter((item) => item.id !== itemId),
            },
        }));
    }, []);

    // Update header field
    const handleHeaderChange = useCallback((field: keyof CvModelNormalized['header'], value: string) => {
        setModel((prev) => ({
            ...prev,
            header: {
                ...prev.header,
                [field]: value,
            },
        }));
    }, []);

    // Update header address field
    const handleHeaderAddressChange = useCallback((field: keyof CvModelNormalized['header']['address'], value: string) => {
        setModel((prev) => ({
            ...prev,
            header: {
                ...prev.header,
                address: {
                    ...prev.header.address,
                    [field]: value,
                },
            },
        }));
    }, []);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-screen print:hidden">
                <AppCvEditorPalette
                    education={availableEducation}
                    experience={availableExperience}
                    skills={availableSkills}
                    certifications={availableCertifications}
                    placedEducationIds={model.slots.education.map((e) => e.id)}
                    placedExperienceIds={model.slots.experience.map((e) => e.id)}
                    placedSkillIds={model.slots.skills.map((s) => s.id)}
                    placedCertificationIds={model.slots.certifications.map((c) => c.id)}
                />
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <AppCvEditorToolbar
                            model={model}
                            onChange={setModel}
                        />
                        <AppCvEditorPreview
                            model={model}
                            onHeaderChange={handleHeaderChange}
                            onHeaderAddressChange={handleHeaderAddressChange}
                            onRemove={handleRemove}
                        />
                    </div>
                </div>
            </div>
            <DragOverlay>
                {activeId ? <div className="bg-white p-2 shadow-lg rounded">{activeId}</div> : null}
            </DragOverlay>
        </DndContext>
    );
}
