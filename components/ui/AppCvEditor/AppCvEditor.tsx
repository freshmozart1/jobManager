'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { FileDown, FileText, Printer } from 'lucide-react';
import type {
    CvModel,
    CvEducationItem,
    CvExperienceItem,
    CvSkillItem,
    CvTemplate,
} from '@/lib/cvModel';
import { serializeCvModelToHtml } from '@/lib/cvModel';
import AppCvEditorPalette from './appCvEditorPalette';
import AppCvEditorPreview from './appCvEditorPreview';

export type AppCvEditorProps = {
    initialModel: CvModel;
    availableEducation: CvEducationItem[];
    availableExperience: CvExperienceItem[];
    availableSkills: CvSkillItem[];
    onChange: (html: string) => void;
};

/**
 * Main CV Editor component with drag/drop, fixed slots, and A4 preview
 */
export default function AppCvEditor({
    initialModel,
    availableEducation,
    availableExperience,
    availableSkills,
    onChange,
}: AppCvEditorProps) {
    const [model, setModel] = useState<CvModel>(initialModel);
    const [activeId, setActiveId] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Track changes and call onChange with serialized HTML
    useEffect(() => {
        const html = serializeCvModelToHtml(model);
        onChange(html);
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

            const [itemType] = sourceId.split('-');

            if (itemType === 'edu' && slotType === 'education') {
                const item = availableEducation.find((e) => e.id === sourceId);
                if (item && !model.slots.education.some((e) => e.id === item.id)) {
                    setModel((prev) => ({
                        ...prev,
                        slots: {
                            ...prev.slots,
                            education: [...prev.slots.education, item],
                        },
                    }));
                }
            } else if (itemType === 'exp' && slotType === 'experience') {
                const item = availableExperience.find((e) => e.id === sourceId);
                if (item && !model.slots.experience.some((e) => e.id === item.id)) {
                    setModel((prev) => ({
                        ...prev,
                        slots: {
                            ...prev.slots,
                            experience: [...prev.slots.experience, item],
                        },
                    }));
                }
            } else if (itemType === 'skill' && slotType === 'skills') {
                const item = availableSkills.find((s) => s.id === sourceId);
                if (item && !model.slots.skills.some((s) => s.id === item.id)) {
                    setModel((prev) => ({
                        ...prev,
                        slots: {
                            ...prev.slots,
                            skills: [...prev.slots.skills, item],
                        },
                    }));
                }
            }
        }

        // Slot → Slot: reorder within same slot
        if (sourceType === 'slot' && targetType === 'slot' && sourceId === targetId) {
            const slotType = sourceId as 'education' | 'experience' | 'skills';
            const items = model.slots[slotType];
            const oldIndex = items.findIndex((item) => `slot:${slotType}:${item.id}` === activeIdStr);
            const newIndex = items.findIndex((item) => `slot:${slotType}:${item.id}` === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(items as unknown[], oldIndex, newIndex);
                setModel((prev) => ({
                    ...prev,
                    slots: {
                        ...prev.slots,
                        [slotType]: reordered,
                    },
                }));
            }
        }
    };

    // Remove item from slot
    const handleRemove = useCallback((slotType: 'education' | 'experience' | 'skills', itemId: string) => {
        setModel((prev) => ({
            ...prev,
            slots: {
                ...prev.slots,
                [slotType]: prev.slots[slotType].filter((item) => item.id !== itemId),
            },
        }));
    }, []);

    // Update header field
    const handleHeaderChange = useCallback((field: keyof CvModel['header'], value: string) => {
        setModel((prev) => ({
            ...prev,
            header: {
                ...prev.header,
                [field]: value,
            },
        }));
    }, []);

    // Template change
    const handleTemplateChange = useCallback((templateId: CvTemplate) => {
        setModel((prev) => ({ ...prev, templateId }));
    }, []);

    // Export handlers
    const handleExportHtml = useCallback(() => {
        const html = serializeCvModelToHtml(model);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cv.html';
        a.click();
        URL.revokeObjectURL(url);
    }, [model]);

    const handleExportPdf = useCallback(() => {
        window.print();
    }, []);

    const handleExportDocx = useCallback(async () => {
        try {
            const { default: HTMLDocx } = await import('html-docx-js-typescript');
            const html = serializeCvModelToHtml(model);
            const docxBlob = await HTMLDocx.asBlob(html);
            const blob = docxBlob instanceof Blob ? docxBlob : new Blob([docxBlob as unknown as ArrayBuffer]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cv.docx';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export DOCX:', err);
            alert('Failed to export DOCX. Please try again.');
        }
    }, [model]);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-screen print:hidden">
                {/* Left: Palette */}
                <div className="w-80 border-r bg-muted/20 overflow-y-auto p-4">
                    <h2 className="text-lg font-semibold mb-4">Available Items</h2>
                    <AppCvEditorPalette
                        education={availableEducation}
                        experience={availableExperience}
                        skills={availableSkills}
                        placedEducationIds={model.slots.education.map((e) => e.id)}
                        placedExperienceIds={model.slots.experience.map((e) => e.id)}
                        placedSkillIds={model.slots.skills.map((s) => s.id)}
                    />
                </div>

                {/* Center: Preview */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    <div className="max-w-4xl mx-auto">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow">
                            <div className="flex gap-2">
                                <Button
                                    variant={model.templateId === 'modern' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleTemplateChange('modern')}
                                >
                                    Modern
                                </Button>
                                <Button
                                    variant={model.templateId === 'classic' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleTemplateChange('classic')}
                                >
                                    Classic
                                </Button>
                                <Button
                                    variant={model.templateId === 'minimal' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleTemplateChange('minimal')}
                                >
                                    Minimal
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportHtml}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    HTML
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportDocx}>
                                    <FileDown className="w-4 h-4 mr-2" />
                                    DOCX
                                </Button>
                            </div>
                        </div>

                        {/* A4 Preview with Slots */}
                        <AppCvEditorPreview
                            ref={previewRef}
                            model={model}
                            onHeaderChange={handleHeaderChange}
                            onRemove={handleRemove}
                        />
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeId ? <div className="bg-white p-2 shadow-lg rounded">{activeId}</div> : null}
            </DragOverlay>
        </DndContext>
    );
}
