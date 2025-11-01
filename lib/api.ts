import { NextResponse } from "next/server";
import { corsHeaders } from "./cors";

type ErrorDetails = Record<string, unknown> | undefined;

export function jsonError(
    status: number,
    code: string,
    message: string,
    origin?: string | null,
    details?: ErrorDetails
) {
    const headers = corsHeaders(origin ?? undefined);
    return NextResponse.json(
        details ? { error: { code, message, details } } : { error: { code, message } },
        {
            status,
            statusText: code,
            headers
        }
    );
}
