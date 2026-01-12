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
 * Only templateId is required; all other fields are optional for draft support.
 */
export type CvModel = {
    templateId: CvTemplate;
    header?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: {
            streetAddress?: string;
            addressLocality?: string;
            addressRegion?: string;
            postalCode?: string;
            addressCountry?: string;
        };
    };
    slots?: {
        education?: CvEducationItem[];
        experience?: CvExperienceItem[];
        skills?: CvSkillItem[];
    };
};

/**
 * Fully populated CV model used by the editor
 * All fields are guaranteed to exist (though they may be empty strings or empty arrays)
 */
export type CvModelNormalized = {
    templateId: CvTemplate;
    header: {
        name: string;
        email: string;
        phone: string;
        address: {
            streetAddress: string;
            addressLocality: string;
            addressRegion: string;
            postalCode: string;
            addressCountry: string;
        };
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
 * Create an empty CV model with all fields populated
 */
export function createEmptyCvModel(): CvModelNormalized {
    return {
        templateId: 'modern',
        header: {
            name: '',
            email: '',
            phone: '',
            address: {
                streetAddress: '',
                addressLocality: '',
                addressRegion: '',
                postalCode: '',
                addressCountry: '',
            },
        },
        slots: {
            education: [],
            experience: [],
            skills: [],
        },
    };
}

/**
 * Validate YYYY-MM date format and month range
 */
function isValidYYYYMM(dateStr: string): boolean {
    const match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[2], 10);
    return month >= 1 && month <= 12;
}

/**
 * Check if a string is blank (empty or whitespace-only)
 */
function isBlank(value: unknown): boolean {
    return typeof value === 'string' && value.trim() === '';
}

/**
 * Normalize a partial CV model into a full model with all fields present.
 * Used when loading CV artifacts from the backend to ensure the editor receives a complete structure.
 */
export function normalizeCvModel(partial: unknown): CvModelNormalized {
    const empty = createEmptyCvModel();

    if (typeof partial !== 'object' || partial === null) {
        return empty;
    }

    const p = partial as Partial<CvModel>;

    return {
        templateId: p.templateId || empty.templateId,
        header: {
            name: p.header?.name ?? empty.header.name,
            email: p.header?.email ?? empty.header.email,
            phone: p.header?.phone ?? empty.header.phone,
            address: {
                streetAddress: p.header?.address?.streetAddress ?? empty.header.address.streetAddress,
                addressLocality: p.header?.address?.addressLocality ?? empty.header.address.addressLocality,
                addressRegion: p.header?.address?.addressRegion ?? empty.header.address.addressRegion,
                postalCode: p.header?.address?.postalCode ?? empty.header.address.postalCode,
                addressCountry: p.header?.address?.addressCountry ?? empty.header.address.addressCountry,
            },
        },
        slots: {
            education: Array.isArray(p.slots?.education) ? p.slots.education : empty.slots.education,
            experience: Array.isArray(p.slots?.experience) ? p.slots.experience : empty.slots.experience,
            skills: Array.isArray(p.slots?.skills) ? p.slots.skills : empty.slots.skills,
        },
    };
}

/**
 * Sanitize a CV model for saving: omit blank strings, drop invalid array items,
 * and remove empty objects/arrays to keep drafts compact.
 */
export function sanitizeCvDraftForSave(model: CvModel): CvModel {
    const result: CvModel = {
        templateId: model.templateId,
    };

    // Header fields
    if (model.header) {
        const header: NonNullable<CvModel['header']> = {};
        let hasHeaderFields = false;

        if (model.header.name && !isBlank(model.header.name)) {
            header.name = model.header.name;
            hasHeaderFields = true;
        }
        if (model.header.email && !isBlank(model.header.email)) {
            header.email = model.header.email;
            hasHeaderFields = true;
        }
        if (model.header.phone && !isBlank(model.header.phone)) {
            header.phone = model.header.phone;
            hasHeaderFields = true;
        }

        // Address fields
        if (model.header.address) {
            const address: NonNullable<NonNullable<CvModel['header']>['address']> = {};
            let hasAddressFields = false;

            if (model.header.address.streetAddress && !isBlank(model.header.address.streetAddress)) {
                address.streetAddress = model.header.address.streetAddress;
                hasAddressFields = true;
            }
            if (model.header.address.addressLocality && !isBlank(model.header.address.addressLocality)) {
                address.addressLocality = model.header.address.addressLocality;
                hasAddressFields = true;
            }
            if (model.header.address.addressRegion && !isBlank(model.header.address.addressRegion)) {
                address.addressRegion = model.header.address.addressRegion;
                hasAddressFields = true;
            }
            if (model.header.address.postalCode && !isBlank(model.header.address.postalCode)) {
                address.postalCode = model.header.address.postalCode;
                hasAddressFields = true;
            }
            if (model.header.address.addressCountry && !isBlank(model.header.address.addressCountry)) {
                address.addressCountry = model.header.address.addressCountry;
                hasAddressFields = true;
            }

            if (hasAddressFields) {
                header.address = address;
                hasHeaderFields = true;
            }
        }

        if (hasHeaderFields) {
            result.header = header;
        }
    }

    // Slots
    if (model.slots) {
        const slots: NonNullable<CvModel['slots']> = {};
        let hasSlotsData = false;

        // Education items (drop items with blank required fields)
        if (Array.isArray(model.slots.education) && model.slots.education.length > 0) {
            const validEducation = model.slots.education.filter((item) => {
                return (
                    item.degree && !isBlank(item.degree) &&
                    item.field && !isBlank(item.field) &&
                    item.institution && !isBlank(item.institution) &&
                    typeof item.graduation_year === 'number' && Number.isFinite(item.graduation_year)
                );
            });
            if (validEducation.length > 0) {
                slots.education = validEducation;
                hasSlotsData = true;
            }
        }

        // Experience items (drop items with invalid dates or blank required fields)
        if (Array.isArray(model.slots.experience) && model.slots.experience.length > 0) {
            const validExperience = model.slots.experience.filter((item) => {
                return (
                    item.from && isValidYYYYMM(item.from) &&
                    (item.to === undefined || isValidYYYYMM(item.to)) &&
                    item.role && !isBlank(item.role) &&
                    item.company && !isBlank(item.company) &&
                    item.summary && !isBlank(item.summary) &&
                    Array.isArray(item.tags)
                );
            });
            if (validExperience.length > 0) {
                slots.experience = validExperience;
                hasSlotsData = true;
            }
        }

        // Skill items (drop items with blank required fields)
        if (Array.isArray(model.slots.skills) && model.slots.skills.length > 0) {
            const validSkills = model.slots.skills.filter((item) => {
                return (
                    item.name && !isBlank(item.name) &&
                    item.category && !isBlank(item.category) &&
                    typeof item.level === 'string' &&
                    typeof item.years === 'number' && Number.isFinite(item.years)
                );
            });
            if (validSkills.length > 0) {
                slots.skills = validSkills;
                hasSlotsData = true;
            }
        }

        if (hasSlotsData) {
            result.slots = slots;
        }
    }

    return result;
}



