'use client';

import type { CvModelNormalized } from '@/lib/cvModel';
import { Input } from '@/components/ui/input';
import AppCvEditorSlot from './appCvEditorSlot';

type AppCvEditorPreviewProps = {
    model: CvModelNormalized;
    onHeaderChange: (field: keyof CvModelNormalized['header'], value: string) => void;
    onHeaderAddressChange: (field: keyof CvModelNormalized['header']['address'], value: string) => void;
    onRemove: (slotType: 'education' | 'experience' | 'skills' | 'certifications', itemId: string) => void;
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
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 3fr',
            columnGap: '20mm',
            rowGap: '10mm',
        }}>
            <Input
                type="text"
                value={model.header.name}
                onChange={(e) => onHeaderChange('name', e.target.value)}
                placeholder="Your Name"
                style={{
                    fontSize: '3em',
                    textAlign: 'center',
                    border: 'none',
                    boxShadow: 'none',
                    height: '1em',
                    gridColumn: 'span 2',
                }}
            />
            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <span>Contact</span>
                <hr style={{
                    margin: '0.25em 0'
                }} />
                <Input
                    type="email"
                    value={model.header.email}
                    onChange={(e) => onHeaderChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                />
                <Input
                    type="tel"
                    value={model.header.phone}
                    onChange={(e) => onHeaderChange('phone', e.target.value)}
                    placeholder="+1234567890"
                    className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                />
                <Input
                    type="text"
                    value={model.header.address.streetAddress}
                    onChange={(e) => onHeaderAddressChange('streetAddress', e.target.value)}
                    placeholder="Street Address"
                    className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                />
                <div className="flex">
                    <Input
                        type="text"
                        value={model.header.address.postalCode}
                        onChange={(e) => onHeaderAddressChange('postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                    />
                    <Input
                        type="text"
                        value={model.header.address.addressLocality}
                        onChange={(e) => onHeaderAddressChange('addressLocality', e.target.value)}
                        placeholder="City"
                        className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                    />
                </div>
                <Input
                    type="text"
                    value={model.header.address.addressRegion}
                    onChange={(e) => onHeaderAddressChange('addressRegion', e.target.value)}
                    placeholder="State/Region"
                    className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                />
                <Input
                    type="text"
                    value={model.header.address.addressCountry}
                    onChange={(e) => onHeaderAddressChange('addressCountry', e.target.value)}
                    placeholder="Country"
                    className="border-none shadow-none px-0 focus-visible:ring-0 h-[1.5em] rounded-none"
                />
                <AppCvEditorSlot
                    slotType="education"
                    title="Education"
                    items={model.slots.education}
                    onRemove={(itemId) => onRemove('education', itemId)}
                    style={{ marginTop: '10mm' }}
                />
                <AppCvEditorSlot
                    slotType="skills"
                    title="Skills"
                    items={model.slots.skills}
                    onRemove={(itemId) => onRemove('skills', itemId)}
                    style={{ marginTop: '10mm' }}
                />
                <AppCvEditorSlot
                    slotType="certifications"
                    title="Certificates"
                    items={model.slots.certifications}
                    onRemove={(itemId) => onRemove('certifications', itemId)}
                    style={{ marginTop: '10mm' }}
                />
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column'
            }}>
                <AppCvEditorSlot
                    slotType="experience"
                    title="Work experience"
                    items={model.slots.experience}
                    onRemove={(itemId) => onRemove('experience', itemId)}
                />
            </div>
        </div>
    </div>;
}