import type {
    PersonalInformationEducation,
    PersonalInformationExperience,
    PersonalInformationSkill,
} from '@/types';

/**
 * CV Template IDs
 */
export type CvTemplate = 'modern' | 'classic' | 'minimal';

/**
 * In-memory CV model (JSON)
 */
export type CvModel = {
    templateId: CvTemplate;
    header: {
        name: string;
        email: string;
        phone: string;
        location?: string;
    };
    slots: {
        education: CvEducationItem[];
        experience: CvExperienceItem[];
        skills: CvSkillItem[];
    };
};

/**
 * Placed item in Education slot
 */
export type CvEducationItem = {
    id: string;
} & PersonalInformationEducation;

/**
 * Placed item in Experience slot (dates as YYYY-MM strings)
 */
export type CvExperienceItem = {
    id: string;
    from: string; // YYYY-MM format
    to?: string; // YYYY-MM format, optional
    role: string;
    company: string;
    summary: string;
    tags: string[];
};

/**
 * Placed item in Skills slot
 */
export type CvSkillItem = {
    id: string;
    name: string;
    category: string;
    level: string;
    years: number;
};

/**
 * Convert personal data items into draggable palette items (with generated IDs)
 */
export function personalEducationToCvEducation(
    items: PersonalInformationEducation[]
): CvEducationItem[] {
    return items.map((item, idx) => ({
        id: `edu-${idx}`,
        degree: item.degree,
        field: item.field,
        institution: item.institution,
        graduation_year: item.graduation_year,
    }));
}

export function personalExperienceToCvExperience(
    items: PersonalInformationExperience[]
): CvExperienceItem[] {
    return items.map((item, idx) => {
        const from = item.from instanceof Date ? formatDateToYYYYMM(item.from) : String(item.from);
        const to = item.to ? (item.to instanceof Date ? formatDateToYYYYMM(item.to) : String(item.to)) : undefined;
        return {
            id: `exp-${idx}`,
            from,
            to,
            role: item.role,
            company: item.company,
            summary: item.summary,
            tags: item.tags,
        };
    });
}

/**
 * Format a Date object to YYYY-MM string
 */
function formatDateToYYYYMM(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function personalSkillsToCvSkills(items: PersonalInformationSkill[]): CvSkillItem[] {
    return items.map((item, idx) => ({
        id: `skill-${idx}`,
        name: item.name,
        category: item.category,
        level: item.level,
        years: item.years,
    }));
}

/**
 * Create an empty CV model
 */
export function createEmptyCvModel(): CvModel {
    return {
        templateId: 'modern',
        header: {
            name: '',
            email: '',
            phone: '',
            location: '',
        },
        slots: {
            education: [],
            experience: [],
            skills: [],
        },
    };
}


