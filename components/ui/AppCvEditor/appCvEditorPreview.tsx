'use client';

import type { CvModelNormalized } from '@/lib/cvModel';
import { Input } from '@/components/ui/input';
import AppCvEditorSlot from './appCvEditorSlot';

type AppCvEditorPreviewProps = {
    model: CvModelNormalized;
    onHeaderChange: (field: keyof CvModelNormalized['header'], value: string) => void;
    onHeaderAddressChange: (field: keyof CvModelNormalized['header']['address'], value: string) => void;
    onRemove: (slotType: 'education' | 'experience' | 'skills', itemId: string) => void;
};

export default function AppCvEditorPreview({ model, onHeaderChange, onHeaderAddressChange, onRemove }: AppCvEditorPreviewProps) {
    return <div
        className='bg-white shadow-lg mx-auto print:shadow-none print:visible'
        style={{
            width: `210mm`,
            minHeight: `297mm`,
            padding: '20mm',
        }}
    >
        <div>
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
                <Input
                    type="tel"
                    value={model.header.phone}
                    onChange={(e) => onHeaderChange('phone', e.target.value)}
                    placeholder="+1234567890"
                    className="border-none shadow-none px-0 focus-visible:ring-0"
                />
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
                <Input
                    type="text"
                    value={model.header.address.streetAddress}
                    onChange={(e) => onHeaderAddressChange('streetAddress', e.target.value)}
                    placeholder="Street Address"
                    className="border-none shadow-none px-0 focus-visible:ring-0"
                />
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={model.header.address.addressLocality}
                        onChange={(e) => onHeaderAddressChange('addressLocality', e.target.value)}
                        placeholder="City"
                        className="border-none shadow-none px-0 focus-visible:ring-0"
                    />
                    <Input
                        type="text"
                        value={model.header.address.addressRegion}
                        onChange={(e) => onHeaderAddressChange('addressRegion', e.target.value)}
                        placeholder="State/Region"
                        className="border-none shadow-none px-0 focus-visible:ring-0"
                    />
                    <Input
                        type="text"
                        value={model.header.address.postalCode}
                        onChange={(e) => onHeaderAddressChange('postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="border-none shadow-none px-0 focus-visible:ring-0"
                    />
                </div>
                <Input
                    type="text"
                    value={model.header.address.addressCountry}
                    onChange={(e) => onHeaderAddressChange('addressCountry', e.target.value)}
                    placeholder="Country"
                    className="border-none shadow-none px-0 focus-visible:ring-0"
                />
            </div>
            <AppCvEditorSlot
                slotType="education"
                title="Education"
                items={model.slots.education}
                onRemove={(itemId) => onRemove('education', itemId)}
            />
            <AppCvEditorSlot
                slotType="experience"
                title="Work experience"
                items={model.slots.experience}
                onRemove={(itemId) => onRemove('experience', itemId)}
            />
            <AppCvEditorSlot
                slotType="skills"
                title="Skills"
                items={model.slots.skills}
                onRemove={(itemId) => onRemove('skills', itemId)}
            />
        </div>
    </div>;
}

