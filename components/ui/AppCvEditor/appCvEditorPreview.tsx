'use client';

import { forwardRef } from 'react';
import type { CvModel } from '@/lib/cvModel';
import { Input } from '@/components/ui/input';
import AppCvEditorSlot from './appCvEditorSlot';

type AppCvEditorPreviewProps = {
    model: CvModel;
    onHeaderChange: (field: keyof CvModel['header'], value: string) => void;
    onRemove: (slotType: 'education' | 'experience' | 'skills', itemId: string) => void;
};

/**
 * A4 WYSIWYG Preview with editable header and drop slots
 */
const AppCvEditorPreview = forwardRef<HTMLDivElement, AppCvEditorPreviewProps>(
    ({ model, onHeaderChange, onRemove }, ref) => {
        // A4 dimensions in mm
        const A4_WIDTH_MM = 210;
        const A4_HEIGHT_MM = 297;

        return (
            <div className="print:visible">
                {/* A4 Page Container */}
                <div
                    ref={ref}
                    className="bg-white shadow-lg mx-auto print:shadow-none"
                    style={{
                        width: `${A4_WIDTH_MM}mm`,
                        minHeight: `${A4_HEIGHT_MM}mm`,
                        padding: '20mm',
                    }}
                >
                    {/* Header (Editable) */}
                    <div className="mb-6 pb-4 border-b-2 border-gray-800">
                        <Input
                            type="text"
                            value={model.header.name}
                            onChange={(e) => onHeaderChange('name', e.target.value)}
                            placeholder="Your Name"
                            className="text-3xl font-bold border-none shadow-none px-0 focus-visible:ring-0 mb-2"
                        />
                        <div className="flex gap-2 text-sm text-gray-600">
                            <Input
                                type="email"
                                value={model.header.email}
                                onChange={(e) => onHeaderChange('email', e.target.value)}
                                placeholder="email@example.com"
                                className="border-none shadow-none px-0 focus-visible:ring-0"
                            />
                            <span>|</span>
                            <Input
                                type="tel"
                                value={model.header.phone}
                                onChange={(e) => onHeaderChange('phone', e.target.value)}
                                placeholder="+1234567890"
                                className="border-none shadow-none px-0 focus-visible:ring-0"
                            />
                            {model.header.location && (
                                <>
                                    <span>|</span>
                                    <Input
                                        type="text"
                                        value={model.header.location}
                                        onChange={(e) => onHeaderChange('location', e.target.value)}
                                        placeholder="City, Country"
                                        className="border-none shadow-none px-0 focus-visible:ring-0"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Education Slot */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Education</h2>
                        <AppCvEditorSlot
                            slotType="education"
                            title=""
                            items={model.slots.education}
                            onRemove={(itemId) => onRemove('education', itemId)}
                        />
                    </div>

                    {/* Work Experience Slot */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">
                            Work Experience
                        </h2>
                        <AppCvEditorSlot
                            slotType="experience"
                            title=""
                            items={model.slots.experience}
                            onRemove={(itemId) => onRemove('experience', itemId)}
                        />
                    </div>

                    {/* Skills Slot */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Skills</h2>
                        <AppCvEditorSlot
                            slotType="skills"
                            title=""
                            items={model.slots.skills}
                            onRemove={(itemId) => onRemove('skills', itemId)}
                        />
                    </div>
                </div>
            </div>
        );
    }
);

AppCvEditorPreview.displayName = 'AppCvEditorPreview';

export default AppCvEditorPreview;
