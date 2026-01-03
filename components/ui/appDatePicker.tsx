'use client'

import { useCallback, useState } from "react";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AppDatePickerProps = {
    id?: string;
    name?: string;
    label?: string;
    value?: Date;
    onChange: (next: Date | undefined) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
    description?: string;
    className?: string;
};

export default function AppDatePicker({
    id,
    name,
    label,
    value,
    onChange,
    required,
    disabled,
    placeholder = "Select a date",
    error,
    description,
    className,
}: AppDatePickerProps) {
    const [open, setOpen] = useState(false);

    const handleDateSelect = useCallback(
        (date: Date | undefined) => {
            onChange(date);
            setOpen(false);
        },
        [onChange]
    );

    const handleClear = useCallback(() => {
        onChange(undefined);
        setOpen(false);
    }, [onChange]);

    const handlePopoverOpen = useCallback(
        (next: boolean) => {
            if (disabled) return;
            setOpen(next);
        },
        [disabled]
    );

    const formatted = value?.toLocaleDateString();

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <Label htmlFor={id} className={cn(required && "after:ml-0.5 after:text-destructive after:content-['*']")}>{label}</Label>
            )}
            <div className="flex items-center gap-2">
                <Popover open={open} onOpenChange={handlePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={id}
                            name={name}
                            variant="outline"
                            className={cn(
                                "justify-start text-left font-normal",
                                !formatted && "text-muted-foreground"
                            )}
                            disabled={disabled}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatted || placeholder}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={value}
                            onSelect={handleDateSelect}
                            disabled={{ after: new Date() }}
                            initialFocus
                        />
                        {value && (
                            <div className="border-t p-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleClear}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-destructive" aria-live="polite">{error}</p>}
        </div>
    );
}
