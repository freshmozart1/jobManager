import type {
    PersonalInformationEducation,
    PersonalInformationExperience,
    PersonalInformationCertification,
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
        certifications?: CvCertificationItem[];
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
        certifications: CvCertificationItem[];
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
 * Placed item in Certifications slot
 */
export type CvCertificationItem = {
    id: string;
    name: string;
    issued: string; // YYYY-MM format
    expires: string | null; // YYYY-MM format or null
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

export function personalCertificationsToCvCertifications(
    items: PersonalInformationCertification[]
): CvCertificationItem[] {
    return items.map((item, idx) => {
        const issued = item.issued instanceof Date ? formatDateToYYYYMM(item.issued) : String(item.issued);
        const expires = item.expires ? (item.expires instanceof Date ? formatDateToYYYYMM(item.expires) : String(item.expires)) : null;
        return {
            id: `cert-${idx}`,
            name: item.name,
            issued,
            expires,
        };
    });
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
            certifications: [],
        },
    };
}

/**
 * Validate YYYY-MM date format and month range
 */
export function isValidYYYYMM(dateStr: string): boolean {
    const match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[2], 10);
    return month >= 1 && month <= 12;
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
            certifications: Array.isArray(p.slots?.certifications) ? p.slots.certifications : empty.slots.certifications,
        },
    };
}

/**
 * Sanitize a CV model for saving: omit blank strings, drop invalid array items,
 * and remove empty objects/arrays to keep drafts compact.
 */
export function sanitizeCvDraftForSave(model: CvModel): CvModel {
    type UnknownRecord = Record<string, unknown>;
    type CvModelNonNullable<K extends keyof CvModel> = NonNullable<CvModel[K]>;
    type Slots = CvModelNonNullable<'slots'>;

    const result: CvModel = {
        templateId: model.templateId,
    };

    const pickNonBlank = <T extends UnknownRecord, K extends keyof T>(
        obj: T,
        keys?: readonly K[]
    ): Partial<Pick<T, K>> =>
        Object.fromEntries(
            (keys ?? Object.keys(obj))
                .map((k) => [k, obj[k]] as const)
                .filter(([, v]) =>
                    typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined
                )
        ) as Partial<Pick<T, K>>;

    const header = pickNonBlank(model.header as UnknownRecord, ['name', 'email', 'phone']) as Partial<CvModelNonNullable<'header'>>;
    if (model.header) {
        const header = pickNonBlank(model.header as UnknownRecord, ['name', 'email', 'phone']) as CvModelNonNullable<'header'>;
        const address = model.header.address
            ? pickNonBlank(model.header.address as UnknownRecord)
            : undefined;
        if (address && Object.keys(address).length) header.address = address;
        if (Object.keys(header).length) result.header = header;
    }

    // Slots
    if (model.slots) {
        const slots: Slots = {};
        let hasSlotsData = false;

        const { education = [], experience = [], certifications = [] } = model.slots;

        const isBlank = (value: unknown) => typeof value === 'string' && value.trim() === '';
        const isYear = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
        const addSlot = <K extends keyof Slots>(
            slotName: K,
            slotItems: NonNullable<Slots[K]>,
            isValid: (item: NonNullable<Slots[K]>[number]) => boolean
        ) => {
            console.log(`Sanitizing slot ${String(slotName)} with ${slotItems.length} items`);
            const validItems = slotItems.length > 0 ? slotItems.filter(isValid) : [];
            console.log(`  -> ${validItems.length} valid items retained`);
            (slots as Record<string, (CvEducationItem | CvExperienceItem | CvCertificationItem)[]>)[slotName] = validItems;
            hasSlotsData = true;
        };

        addSlot('education', education, (item: CvEducationItem) => (
            !!item.degree && !isBlank(item.degree) &&
            !!item.field && !isBlank(item.field) &&
            !!item.institution && !isBlank(item.institution) &&
            isYear(item.graduation_year)
        ));

        addSlot('experience', experience, (item: CvExperienceItem) => (
            !!item.from && isValidYYYYMM(item.from) &&
            (item.to === undefined || isValidYYYYMM(item.to)) &&
            !!item.role && !isBlank(item.role) &&
            !!item.company && !isBlank(item.company) &&
            !!item.summary && !isBlank(item.summary) &&
            Array.isArray(item.tags)
        ));

        addSlot('certifications', certifications, (item: CvCertificationItem) => {
            console.log('Sanitizing certification item:', item);
            return (
                !!item.name && !isBlank(item.name) &&
                !!item.issued
            )
        });

        if (hasSlotsData) {
            result.slots = slots;
        }
    }

    return result;
}