import { PersonalInformation } from "@/types";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import useToUrl from "./useToUrl";
import { normaliseExperienceItems } from "@/lib/experience";

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
                setPersonalInfo({ ...data, experience: normalizedExperience });
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