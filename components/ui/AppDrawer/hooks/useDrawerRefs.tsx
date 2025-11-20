'use client';

import { useRef } from "react";

export default function useDrawerRefs() {
    return [
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null)
    ]
}