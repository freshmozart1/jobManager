import { ObjectId } from "mongodb";
import { CvModel } from "@/lib/cvModel";


type Address = {
    type?: 'PostalAddress' | string | null;
    streetAddress?: string | null;
    addressLocality?: string | null;
    addressRegion?: string | null;
    postalCode?: string | null;
    addressCountry?: string | null;
};

export type ScrapedJob = {
    id: string;
    trackingId: string;
    refId: string;
    link: string;
    title: string;
    companyName: string;
    companyLinkedinUrl: string;
    companyLogo: string;
    companyEmployeesCount?: number | undefined;
    location: string;
    postedAt: Date;
    salaryInfo: string[];
    salary: string;
    benefits: string[];
    descriptionHtml: string;
    applicantsCount: number | string;
    applyUrl: string;
    descriptionText: string;
    seniorityLevel?: string | undefined;
    employmentType: string;
    jobFunction?: string | undefined;
    industries?: string | undefined;
    inputUrl: string;
    companyAddress?: Address | undefined;
    companyWebsite?: string | undefined;
    companySlogan?: string | null | undefined;
    companyDescription?: string | undefined;
};

export type JobArtifactType = 'cover-letter' | 'cv';

export type CoverLetterArtifact = {
    type: 'cover-letter';
    content: string;
    subject?: string;
    recipient?: string;
    applicant?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type CvArtifact = {
    type: 'cv';
    content: CvModel;
    createdAt: Date;
    updatedAt: Date;
};

export type JobArtifact = CoverLetterArtifact | CvArtifact;

export type Job = ScrapedJob & {
    filteredAt: Date;
    filterResult: boolean | { error: string };
    filteredBy: ObjectId;
    appliedAt?: Date;
    artifacts?: JobArtifact[];
};


export type PersonalInformationContact = {
    name: string;
    email: string;
    phone: string;
    portfolio_urls: string[];
    address: Address;
};

export type PersonalInformationEligibility = {
    work_authorization: {
        region: string;
        status: string;
    }[];
    security_clearance: string | null;
    relocation: {
        willing: boolean;
        regions: string[];
    };
    remote: {
        willing: boolean;
        time_zone: string;
    };
    availability: {
        notice_period_days: number;
    };
    work_schedule_constraints: {
        weekends: boolean;
        nights: boolean;
    };
};

export type PersonalInformationConstraints = {
    salary_min: {
        currency: string;
        amount: number;
    };
    locations_allowed: string[];
};

export type PersonalInformationPreferences = {
    roles: string[];
    seniority: string[];
    company_size: string[];
    work_mode: {
        mode: string;
    }[];
    industries: string[];
};

export type PersonalInformationSkill = {
    name: string;
    aliases: string[];
    category: string;
    level: string;
    years: number;
    last_used: string;
    primary: boolean;
};

export type PersonalInformationExperience = {
    from: Date;
    to?: Date;
    role: string;
    company: string;
    summary: string;
    tags: string[];
};

export type PersonalInformationEducation = {
    degree: string;
    field: string;
    institution: string;
    graduation_year: number;
};

export type PersonalInformationCertification = {
    name: string;
    issued: Date;
    expires: Date | null;
};

export type PersonalInformationLanguageSpoken = {
    language: string;
    level: string;
};

export type PersonalInformationExclusions = {
    avoid_roles: string[];
    avoid_technologies: string[];
    avoid_industries: string[];
    avoid_companies: string[];
};

export type PersonalInformationMotivation = {
    topic: string;
    description: string;
    reason_lite: string;
};

export type PersonalInformationCareerGoal = PersonalInformationMotivation;

export type PersonalInformation = {
    contact: PersonalInformationContact,
    eligibility: PersonalInformationEligibility,
    constraints: PersonalInformationConstraints,
    preferences: PersonalInformationPreferences,
    skills: PersonalInformationSkill[],
    experience: PersonalInformationExperience[],
    education: PersonalInformationEducation[],
    certifications: PersonalInformationCertification[],
    languages_spoken: PersonalInformationLanguageSpoken[],
    exclusions: PersonalInformationExclusions,
    motivations: PersonalInformationMotivation[],
    career_goals: PersonalInformationCareerGoal[];
};

export type AgentType = 'filter' | 'writer' | 'evaluator';

export type PromptDocument = {
    _id: ObjectId;
    agentType: AgentType;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    prompt: string;
};

export type AgentRunRetryOptions = {
    retries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitterRatio?: number;
    retryOn?: (info: {
        status: number | null;
        error: unknown;
        attempt: number;
    }) => boolean;
    onRetry?: (info: {
        attempt: number;
        delayMs: number;
        reason: string;
    }) => void;
    onRequestTooLarge?: () => Promise;
};

export type FilterAgentResult = {
    jobs: Job[];
    rejects: Job[];
    errors: Job[];
};

export type JobWithNewFlag = Job & { new: boolean };
