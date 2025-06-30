import { storeVideoInPinecone } from "@/app/actions/storeVideo";
import { embedText } from "@/lib/embedding";
import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
import { index } from "@/lib/pinecone";
import ChatPrompt from "@/Prompts/chat-prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Type definitions for better type safety
type RequestData = {
  text: string;
  videoId: string;
  context?: string;
  provider?: string;
};

type APIResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "API key is required. Please set your API key in the settings." },
        { status: 401 }
      );
    }
    
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { error: "Valid API key is required. Please set your API key in the settings." },
        { status: 401 }
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
    const { text, videoId, context = "", provider = "gemini" } = data;

    if (!text || !videoId) {
      return NextResponse.json(
        { error: "Missing required fields (text or videoId)" },
        { status: 400 }
      );
    }

    // Get transcript data
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

    // Create stream based on provider
    let stream: ReadableStream;
    
    if (provider === "openai") {
      stream = await createOpenAIStream(apiKey, prompt);
    } else if (provider === "groq") {
      stream = await createGroqStream(apiKey, prompt);
    } else {
      // Default to Gemini
      stream = await createGeminiStream(apiKey, prompt);
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("API error:", error);
    
    // Handle specific API errors
    if (error instanceof Error) {
      // Check for API key related errors
      if (error.message.includes('API key not valid') || 
          error.message.includes('Invalid API key') ||
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('authentication')) {
        return NextResponse.json(
          { 
            error: "Invalid API key. Please check your API key in settings and make sure it's valid.",
            details: [{ message: error.message }]
          },
          { status: 401 }
        );
      }
      
      // Check for rate limiting errors
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      
      // Check for model/permission errors
      if (error.message.includes('permission') || error.message.includes('access')) {
        return NextResponse.json(
          { error: "Access denied. Please verify your API key permissions." },
          { status: 403 }
        );
      }
      
      // For other known errors, return the actual error message
      return NextResponse.json(
        { 
          error: error.message,
          details: [{ message: error.message }]
        },
        { status: 400 }
      );
    }
    
    // Fallback for unknown errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create Gemini stream
async function createGeminiStream(apiKey: string, prompt: string): Promise<ReadableStream> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    const streamResult = await model.generateContentStream(prompt);
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          console.error("Gemini stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  } catch (error) {
    // Re-throw the error so it can be handled by the main error handler
    console.error("Gemini initialization error:", error);
    throw error;
  }
}

// Helper function to create OpenAI stream
async function createOpenAIStream(apiKey: string, prompt: string): Promise<ReadableStream> {
  try {
    const openai = new OpenAI({ apiKey });
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("OpenAI stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  } catch (error) {
    // Re-throw the error so it can be handled by the main error handler
    console.error("OpenAI initialization error:", error);
    throw error;
  }
}

// Helper function to create Groq stream (using OpenAI-compatible API)
async function createGroqStream(apiKey: string, prompt: string): Promise<ReadableStream> {
  try {
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error("Groq stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  } catch (error) {
    // Re-throw the error so it can be handled by the main error handler
    console.error("Groq initialization error:", error);
    throw error;
  }
}