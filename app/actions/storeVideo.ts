import { embedText } from "@/lib/embedding";
import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
import { index } from "@/lib/pinecone";
import { chunkText } from "@/lib/utils";

export async function storeVideoInPinecone(videoId: string) {
    // First check if the video is already stored
    try {
        const existing = await index.namespace(videoId).describeIndexStats();
        if (existing.namespaces && existing.namespaces[videoId]) {
            console.log(`Video ${videoId} already exists in Pinecone`);
            return { success: false, message: "Video already stored" };
        }
    } catch (error) {
        // Namespace might not exist, which is fine - we'll proceed with storage
        console.log(`Video ${videoId} not found, proceeding with storage`);
    }

    // If we get here, the video needs to be stored
    const transcript = await getYoutubeTranscript(videoId);
    const fullText = transcript.map(t => t.text).join(" ");
    const chunks = chunkText(fullText);

    const vectors = await Promise.all(
        chunks.map(async (chunk, i) => ({
            id: `${videoId}_chunk_${i}`,
            values: await embedText(chunk, "DOC"),
            metadata: { chunk, videoId, index: i },
        }))
    );

    await index.namespace(videoId).upsert(vectors);
    return { success: true, message: "Video stored successfully" };
}