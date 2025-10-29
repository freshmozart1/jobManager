import { forwardRef, type ComponentRef, type ComponentPropsWithoutRef } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = forwardRef<
    ComponentRef<typeof PopoverPrimitive.Content>,
    ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
            "z-50 w-72 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
            className
        )}
        {...props}
    />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
