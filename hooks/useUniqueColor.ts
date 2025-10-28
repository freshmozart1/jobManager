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

// Shared color pool
let colorSet: string[] = [];

// Initialize the color set if empty
const initColorSet = () => {
    if (colorSet.length === 0) {
        const hues = {
            red: 0,
            blue: 240,
            green: 120,
            yellow: 60,
        };

        for (const hue of Object.values(hues)) {
            for (let i = 0; i < 5; i++) {
                colorSet.push(randomLightColor(hue));
            }
        }
        // Shuffle the array
        colorSet = colorSet.sort(() => Math.random() - 0.5);
    }
};

// Hook to get a unique color
export const useUniqueColor = () => { //todo #36
    const [color, setColor] = useState<string | null>(null);

    useEffect(() => {
        initColorSet();
        if (colorSet.length > 0) {
            const nextColor = colorSet.shift(); // Remove from pool
            setColor(nextColor!);
        } else {
            setColor("#ffffff"); // fallback if colors exhausted
        }
    }, []);

    return color!;
};
