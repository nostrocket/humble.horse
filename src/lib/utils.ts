import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { nip19 } from "nostr-tools";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
};

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;

    const scaleConversion = (
        valueA: number,
        scaleA: [number, number],
        scaleB: [number, number]
    ) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        const valueB = percentage * (maxB - minB) + minB;

        return valueB;
    };

    const styleToString = (
        style: Record<string, number | string | undefined>
    ): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, "");
    };

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            });
        },
        easing: cubicOut
    };
};

const hexPubkeyValidator = /^\w{64}$/;

export function npubToHex(npub: string): string {
  let hex: string = npub;
  if (hex.startsWith("npub1")) {
    hex = nip19.decode(npub).data.toString();
    //get hex pubkey from npub, or return error
  }
  if (!hexPubkeyValidator.test(hex)) {
    throw new Error("invalid pubkey");
  }
  return hex;
}

export function formatTimeAgo(timestamp: number): string {
const currentTime = Date.now();
const secondsAgo = Math.floor((currentTime - timestamp) / 1000);

if (secondsAgo < 60) {
return `${secondsAgo} seconds ago`;
} else if (secondsAgo < 3600) {
const minutesAgo = Math.floor(secondsAgo / 60);
return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
} else if (secondsAgo < 86400) {
const hoursAgo = Math.floor(secondsAgo / 3600);
return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
} else if (secondsAgo < 604800) {
const daysAgo = Math.floor(secondsAgo / 86400);
return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
} else {
const formattedDate = new Date(timestamp).toLocaleString('en-US', {
weekday: 'short',
year: 'numeric',
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit',
hour12: true
});
return formattedDate;
}
}

