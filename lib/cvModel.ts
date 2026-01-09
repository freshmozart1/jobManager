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
    degree: string;
    field: string;
    institution: string;
    graduation_year: number;
};

/**
 * Placed item in Experience slot
 */
export type CvExperienceItem = {
    id: string;
    from: Date;
    to?: Date;
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
    return items.map((item, idx) => ({
        id: `exp-${idx}`,
        from: item.from,
        to: item.to,
        role: item.role,
        company: item.company,
        summary: item.summary,
        tags: item.tags,
    }));
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

/**
 * Serialize CV model to HTML string for persistence
 */
export function serializeCvModelToHtml(model: CvModel): string {
    const { templateId, header, slots } = model;

    // Helper to format dates
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    // Build HTML sections
    const headerHtml = `
        <section data-slot="header" style="margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 12px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">${header.name}</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
                ${header.email} | ${header.phone}${header.location ? ` | ${header.location}` : ''}
            </p>
        </section>
    `;

    const educationHtml = slots.education.length
        ? `
        <section data-slot="education" style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #333;">Education</h2>
            ${slots.education
            .map(
                (item) => `
                <div data-item-id="${item.id}" style="margin-bottom: 12px;">
                    <p style="margin: 0; font-weight: 600;">${item.degree} in ${item.field}</p>
                    <p style="margin: 2px 0; font-size: 14px; color: #666;">${item.institution}, ${item.graduation_year}</p>
                </div>
            `
            )
            .join('')}
        </section>
    `
        : '';

    const experienceHtml = slots.experience.length
        ? `
        <section data-slot="experience" style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #333;">Work Experience</h2>
            ${slots.experience
            .map(
                (item) => `
                <div data-item-id="${item.id}" style="margin-bottom: 16px;">
                    <p style="margin: 0; font-weight: 600;">${item.role}</p>
                    <p style="margin: 2px 0; font-size: 14px; color: #666;">
                        ${item.company} | ${formatDate(item.from)} - ${item.to ? formatDate(item.to) : 'Present'}
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 14px;">${item.summary}</p>
                    ${item.tags.length
                        ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #888;"><em>Skills: ${item.tags.join(', ')}</em></p>`
                        : ''
                    }
                </div>
            `
            )
            .join('')}
        </section>
    `
        : '';

    const skillsHtml = slots.skills.length
        ? `
        <section data-slot="skills" style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #333;">Skills</h2>
            <ul style="margin: 0; padding-left: 20px;">
                ${slots.skills
            .map(
                (item) => `
                    <li data-item-id="${item.id}" style="margin-bottom: 6px; font-size: 14px;">
                        <strong>${item.name}</strong> (${item.level}) - ${item.years} years
                    </li>
                `
            )
            .join('')}
            </ul>
        </section>
    `
        : '';

    // Wrap in root div with template marker
    return `<div data-template="${templateId}" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        ${headerHtml}
        ${educationHtml}
        ${experienceHtml}
        ${skillsHtml}
    </div>`;
}

/**
 * Parse HTML string back into CV model (rehydration)
 */
export function parseCvModelFromHtml(html: string): CvModel | null {
    if (!html.trim()) return null;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const root = doc.querySelector('[data-template]');

        if (!root) return null;

        const templateId = (root.getAttribute('data-template') as CvTemplate) || 'modern';

        // Parse header
        const headerSection = root.querySelector('[data-slot="header"]');
        const h1 = headerSection?.querySelector('h1');
        const headerP = headerSection?.querySelector('p');
        const headerText = headerP?.textContent?.trim() || '';
        const [email = '', phone = '', location = ''] = headerText.split('|').map((s) => s.trim());

        const header = {
            name: h1?.textContent?.trim() || '',
            email,
            phone,
            location,
        };

        // Parse slots
        const education: CvEducationItem[] = [];
        const eduSection = root.querySelector('[data-slot="education"]');
        eduSection?.querySelectorAll('[data-item-id]').forEach((el) => {
            const id = el.getAttribute('data-item-id') || '';
            const texts = Array.from(el.querySelectorAll('p')).map((p) => p.textContent?.trim() || '');
            const degreeField = texts[0] || '';
            const institutionYear = texts[1] || '';

            const degreeMatch = degreeField.match(/^(.+?) in (.+)$/);
            const degree = degreeMatch?.[1]?.trim() || '';
            const field = degreeMatch?.[2]?.trim() || '';

            const institutionYearMatch = institutionYear.match(/^(.+?), (\d{4})$/);
            const institution = institutionYearMatch?.[1]?.trim() || '';
            const graduation_year = parseInt(institutionYearMatch?.[2] || '0', 10);

            if (id && degree && field && institution && graduation_year) {
                education.push({ id, degree, field, institution, graduation_year });
            }
        });

        const experience: CvExperienceItem[] = [];
        const expSection = root.querySelector('[data-slot="experience"]');
        expSection?.querySelectorAll('[data-item-id]').forEach((el) => {
            const id = el.getAttribute('data-item-id') || '';
            const texts = Array.from(el.querySelectorAll('p')).map((p) => p.textContent?.trim() || '');
            const role = texts[0] || '';
            const companyDate = texts[1] || '';
            const summary = texts[2] || '';

            const companyDateMatch = companyDate.match(/^(.+?) \| (.+?) - (.+)$/);
            const company = companyDateMatch?.[1]?.trim() || '';
            const fromStr = companyDateMatch?.[2]?.trim() || '';
            const toStr = companyDateMatch?.[3]?.trim() || '';

            const from = new Date(fromStr);
            const to = toStr === 'Present' ? undefined : new Date(toStr);

            const tagsMatch = texts[3]?.match(/Skills: (.+)/);
            const tags = tagsMatch?.[1]?.split(',').map((t) => t.trim()) || [];

            if (id && role && company && !isNaN(from.getTime())) {
                experience.push({ id, from, to, role, company, summary, tags });
            }
        });

        const skills: CvSkillItem[] = [];
        const skillsSection = root.querySelector('[data-slot="skills"]');
        skillsSection?.querySelectorAll('li[data-item-id]').forEach((el) => {
            const id = el.getAttribute('data-item-id') || '';
            const text = el.textContent?.trim() || '';
            const match = text.match(/^(.+?) \((.+?)\) - (\d+) years$/);
            const name = match?.[1]?.trim() || '';
            const level = match?.[2]?.trim() || '';
            const years = parseInt(match?.[3] || '0', 10);

            if (id && name) {
                skills.push({ id, name, category: '', level, years });
            }
        });

        return {
            templateId,
            header,
            slots: { education, experience, skills },
        };
    } catch (err) {
        console.error('Failed to parse CV HTML:', err);
        return null;
    }
}
