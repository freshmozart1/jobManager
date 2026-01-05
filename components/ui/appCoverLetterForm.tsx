import { useCallback, useEffect, useRef, useState } from "react";
import AppApplicantFields from "./appApplicantFields";

export type CoverLetterFormState = {
    subject: string;
    content: string;
    recipient: string;
    applicant: string;
};

type AppCoverLetterFormProps = {
    /** The current form state */
    value: CoverLetterFormState;
    /** Called when any field changes */
    onChange: (value: CoverLetterFormState) => void;
};

const ADDRESS_LINE_COUNT = 6;
/** A4 width in pixels at 96dpi (210mm) */
const A4_WIDTH_PX = 794;

/**
 * AppCoverLetterForm renders an A4-sized cover letter form with:
 * - Recipient address section
 * - Applicant information fields
 * - Subject line input
 * - Letter body textarea
 */
export default function AppCoverLetterForm({ value, onChange }: AppCoverLetterFormProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current?.parentElement) {
                const parentWidth = containerRef.current.parentElement.clientWidth;
                const newScale = Math.min(1, parentWidth / A4_WIDTH_PX);
                setScale(newScale);
            }
        };

        updateScale();

        const resizeObserver = new ResizeObserver(updateScale);
        if (containerRef.current?.parentElement) {
            resizeObserver.observe(containerRef.current.parentElement);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const updateField = useCallback(<K extends keyof CoverLetterFormState>(
        field: K,
        fieldValue: CoverLetterFormState[K]
    ) => {
        onChange({ ...value, [field]: fieldValue });
    }, [value, onChange]);

    return (
        <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <form onSubmit={e => e.preventDefault()} autoComplete="off" style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                width: '210mm',
                minHeight: '297mm',
                background: '#fff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                boxSizing: 'border-box',
            }}>
                <section style={{
                    height: '90mm',
                    width: '210mm',
                    position: 'relative',
                }}>
                    <div style={{
                        width: '85mm',
                        height: '45mm',
                        padding: '0 0 0 5mm',
                        position: 'absolute',
                        top: '45mm',
                        left: '20mm'
                    }}>
                        <div style={{
                            width: '85mm',
                            height: '17.7mm',
                            fontSize: 17.7 / 5 + 'mm',
                            lineHeight: 17.7 / 5 + 'mm',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'flex-end'
                        }}>Recipient</div>
                        <textarea style={{
                            height: '27.3mm',
                            width: '85mm',
                            fontSize: 27.4 / ADDRESS_LINE_COUNT + 'mm',
                            lineHeight: 27.3 / ADDRESS_LINE_COUNT + 'mm',
                            margin: '0',
                            padding: '0',
                            resize: 'none',
                            border: 'none',
                            outline: 'none',
                            overflow: 'hidden',
                        }}
                            value={value.recipient}
                            onChange={e => updateField('recipient', e.target.value)}
                        />
                    </div>
                    <AppApplicantFields
                        value={value.applicant}
                        onChange={applicant => updateField('applicant', applicant)}
                    />
                </section>
                <section style={{
                    width: '210mm',
                    minHeight: '207mm',
                    padding: '8.46mm 20mm 8.46mm 25mm',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '12pt'
                }}>
                    <input
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        aria-autocomplete="none"
                        placeholder="Subject"
                        name="subject"
                        value={value.subject}
                        onChange={e => updateField('subject', e.target.value)}
                        style={{
                            fontWeight: 'bold',
                            fontSize: '12pt',
                            marginBottom: '6pt',
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                        }}
                    />
                    <textarea
                        name="letter"
                        placeholder="write your cover letter here..."
                        value={value.content}
                        onChange={e => updateField('content', e.target.value)}
                        style={{
                            flexGrow: 1,
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            height: '100%',
                            resize: 'none',
                            fontSize: '12pt',
                            lineHeight: '1.5',
                            overflow: 'hidden',
                        }}
                    />
                </section>
            </form>
        </div>
    );
}
