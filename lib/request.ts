export function getUserId(req: Request): string {
    const headerValue = req.headers.get('x-user-id');
    if (headerValue && headerValue.trim()) return headerValue.trim();
    return 'default';
}

export function getDatabaseName(req: Request): string | undefined {
    return req.headers.get('x-test-db') || process.env.DATABASE_NAME;
}
