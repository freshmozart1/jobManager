import { forwardRef, type ComponentRef, type ComponentPropsWithoutRef, type HTMLAttributes } from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"

const Command = forwardRef<
    ComponentRef<typeof CommandPrimitive>,
    ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
    <CommandPrimitive
        ref={ref}
        className={cn(
            "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md border",
            className
        )}
        {...props}
    />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = forwardRef<
    ComponentRef<typeof CommandPrimitive.Input>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Input
        ref={ref}
        className={cn(
            "border-b border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground",
            "focus-visible:ring-0",
            className
        )}
        {...props}
    />
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = forwardRef<
    ComponentRef<typeof CommandPrimitive.List>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.List
        ref={ref}
        className={cn("max-h-56 overflow-y-auto overflow-x-hidden text-sm", className)}
        {...props}
    />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = forwardRef<
    ComponentRef<typeof CommandPrimitive.Empty>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Empty
        ref={ref}
        className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)}
        {...props}
    />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = forwardRef<
    ComponentRef<typeof CommandPrimitive.Group>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Group
        ref={ref}
        className={cn("px-1 py-1.5 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className)}
        {...props}
    />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandItem = forwardRef<
    ComponentRef<typeof CommandPrimitive.Item>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
            "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
            "data-[selected=true]:bg-muted data-[state=checked]:bg-muted",
            className
        )}
        {...props}
    />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandSeparator = forwardRef<
    ComponentRef<typeof CommandPrimitive.Separator>,
    ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 h-px bg-border", className)}
        {...props}
    />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
            {...props}
        />
    )
}
CommandShortcut.displayName = "CommandShortcut"

export {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
}
