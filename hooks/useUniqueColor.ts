import { useState, useEffect } from "react";

// Utility to generate a random light color in a specific hue range
const randomColor = (hue: number) => {
    // HSL -> RGB -> Hex
    const saturation = 80 + Math.random() * 20; // 80-100%
    const lightness = 70 + Math.random() * 20; // 70-90% for light colors
    const h = hue;
    const s = saturation / 100;
    const l = lightness / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };

    return `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4))
        .toString(16)
        .slice(1)}`;
};

// Added: pure Fisher-Yates shuffle
const shuffle = <T,>(source: readonly T[]): T[] => {
    const arr = [...source];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Generate a set of unique colors
const createHuePalette = (length: number): number[] => {
    const size = Math.max(1, Math.floor(length));
    const step = 360 / size;
    const hues = Array.from({ length: size }, (_, index) =>
        Math.floor((index * step) % 360)
    );

    return shuffle(hues);
};

const generateColorSet = (size: number): string[] => {
    const colors: string[] = [];
    const usedColors = new Set<string>();

    const shuffledHues = createHuePalette(Math.max(size, 64));

    let hueIndex = 0;
    let attempts = 0;
    const maxAttempts = size * 10; // Prevent infinite loops

    while (colors.length < size && attempts < maxAttempts) {
        const hue = shuffledHues[hueIndex % shuffledHues.length];
        const color = randomColor(hue);

        if (!usedColors.has(color)) {
            colors.push(color);
            usedColors.add(color);
        }

        hueIndex++;
        attempts++;
    }

    // If we couldn't generate enough unique colors, fill with fallback colors
    while (colors.length < size) {
        const fallbackColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        if (!usedColors.has(fallbackColor)) {
            colors.push(fallbackColor);
            usedColors.add(fallbackColor);
        }
    }

    return colors;
};

// Hook to get an array of unique colors
export const useUniqueColor = (size: number = 1): string[] => {
    const [colors, setColors] = useState<string[]>([]);

    useEffect(() => {
        const uniqueColors = generateColorSet(size);
        setColors(uniqueColors);
    }, [size]);

    return colors;
};
