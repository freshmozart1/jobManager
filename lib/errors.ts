import { VALID_PERSONAL_INFORMATION_TYPES } from "./constants";

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
        super(`Invalid personal information type. Must be one of: ${VALID_PERSONAL_INFORMATION_TYPES.join(', ')}`);
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

export class JobNotFoundError extends Error {
    constructor() {
        super('Job not found');
        this.name = 'JobNotFoundError';
    }
}

export class InvalidGenerationTypesError extends Error {
    constructor() {
        super('Invalid generation types requested');
        this.name = 'InvalidGenerationTypesError';
    }
}

export class ProfileIncompleteError extends Error {
    constructor() {
        super('Personal profile is incomplete');
        this.name = 'ProfileIncompleteError';
    }
}

export class InvalidArtifactTypeError extends Error {
    constructor() {
        super('Invalid artifact type requested');
        this.name = 'InvalidArtifactTypeError';
    }
}

export class JobArtifactNotReadyError extends Error {
    constructor() {
        super('Requested artifact has not been generated yet');
        this.name = 'JobArtifactNotReadyError';
    }
}

export class InvalidAppliedAtError extends Error {
    constructor() {
        super('Invalid appliedAt timestamp');
        this.name = 'InvalidAppliedAtError';
    }
}

export class JobAlreadyAppliedError extends Error {
    constructor() {
        super('Job already marked as applied');
        this.name = 'JobAlreadyAppliedError';
    }
}

export class JobGenerationFailedError extends Error {
    constructor() {
        super('Failed to generate job artifacts');
        this.name = 'JobGenerationFailedError';
    }
}

export class MissingArtifactTypeQueryError extends Error {
    constructor() {
        super('Artifact type query parameter is required');
        this.name = 'MissingArtifactTypeQueryError';
    }
}