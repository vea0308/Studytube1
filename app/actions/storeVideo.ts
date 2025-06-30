import { index } from "@/lib/pinecone";
import { embedText } from "@/lib/embedding";
import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
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
    console.log("transcript ", transcript);
    
    // Helper function to format timestamps
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Create full text from transcript for better context
    const fullText = transcript.map((segment: any) => segment.text).join(' ');
    
    // Create text chunks for comprehensive answers (every 500 words or 3 minutes)
    const textChunks = chunkText(fullText, 500);
    const chunkDuration = 180; // 3 minutes per chunk
    
    const allVectors = [];

    // 1. Store full text chunks for comprehensive answers
    for (let i = 0; i < textChunks.length; i++) {
        const chunkStartTime = i * chunkDuration;
        const chunkEndTime = Math.min((i + 1) * chunkDuration, transcript[transcript.length - 1] ? parseFloat(transcript[transcript.length - 1].start) + parseFloat(transcript[transcript.length - 1].duration) : chunkDuration);
        
        try {
            const embedding = await embedText(textChunks[i], "DOC");
            allVectors.push({
                id: `${videoId}_chunk_${i}`,
                values: embedding,
                metadata: {
                    text: textChunks[i],
                    videoId,
                    startTime: chunkStartTime,
                    endTime: chunkEndTime,
                    formattedStartTime: formatTime(chunkStartTime),
                    formattedEndTime: formatTime(chunkEndTime),
                    chunkIndex: i,
                    type: "text_chunk"
                }
            });
        } catch (error) {
            console.error(`Failed to embed text chunk ${i}:`, error);
            // Continue with other chunks
        }
    }

    // 2. Store individual transcript segments for precise timestamps
    for (let i = 0; i < transcript.length; i++) {
        const segment = transcript[i];
        const startTime = parseFloat(segment.start);
        const duration = parseFloat(segment.duration);
        const endTime = startTime + duration;

        try {
            const embedding = await embedText(segment.text, "DOC");
            allVectors.push({
                id: `${videoId}_segment_${i}`,
                values: embedding,
                metadata: { 
                    text: segment.text,
                    videoId,
                    startTime,
                    endTime,
                    duration,
                    formattedStartTime: formatTime(startTime),
                    formattedEndTime: formatTime(endTime),
                    segmentIndex: i,
                    type: "transcript_segment"
                },
            });
        } catch (error) {
            console.error(`Failed to embed transcript segment ${i}:`, error);
            // Continue with other segments
        }
    }

    // Store all vectors in Pinecone
    if (allVectors.length > 0) {
        await index.namespace(videoId).upsert(allVectors);
        console.log(`Stored ${allVectors.length} vectors for video ${videoId}`);
    } else {
        console.log(`No vectors to store for video ${videoId} - all embeddings failed`);
        return { success: false, message: "Failed to generate embeddings for video content" };
    }
    
    return { success: true, message: "Video stored successfully with both text chunks and transcript segments" };
}