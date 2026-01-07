'use client';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AppCollapsibleCardProps = {
    title: ReactNode;
    description?: ReactNode;
    collapsedContent?: ReactNode;
    children: ReactNode;
    collapsedHeightPx?: number;
    defaultExpanded?: boolean;
    expandLabel?: ReactNode;
    collapseLabel?: ReactNode;
    scrollIntoViewOnExpand?: boolean;
    contentClassName?: string;
    canExpand?: boolean;
};

export default function AppCollapsibleCard({
    title,
    description,
    collapsedContent,
    children,
    collapsedHeightPx = 192,
    defaultExpanded = false,
    expandLabel = 'View More',
    collapseLabel = 'View Less',
    scrollIntoViewOnExpand = false,
    contentClassName,
    canExpand = true,
}: AppCollapsibleCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const isClipMode = !collapsedContent;

    useEffect(() => {
        if (!isClipMode) return;

        const el = contentRef.current;
        if (!el) return;

        const checkOverflow = () => {
            setIsOverflowing(el.scrollHeight > collapsedHeightPx);
        };

        checkOverflow();

        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [isClipMode, collapsedHeightPx, children]);

    const handleToggle = () => {
        const wasCollapsed = !isExpanded;
        setIsExpanded(!isExpanded);
        if (wasCollapsed && scrollIntoViewOnExpand) {
            requestAnimationFrame(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    };

    const shouldShowToggle = isClipMode ? isOverflowing : (collapsedContent && canExpand);

    return (
        <Card ref={cardRef}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description}
            </CardHeader>
            <CardContent className="space-y-4">
                {isClipMode ? (
                    <>
                        <div className="relative">
                            <div
                                ref={contentRef}
                                className={cn(
                                    "overflow-hidden transition-all duration-300",
                                    // isExpanded ? "max-h-[5000px]" : `max-h-[${collapsedHeightPx}px]`,
                                    contentClassName
                                )}
                                style={
                                    !isExpanded
                                        ? { maxHeight: `${collapsedHeightPx}px` }
                                        : { maxHeight: '5000px' }
                                }
                            >
                                {children}
                            </div>
                            {!isExpanded && isOverflowing && (
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                            )}
                        </div>
                    </>
                ) : (
                    <div>{isExpanded ? children : collapsedContent}</div>
                )}
                {shouldShowToggle && (
                    <Button variant="ghost" size="sm" onClick={handleToggle} className="w-full">
                        {isExpanded ? (
                            <>
                                {collapseLabel} <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                {expandLabel} <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
