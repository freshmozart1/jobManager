"use client"

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useRef, useState, KeyboardEvent } from "react";

export default function PlaygroundPage() {
    const [tags, setTags] = useState(["apple", "banana"]);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.endsWith(",")) {
            const trimmed = value.slice(0, -1).trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags((prev) => [...prev, trimmed]);
            }
            setInputValue("");
        } else {
            setInputValue(value);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
            setTags((prev) => prev.slice(0, -1));
        }
    };

    const handleRemove = (tagToRemove: string) => {
        setTags((prev) => prev.filter((t) => t !== tagToRemove));
    };

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => handleRemove(tag)}
                        className="ml-1 text-xs font-bold"
                    >
                        ×
                    </button>
                </Badge>
            ))}

            <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Type and press ','" : ""}
                className="flex-1 min-w-[120px] border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        </div>
    );
}