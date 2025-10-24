export function corsHeaders(origin?: string) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
    const isAllowed = !!origin && allowedOrigins.includes(origin);
    // If origin not allowed, do not set ACAO header (browser will block). This is intentional tightening.
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
    if (isAllowed) headers['Access-Control-Allow-Origin'] = origin!;
    return headers;
}
