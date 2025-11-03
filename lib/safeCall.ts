import { sleep } from "@/lib/utils";
import { AgentRunRetryOptions } from "@/types";
import OpenAI from "openai";

/**
 * Deterministic agent execution (policy notes)
 *
 * - Always run with temperature=0 (or the most deterministic setting exposed by the library).
 * - Use an explicitly versioned prompt (PromptDocument.updatedAt acts as a watermark) to guarantee reproducibility.
 * - Capture a trace for each run (runId, promptVersion, inputs/outputs, timestamps) using utilities from lib/utils.
 * - Validate agent output strictly with zod before use; reject or retry on schema mismatch.
 * - Respect backoff on 429/5xx and parse Retry-After headers when available.
 */
function extractSuggestedDelayMs(err: unknown): number | null {
    if (err && typeof err === 'object') {
        const errorObj = err as {
            response?: { headers?: Record<string, string | number | undefined>; };
            message?: unknown;
        };
        const headers = errorObj.response?.headers;
        if (headers) {
            console.log('Error headers:', headers);
            const retryAfterValue = headers['retry-after'] ?? headers['Retry-After'];
            if (retryAfterValue !== undefined) {
                const asNumber = typeof retryAfterValue === 'number' ? retryAfterValue : Number(retryAfterValue);
                if (!Number.isNaN(asNumber)) {
                    return asNumber * 1000; //if header.retry-after is in seconds, return milliseconds
                } else if (typeof retryAfterValue === 'string') {
                    const dateMs = Date.parse(retryAfterValue);
                    if (!Number.isNaN(dateMs)) {
                        const delta = dateMs - Date.now();
                        if (delta > 0) return delta; //if date is in the future, return milliseconds until that date
                    }
                }
            }
        }
        if (typeof errorObj.message === 'string') {
            const retrymatch = errorObj.message.match(/try again in (?:(\d{1,4})ms|(\d+)(?:\.(\d+))?s)/i);
            if (retrymatch) {
                const [, ms, s] = retrymatch;
                if (ms) return Number(ms);
                if (s) return Number(s) * 1000;
            }
        }
    }
    return null;
}
// Simplified retry helper (keeps behavior, trims logging & branching)
export async function safeCall<T>(ctx: string, fn: () => Promise<T>, opts: AgentRunRetryOptions = {}): Promise<T> {
    const {
        retries = 5, baseDelayMs = 600, maxDelayMs = 8000, jitterRatio = 0.4, retryOn = ({ status }) => status === 429 || status === null || (status >= 500 && status < 600), onRequestTooLarge
    } = opts;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try { return await fn(); } catch (e) {
            let status: number | null = null, msg = '';
            if (e instanceof OpenAI.APIError) {
                status = e.status ?? null; msg = e.message;
                if (/request too large/i.test(msg)) return onRequestTooLarge ? onRequestTooLarge() : Promise.reject(e);
            } else if (e instanceof Error) msg = e.message;
            if (attempt === retries || !retryOn({ status, error: e, attempt })) return Promise.reject(e);
            let delay = extractSuggestedDelayMs(e) ?? Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
            const jitter = delay * jitterRatio;
            delay += Math.round((Math.random() * 2 - 1) * jitter);
            await sleep(Math.max(0, delay));
        }
    }
    throw new Error(`safeCall: exhausted retries for ${ctx}`);
}
