"use client"

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useRef, useState, KeyboardEvent } from "react";
import { Label } from "@/components/ui/label";
import { useUniqueColor } from "@/hooks/useUniqueColor";

interface BadgeInputProps {
    id?: string;
    label?: string;
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function BadgeInput({
    id,
    label,
    value: tags,
    onChange: setTags,
    placeholder = "Type and press ','",
    className,
    disabled = false
}: BadgeInputProps) {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const colors = useUniqueColor(tags.length);
    
    // Fallback color for when unique colors are not yet available
    const FALLBACK_COLOR = '#e5e7eb';
    
    // Function to determine text color based on background luminance
    const getTextColor = (backgroundColor: string): string => {
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return dark text for light backgrounds, light text for dark backgrounds
        return luminance > 0.5 ? '#374151' : '#ffffff';
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.endsWith(",")) {
            const trimmed = value.slice(0, -1).trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
            }
            setInputValue("");
        } else {
            setInputValue(value);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const handleRemove = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    return (
        <>
            {label && <Label htmlFor={id}>{label}</Label>}
            <div
                className={cn(
                    "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 mx-[3px] my-[3px] text-sm ring-offset-background",
                    "focus-within:ring-[3px] focus-within:ring-ring/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                onClick={() => !disabled && inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                    <Badge
                        key={`${tag}-${index}`}
                        variant="secondary"
                        className="flex items-center gap-1"
                        style={{
                            backgroundColor: colors[index] || FALLBACK_COLOR,
                            color: getTextColor(colors[index] || FALLBACK_COLOR),
                            borderColor: colors[index] || FALLBACK_COLOR
                        }}
                    >
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemove(tag)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleRemove(tag);
                                    }
                                }}
                                className="ml-1 text-xs font-bold hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                                aria-label={`Remove ${tag}`}
                            >
                                ✕
                            </button>
                        )}
                    </Badge>
                ))}
                <Input
                    id={id}
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className="flex-1 min-w-[120px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder={tags.length === 0 ? placeholder : ""}
                />
            </div>
        </>
    );
}