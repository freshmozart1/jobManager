import z from "zod";

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

export class ParsingAfterScrapeError extends Error {
    constructor(jobsError: z.ZodError<Job[]>) {
        super('Failed to parse jobs returned by the LinkedIn jobs scraper: ' + JSON.stringify(jobsError));
        this.name = 'ParsingAfterScrapeError';
    }
}

export class NoScrapeUrlsError extends Error {
    constructor() {
        super('No scrape URLs found in the database.');
        this.name = 'NoScrapeUrlsError';
    }
}

export class NoOpenAIKeyError extends Error {
    constructor() {
        super('OPENAI_API_KEY environment variable not set');
        this.name = 'NoOpenAIKeyError';
    }
}