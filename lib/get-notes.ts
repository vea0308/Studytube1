import { supabase } from "./supabase-config"

export interface Note {
    id: string
    videoId: string
    timestamp: string
    timestampSeconds: number
    image: string
    description: string
    createdAt: string
}

export async function getNotesByUserAndVideo(userEmail: string, videoId: string): Promise<Note[] | null> {
    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userEmail)
        .eq("videoId", videoId)
        .order("timestampSeconds", { ascending: true });

    if (error) {
        console.error("Error fetching notes:", error.message);
        return null;
    }

    return data as Note[];
}