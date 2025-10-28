export class NoApifyTokenError extends Error {
    constructor() {
        super("APIFY_TOKEN is not set in environment variables.");
        this.name = "NoApifyTokenError";
    }
}

export class NoMongoDBConnectionStringError extends Error {
    constructor() {
        super('MONGODB_CONNECTION_STRING environment variable not set');
        this.name = 'NoMongoDBConnectionStringError';
    }
}

export class NoDatabaseNameError extends Error {
    constructor() {
        super('DATABASE_NAME environment variable not set');
        this.name = 'NoDatabaseNameError';
    }
}

export class NoActorQueryParameterError extends Error {
    constructor() {
        super('Actor query parameter \'a\' is required');
        this.name = 'NoActorQueryParameterError';
    }
}

export class InvalidAgentTypeQueryParameterError extends Error {
    constructor() {
        super(`Invalid agent type query parameter`);
        this.name = 'InvalidAgentTypeQueryParameterError';
    }
}

export class NoScrapeUrlsError extends Error {
    constructor() {
        super('No scrape URLs found in the database.');
        this.name = 'NoScrapeUrlsError';
    }
}

export class NoBaseUrlError extends Error {
    constructor() {
        super('NEXT_PUBLIC_BASE_URL environment variable not set');
        this.name = 'NoBaseUrlError';
    }
}

export class NoOpenAIKeyError extends Error {
    constructor() {
        super('OPENAI_API_KEY environment variable not set');
        this.name = 'NoOpenAIKeyError';
    }
}

export class MissingSortOrOrderQueryParameterError extends Error {
    constructor() {
        super('Both sort and order query parameters must be provided together');
        this.name = 'MissingSortOrOrderQueryParameterError';
    }
}

export class MissingPromptIdInRequestBodyError extends Error {
    constructor() {
        super('Missing promptId in request body');
        this.name = 'MissingPromptIdInRequestBodyError';
    }
}

export class NoPersonalInformationContactError extends Error {
    constructor() {
        super('No contact information found in personalInformation collection');
        this.name = 'NoPersonalInformationContactError';
    }
}

export class NoPersonalInformationEligibilityError extends Error {
    constructor() {
        super('No eligibility information found in personalInformation collection');
        this.name = 'NoPersonalInformationEligibilityError';
    }
}

export class NoPersonalInformationConstraintsError extends Error {
    constructor() {
        super('No constraints information found in personalInformation collection');
        this.name = 'NoPersonalInformationConstraintsError';
    }
}

export class NoPersonalInformationPreferencesError extends Error {
    constructor() {
        super('No preferences information found in personalInformation collection');
        this.name = 'NoPersonalInformationPreferencesError';
    }
}

export class NoPersonalInformationSkillsError extends Error {
    constructor() {
        super('No skills information found in personalInformation collection');
        this.name = 'NoPersonalInformationSkillsError';
    }
}

export class NoPersonalInformationExperienceError extends Error {
    constructor() {
        super('No experience information found in personalInformation collection');
        this.name = 'NoPersonalInformationExperienceError';
    }
}

export class NoPersonalInformationEducationError extends Error {
    constructor() {
        super('No education information found in personalInformation collection');
        this.name = 'NoPersonalInformationEducationError';
    }
}

export class NoPersonalInformationCertificationsError extends Error {
    constructor() {
        super('No certifications information found in personalInformation collection');
        this.name = 'NoPersonalInformationCertificationsError';
    }
}

export class NoPersonalInformationLanguageSpokenError extends Error {
    constructor() {
        super('No languages spoken information found in personalInformation collection');
        this.name = 'NoPersonalInformationLanguageSpokenError';
    }
}

export class NoPersonalInformationExclusionsError extends Error {
    constructor() {
        super('No exclusions information found in personalInformation collection');
        this.name = 'NoPersonalInformationExclusionsError';
    }
}

export class NoPersonalInformationMotivationsError extends Error {
    constructor() {
        super('No motivations information found in personalInformation collection');
        this.name = 'NoPersonalInformationMotivationsError';
    }
}

export class NoPersonalInformationCareerGoalsError extends Error {
    constructor() {
        super('No career goals information found in personalInformation collection');
        this.name = 'NoPersonalInformationCareerGoalsError';
    }
}

export class PromptNotFoundError extends Error {
    constructor() {
        super('Prompt not found for the specified agent type');
        this.name = 'PromptNotFoundError';
    }
}

export class InvalidPersonalInformationTypeError extends Error {
    constructor() {
        super('Invalid personal information type. Must be one of: contact, eligibility, constraints, preferences, skills, experience, education, certifications, languages_spoken, exclusions, motivations, career_goals');
        this.name = 'InvalidPersonalInformationTypeError';
    }
}

export class MissingPersonalInformationFieldsError extends Error {
    constructor() {
        super('Missing required fields: type and value are required');
        this.name = 'MissingPersonalInformationFieldsError';
    }
}

export class PersonalInformationDocumentNotFoundError extends Error {
    constructor() {
        super('Personal information document not found');
        this.name = 'PersonalInformationDocumentNotFoundError';
    }
}