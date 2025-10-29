'use client'

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const DEFAULT_MAX_LENGTH = 30

type AppCategoryComboboxProps = {
    id: string
    value: string
    options: string[]
    onChange: (value: string) => void
    error?: string
    placeholder?: string
    disabled?: boolean
    maxLength?: number
}

export function AppCategoryCombobox({
    id,
    value,
    options,
    onChange,
    error,
    placeholder = "Select or type a category",
    disabled = false,
    maxLength = DEFAULT_MAX_LENGTH,
}: AppCategoryComboboxProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState(value)

    const trimmedValue = value.trim()
    const normalizedValue = trimmedValue.toLowerCase()

    useEffect(() => {
        setSearch(value)
    }, [value])

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen) {
            const trimmed = value.trim().slice(0, maxLength)
            setSearch(trimmed)
            if (trimmed !== value) {
                onChange(trimmed)
            }
        }
    }

    const uniqueOptions = useMemo(() => {
        const seen = new Map<string, string>()
        options.forEach((option) => {
            const trimmed = option.trim()
            if (!trimmed) return
            const key = trimmed.toLowerCase()
            if (!seen.has(key)) {
                seen.set(key, trimmed)
            }
        })
        return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
    }, [options])

    const handleSelect = (nextValue: string) => {
        const limited = nextValue.slice(0, maxLength)
        setOpen(false)
        setSearch(limited)
        onChange(limited)
    }

    return (
        <div className="space-y-1">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={`${id}-list`}
                        aria-invalid={error ? true : undefined}
                        className={cn(
                            "w-full justify-between",
                            open && "border-ring ring-[3px]",
                            open && !error && "ring-ring/50",
                            !trimmedValue && "text-muted-foreground",
                            error && "border-destructive focus-visible:ring-destructive/40"
                        )}
                        disabled={disabled}
                    >
                        {trimmedValue || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Command>
                        <CommandInput
                            value={search}
                            onValueChange={(next: string) => {
                                const limited = next.slice(0, maxLength)
                                setSearch(limited)
                                onChange(limited)
                            }}
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                if (event.key === "Enter") {
                                    event.preventDefault()
                                    const next = search.trim()
                                    if (next) {
                                        handleSelect(next)
                                    } else {
                                        setOpen(false)
                                    }
                                }
                            }}
                            placeholder="Search categories"
                            disabled={disabled}
                            className="border-0"
                            aria-autocomplete="list"
                            aria-controls={`${id}-list`}
                        />
                        <CommandList id={`${id}-list`}>
                            <CommandEmpty>No categories found.</CommandEmpty>
                            <CommandGroup>
                                {uniqueOptions.map((option) => {
                                    const isSelected = option.toLowerCase() === normalizedValue
                                    return (
                                        <CommandItem
                                            key={option}
                                            value={option}
                                            onSelect={() => handleSelect(option)}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                            {option}
                                        </CommandItem>
                                    )
                                })}
                                {search.trim() && !uniqueOptions.some((option) => option.toLowerCase() === search.trim().toLowerCase()) && (
                                    <CommandItem
                                        value={search.trim()}
                                        onSelect={() => handleSelect(search.trim())}
                                        className="text-primary"
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        Create &quot;{search.trim()}&quot;
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="flex items-center justify-between">
                {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
        </div>
    )
}
