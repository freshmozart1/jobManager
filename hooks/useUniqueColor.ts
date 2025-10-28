import { useState, useEffect } from "react";

// Utility to generate a random light color in a specific hue range
const randomLightColor = (hue: number) => {
    // HSL -> RGB -> Hex
    const saturation = 70 + Math.random() * 20; // 70-90%
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

// Generate a set of unique colors
const generateColorSet = (size: number): string[] => {
    const colors: string[] = [];
    const usedColors = new Set<string>();
    
    const hues = [0, 240, 120, 60, 180, 300, 30, 210, 150, 270]; // Extended hue range
    
    let hueIndex = 0;
    let attempts = 0;
    const maxAttempts = size * 10; // Prevent infinite loops
    
    while (colors.length < size && attempts < maxAttempts) {
        const hue = hues[hueIndex % hues.length];
        const color = randomLightColor(hue);
        
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
