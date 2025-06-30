import { getYoutubeTranscript } from "@/lib/get-youtube-transcript";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const transcript = await getYoutubeTranscript(videoId);
    
    return NextResponse.json({ 
      success: true, 
      transcript 
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
