import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chunkText(text: string, size = 50, overlap = 10): string[] {
  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}
