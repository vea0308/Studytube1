import { storeVideoInPinecone } from "@/app/actions/storeVideo";
import { embedText } from "@/lib/embedding";
import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
import { index } from "@/lib/pinecone";
import ChatPrompt from "@/Prompts/chat-prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

// Type definitions for better type safety
type RequestData = {
  text: string;
  videoId: string;
  context?: string;
};

type APIResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Check if API key is available
    if (!process.env.GOOGLE_GEMINI_API || process.env.GOOGLE_GEMINI_API === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: "Google Gemini API key is not configured. Please add GOOGLE_GEMINI_API to your .env.local file." },
        { status: 500 }
      );
    }

    // Validate request
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is missing" },
        { status: 400 }
      );
    }

    const data: RequestData = await req.json();
    const { text, videoId, context = "" } = data;

    if (!text || !videoId) {
      return NextResponse.json(
        { error: "Missing required fields (text or videoId)" },
        { status: 400 }
      );
    }

    // // Store video if not already stored (with error handling)
    // const storageResult: APIResponse = await storeVideoInPinecone(videoId);
    // if (!storageResult.success && storageResult.message !== "Video already stored") {
    //   console.error("Storage error:", storageResult.message);
    //   return NextResponse.json(
    //     { error: "Failed to process video" },
    //     { status: 500 }
    //   );
    // }

    // Get relevant context from Pinecone using two-phase retrieval
    // const userVector = await embedText(text, "QUERY");

    // // Phase 1: Get comprehensive content from text chunks
    // const textChunkQuery = await index
    //   .namespace(videoId)
    //   .query({
    //     vector: userVector,
    //     topK: 3,
    //     includeMetadata: true,
    //     filter: { type: "text_chunk" }
    //   });

    // // Phase 2: Get precise timestamps from transcript segments
    // const timestampQuery = await index
    //   .namespace(videoId)
    //   .query({
    //     vector: userVector,
    //     topK: 10,
    //     includeMetadata: true,
    //     filter: { type: "transcript_segment" }
    //   });

    // // Extract comprehensive content for better answers
    // const comprehensiveContent = textChunkQuery.matches
    //   ?.map(match => match.metadata?.text)
    //   .filter(Boolean)
    //   .join("\n\n") || "";

    // // Extract relevant timestamps with content and format as subtitle data
    // const subtitleData = timestampQuery.matches
    //   ?.map(match => {
    //     const metadata = match.metadata;
    //     if (metadata && metadata.type === 'transcript_segment') {
    //       return {
    //         start: metadata.startTime,
    //         text: metadata.text,
    //         duration: metadata.duration || 0,
    //         formattedTime: metadata.formattedStartTime
    //       };
    //     }
    //     return null;
    //   })
    //   .filter(Boolean) || [];

    // Use the new ChatPrompt function with proper parameters
    // console.log("Subtitle data:", subtitleData);
    // console.log("User question:", text);
    const subtitleData = await getYoutubeTranscript(videoId);
    console.log("transcript ", subtitleData);

    const prompt = ChatPrompt(
      subtitleData,
      videoId,
      undefined, // referenceTimestamp 
      undefined, // referenceDescription
      "English", // language
      text,      // userQuestion
      context    // userContext
    );

    // Stream the response
    const streamResult = await model.generateContentStream(prompt);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}