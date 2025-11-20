'use client';

import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AppHome() {
    const router = useRouter();
    const handleClick = () => {
        router.push("/");
    };
    return <Home className="cursor-pointer" onClick={handleClick} />;
}