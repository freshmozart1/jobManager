import { useMemo, useCallback } from "react";

export type ApplicantFieldsData = {
    name: string;
    email: string;
    phone: string;
    date: string;
};

type AppApplicantFieldsProps = {
    /** The applicant string with newline-separated values (name\nemail\nphone\ndate) */
    value: string;
    /** Called when any field changes, with the updated newline-separated string */
    onChange: (value: string) => void;
};

const FIELD_LABELS: readonly [string, string][] = [
    ['Applicant:', 'name'],
    ['E-Mail:', 'email'],
    ['Telephone:', 'phone'],
    ['Date:', 'date']
] as const;

/**
 * AppApplicantFields displays and edits applicant information in a grid layout
 * with labels and editable textarea fields for name, email, phone, and date.
 */
export default function AppApplicantFields({ value, onChange }: AppApplicantFieldsProps) {
    // Parse the newline-separated value into individual fields
    const fields = useMemo<ApplicantFieldsData>(() => {
        const lines = value.split('\n');
        return {
            name: lines[0] ?? '',
            email: lines[1] ?? '',
            phone: lines[2] ?? '',
            date: lines[3] ?? new Date().toLocaleDateString()
        };
    }, [value]);

    // Update a specific field by index and call onChange with the combined string
    const updateField = useCallback((index: number, fieldValue: string) => {
        const lines = value.split('\n');
        // Ensure we have at least 4 lines
        while (lines.length < 4) lines.push('');
        lines[index] = fieldValue;
        onChange(lines.join('\n'));
    }, [value, onChange]);

    const fieldValues = [fields.name, fields.email, fields.phone, fields.date];

    return (
        <div style={{
            width: '75mm',
            height: '40mm',
            position: 'absolute',
            top: '50mm',
            right: '10mm',
            display: 'grid',
            gridTemplateColumns: '75px auto',
            gridTemplateRows: 'auto',
            columnGap: '5mm',
        }}>
            {FIELD_LABELS.map(([label, name], i) => (
                <label
                    key={name}
                    htmlFor={name}
                    style={{
                        gridColumn: '1 / 2',
                        gridRow: `${i + 1} / ${i + 2}`,
                        justifySelf: 'start',
                    }}
                >
                    {label}
                </label>
            ))}
            {fieldValues.map((fieldValue, index) => (
                <textarea
                    key={index}
                    id={FIELD_LABELS[index][1]}
                    value={fieldValue}
                    onChange={e => updateField(index, e.target.value)}
                    style={{
                        gridColumn: '2 / 3',
                        gridRow: `${index + 1} / ${index + 2}`,
                        border: 'none',
                        outline: 'none',
                        fontSize: 27.3 / 6 + 'mm',
                        lineHeight: 27.3 / 6 + 'mm',
                        padding: '0',
                        margin: '0',
                        overflowWrap: 'anywhere',
                        resize: 'none',
                    }}
                />
            ))}
        </div>
    );
}
