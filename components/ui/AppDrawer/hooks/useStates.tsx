'use client';

import { useState } from "react";

export default function useStates(): [
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [number, React.Dispatch<React.SetStateAction<number>>],
    [boolean, React.Dispatch<React.SetStateAction<boolean>>]
] {
    return [
        useState<number>(0),
        useState<number>(0),
        useState<number>(0),
        useState<number>(-Number.MAX_VALUE),
        useState<number>(-Number.MAX_VALUE),
        useState<number>(-Number.MAX_VALUE),
        useState<boolean>(false)
    ];
}