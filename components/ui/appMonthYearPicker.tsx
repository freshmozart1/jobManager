'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatMonthYear, makeUtcMonthYear, parseMonthYear } from "@/lib/utils";

const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export type AppMonthYearPickerProps = {
    id?: string;
    name?: string;
    label?: string;
    value?: Date;
    onChange: (next: Date | undefined) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    allowClear?: boolean;
    error?: string;
    description?: string;
    className?: string;
};

export default function AppMonthYearPicker({
    id,
    name,
    label,
    value,
    onChange,
    required,
    disabled,
    placeholder = "YYYY-MM",
    allowClear,
    error,
    description,
    className,
}: AppMonthYearPickerProps) {
    const [open, setOpen] = useState(false);
    const [manualValue, setManualValue] = useState<string>("");
    const [inputError, setInputError] = useState<string | null>(null);

    const formatted = useMemo(() => formatMonthYear(value), [value]);

    const trimmedManualValue = manualValue.trim();
    const showMonthPlaceholder = /^\d{4}$/.test(trimmedManualValue);

    const resolveYear = useCallback(() => {
        const match = trimmedManualValue.match(/^(\d{4})/);
        if (match) {
            return Number(match[1]);
        }
        if (value) {
            return value.getUTCFullYear();
        }
        return new Date().getUTCFullYear();
    }, [trimmedManualValue, value]);

    const activeYear = useMemo(() => resolveYear(), [resolveYear]);

    useEffect(() => {
        if (!open) return;
        const fallback = value ? formatMonthYear(value) : String(new Date().getUTCFullYear());
        setManualValue(fallback);
        setInputError(null);
    }, [open, value]);

    const handleMonthSelect = useCallback(
        (monthIndex: number) => {
            const year = resolveYear();
            const nextDate = makeUtcMonthYear(year, monthIndex);
            setManualValue(formatMonthYear(nextDate));
            setInputError(null);
            onChange(nextDate);
            setOpen(false);
        },
        [resolveYear, onChange]
    );

    const handleManualCommit = useCallback(
        (raw: string) => {
            const trimmed = raw.trim();
            if (trimmed.length === 0) {
                if (allowClear) {
                    setManualValue("");
                    setInputError(null);
                    onChange(undefined);
                } else {
                    const fallback = formatted || String(resolveYear());
                    setManualValue(fallback);
                }
                return;
            }
            // Accept either YYYY (year only, keep open) or YYYY-MM (commit and close)
            if (/^\d{4}$/.test(trimmed)) {
                setInputError(null);
                setManualValue(trimmed);
                return;
            }
            const parsed = parseMonthYear(trimmed);
            if (!parsed) {
                setInputError("Use YYYY or YYYY-MM.");
                return;
            }
            setInputError(null);
            setManualValue(formatMonthYear(parsed));
            onChange(parsed);
            setOpen(false);
        },
        [allowClear, formatted, onChange, resolveYear]
    );

    const handlePopoverOpen = useCallback(
        (next: boolean) => {
            if (disabled) return;
            setOpen(next);
        },
        [disabled]
    );

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
                                "w-full",
                                "justify-start text-left font-normal",
                                !formatted && "text-muted-foreground"
                            )}
                            disabled={disabled}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatted || placeholder}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="start">
                        <div className="space-y-3">
                            <div className="relative">
                                <Input
                                    id={`${id ?? name ?? 'month-year'}-manual-input`}
                                    value={manualValue}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setManualValue(nextValue);
                                        setInputError(null);
                                    }}
                                    placeholder="YYYY or YYYY-MM"
                                    onBlur={(event) => handleManualCommit(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            handleManualCommit((event.target as HTMLInputElement).value);
                                        }
                                    }}
                                    className="pr-12"
                                />
                                {showMonthPlaceholder && (
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono">
                                        <span className="invisible">{trimmedManualValue}</span>
                                        <span className="text-muted-foreground">-MM</span>
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {MONTH_LABELS.map((label, monthIndex) => {
                                    const selected = value ? (value.getUTCFullYear() === activeYear && value.getUTCMonth() === monthIndex) : false;
                                    return (
                                        <Button
                                            key={label}
                                            type="button"
                                            variant={selected ? "default" : "outline"}
                                            className="justify-center"
                                            onClick={() => handleMonthSelect(monthIndex)}
                                        >
                                            {label}
                                        </Button>
                                    );
                                })}
                            </div>
                            {inputError && <p className="text-sm text-destructive" aria-live="polite">{inputError}</p>}
                            {allowClear && (
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setManualValue("");
                                            setInputError(null);
                                            onChange(undefined);
                                            setOpen(false);
                                        }}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-destructive" aria-live="polite">{error}</p>}
        </div>
    );
}
