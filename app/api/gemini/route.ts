import { storeVideoInPinecone } from "@/app/actions/storeVideo";
import { embedText } from "@/lib/embedding";
import { index } from "@/lib/pinecone";
import CHAT_PROMPT from "@/Prompts/chat-prompt";
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

    // Store video if not already stored (with error handling)
    const storageResult: APIResponse = await storeVideoInPinecone(videoId);
    if (!storageResult.success && storageResult.message !== "Video already stored") {
      console.error("Storage error:", storageResult.message);
      return NextResponse.json(
        { error: "Failed to process video" },
        { status: 500 }
      );
    }

    // Get relevant context from Pinecone
    const userVector = await embedText(text, "QUERY");
    const queryRes = await index
      .namespace(videoId)
      .query({
        vector: userVector,
        topK: 5,
        includeMetadata: true,
      });

    const videoContext = queryRes.matches
      ?.map(m => m.metadata?.chunk)
      .filter(Boolean) // Remove undefined values
      .join("\n\n") || "";

    // Construct the prompt more cleanly

    console.log(videoContext);
    const promptParts = [
      CHAT_PROMPT,
      `---------------`,
      `videoId = ${videoId}`,
      `------------------`,
      `videoSubtitles = ${videoContext}`,
      `----------------------`,
      `context = ${context}`,
      `-------------------`,
      `question = ${text}`
    ].join('\n');

    // Stream the response
    const streamResult = await model.generateContentStream(promptParts);
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