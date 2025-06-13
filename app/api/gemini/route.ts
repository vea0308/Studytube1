import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
import CHAT_PROMPT from "@/Prompts/chat-prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
  // tools: [
  //   {
  //     codeExecution: {},
  //   },
  // ],
});

/**
 * API route for streaming content from Gemini AI model.
 */


/**
 * Fetches the transcript for a YouTube video.
 * @param videoId - The YouTube video ID (e.g., "I9r97uKBjuA")
 * @returns A promise that resolves to the transcript array
 */

export async function POST(req: Request): Promise<Response> {
  const data = await req.json();
  const text = data.text;
  const videoId = data.videoId;
  const context = data.context;

  const videoSubtitles = await getYoutubeTranscript(videoId)
  const videoTextOnly = videoSubtitles.map(subtitle => subtitle.text).join(" ");

  const prompt = `${CHAT_PROMPT} 
  ---------------
  videoId = ${videoId}
  ------------------
  videoSubtitles = ${videoTextOnly}
  ----------------------
  context = ${context}
  -------------------
  question = ${text}
  `


  // Get a streaming response
  const streamResult = await model.generateContentStream(prompt);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamResult.stream) {
        controller.enqueue(encoder.encode(chunk.text()));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
