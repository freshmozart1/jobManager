import { PersonalInformation } from "@/types";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import useToUrl from "./useToUrl";
import { normaliseExperienceItems, normaliseCertifications, normaliseSkills } from "@/lib/personal";

export default function usePersonal(): [PersonalInformation | null, Dispatch<SetStateAction<PersonalInformation | null>>, boolean] {
    const toUrl = useToUrl();
    const [personalInfo, setPersonalInfo] = useState<PersonalInformation | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const controller = new AbortController();
        fetch(toUrl('/api/personal'), { signal: controller.signal })
            .then(res => res.json())
            .then((data: PersonalInformation) => {
                const normalizedExperience = normaliseExperienceItems(data.experience);
                const normalizedCertifications = normaliseCertifications(data.certifications);
                const normalizedSkills = normaliseSkills(data.skills);
                // Ensure contact.address exists (normalize for older DB entries)
                const normalizedContact = {
                    ...data.contact,
                    address: data.contact.address || {}
                };
                setPersonalInfo({
                    ...data,
                    contact: normalizedContact,
                    experience: normalizedExperience,
                    certifications: normalizedCertifications,
                    skills: normalizedSkills
                });
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching personal information:', err);
                    setLoading(false);
                }
            });
        return () => {
            controller.abort('Component cleanup');
        };
    }, [toUrl]);

    return [personalInfo, setPersonalInfo, loading];
}