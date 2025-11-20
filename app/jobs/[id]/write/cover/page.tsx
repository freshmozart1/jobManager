'use client';

import { Button } from "@/components/ui/button";
import useLoadJob from "@/hooks/useLoadJob";
import usePersonal from "@/hooks/usePersonal";
import { LoaderCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function CoverPage() {
    const jobId = useParams().id as string;
    const router = useRouter();
    const addressLine1counter = 6;
    const [job, loading, error] = useLoadJob(jobId);
    const [personal, , personalLoading] = usePersonal();

    if (loading || personalLoading) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p>Loading job details and personal information...</p>
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error || !job || !personal) {
        return (
            <div className="w-full h-svh flex flex-col gap-4 items-center justify-center">
                <p className="text-destructive">{error || (!job ? 'Job' : 'Personal information') + ' not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return <div className="print:visible" style={{
        display: 'grid',
        placeContent: 'center',
        overflow: 'hidden',
    }}>
        <form onChange={() => { }} autoComplete="off" style={{
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
                        fontSize: 27.4 / addressLine1counter + 'mm',
                        lineHeight: 27.3 / addressLine1counter + 'mm',
                        margin: '0',
                        padding: '0',
                        resize: 'none',
                        border: 'none',
                        outline: 'none',
                        overflow: 'hidden',
                    }}
                        defaultValue={`${job.companyName}\n${job.companyAddress?.streetAddress}\n${job.companyAddress?.postalCode} ${job.companyAddress?.addressLocality}`}></textarea>
                </div>
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
                    {[['Applicant:', 'name'], ['E-Mail:', 'email'], ['Telephone:', 'phone'], ['Date:', 'date']].map(([label, name], i) => <label key={i} htmlFor={name} style={{
                        gridColumn: '1 / 2',
                        gridRow: `${i + 1} / ${i + 2}`,

                        justifySelf: 'start',
                    }}>{label}</label>)}
                    {[[personal.contact.name, 'name'], [personal.contact.email, 'email'], [personal.contact.phone, 'phone'], [new Date().toLocaleDateString(), 'date']].map(([value, name], i) => <textarea key={i} defaultValue={value} name={name} style={{
                        gridColumn: '2 / 3',
                        gridRow: `${i + 1} / ${i + 2}`,
                        border: 'none',
                        outline: 'none',
                        fontSize: 27.3 / 6 + 'mm',
                        lineHeight: 27.3 / 6 + 'mm',
                        padding: '0',
                        margin: '0',
                        overflowWrap: 'anywhere',
                        resize: 'none',
                    }}></textarea>)}
                </div>
            </section>
            <section style={{
                width: '210mm',
                minHeight: '207mm',
                padding: '8.46mm 20mm 8.46mm 25mm',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '12pt'
            }}>
                <input type="text" inputMode="text" autoComplete="off" aria-autocomplete="none" placeholder="Subject" name="subject" onFocus={() => { }} style={{
                    fontWeight: 'bold',
                    fontSize: '12pt',
                    marginBottom: '6pt',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                }}></input>
                <textarea name="letter" placeholder="write your cover letter here..." onFocus={() => { }} style={{
                    flexGrow: 1,
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    resize: 'none',
                    fontSize: '12pt',
                    lineHeight: '1.5',
                    overflow: 'hidden',
                }}></textarea>
            </section>
        </form >
    </div>;
}