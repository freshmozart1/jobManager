export const VALID_PERSONAL_INFORMATION_TYPES = [
    'contact',
    'eligibility',
    'constraints',
    'preferences',
    'experience',
    'education',
    'certifications',
    'languages_spoken',
    'exclusions',
    'motivations',
    'career_goals'
] as const;

export type PersonalInformationType = typeof VALID_PERSONAL_INFORMATION_TYPES[number];

export const MaxTagCount = 10;
export const MaxTagLength = 20;
export const JOB_ARTIFACT_TYPES = ['cover-letter', 'cv'] as const;
