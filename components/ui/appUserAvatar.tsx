"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AppUserAvatar() {
    const router = useRouter()

    const handleClick = () => {
        router.push("/personal")
    }

    return (
        <Avatar onClick={handleClick} className="cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    )
}
