'use client';

import { useEffect, useState } from 'react';

type AppSafeHtmlProps = {
    html: string;
    className?: string;
    allowedTags?: string[];
    allowedAttributes?: string[];
};

/**
 * Renders sanitized HTML using DOMPurify (dynamically imported).
 * Only whitelisted tags and attributes are preserved.
 */
export default function AppSafeHtml({
    html,
    className,
    allowedTags = ['div', 'section', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'span'],
    allowedAttributes = ['style', 'data-template', 'data-slot', 'data-item-id', 'class']
}: AppSafeHtmlProps) {
    const [sanitizedHtml, setSanitizedHtml] = useState('');

    useEffect(() => {
        const sanitize = async () => {
            try {
                const DOMPurify = (await import('dompurify')).default;
                const clean = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: allowedTags,
                    ALLOWED_ATTR: allowedAttributes,
                    KEEP_CONTENT: true,
                });
                setSanitizedHtml(clean);
            } catch (err) {
                console.error('Failed to sanitize HTML:', err);
                setSanitizedHtml('');
            }
        };

        sanitize();
    }, [html, allowedTags, allowedAttributes]);

    return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
