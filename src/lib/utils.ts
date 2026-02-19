import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function getInitials(name: string | null): string {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function getVideoEmbedUrl(url: string, type: string): string {
    if (!url) return "";

    if (type === "google_drive") {
        // Check if it's already an embed URL
        if (url.includes("/preview")) return url;

        // Convert Google Drive share URL to embed URL
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
    }

    if (type === "youtube") {
        if (url.includes("embed/")) return url;

        const videoIdMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
        );
        if (videoIdMatch) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}?rel=0&modestbranding=1`;
        }
    }

    if (type === "github") {
        // If raw, leave as is. If blob, change to raw.
        // But for video tag src, we just need the direct link.
        return url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }

    return url;
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
        case "beginner":
            return "badge-beginner";
        case "intermediate":
            return "badge-intermediate";
        case "advanced":
            return "badge-advanced";
        default:
            return "badge-beginner";
    }
}

export function truncate(str: string, length: number): string {
    if (!str) return "";
    return str.length > length ? str.slice(0, length) + "..." : str;
}
