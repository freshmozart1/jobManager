'use client';

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AppSearch() {
    const router = useRouter();
    const handleClick = () => {
        router.push("/search");
    }

    return <Search className="cursor-pointer" onClick={handleClick} />;
}