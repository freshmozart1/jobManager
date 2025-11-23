'use client';

import { useState } from "react";

export default function useStates(): [
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [string | null, React.Dispatch<React.SetStateAction<string | null>>]
] {
    return [
        useState<number>(-Number.MAX_VALUE),
        useState<number>(-Number.MAX_VALUE),
        useState<number>(-Number.MAX_VALUE),
        useState<string | null>(null)
    ];
}