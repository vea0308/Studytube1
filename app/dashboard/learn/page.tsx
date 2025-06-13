"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { VideoSection } from "@/components/video-section"
import { AIAssistant } from "@/components/ai-assistant"
import { Header } from "@/components/header"
import type { Screenshot } from "@/components/video-section"
import { useUser } from "@civic/auth-web3/react"
import { getNotesByUserAndVideo } from "@/lib/get-notes"

export default function LearnPage() {
  const [showSettings, setShowSettings] = useState(false)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notesLoading,setNotesLoading]=useState(false);
  const searchParams = useSearchParams()
  const user = useUser();

  async function getAllScreenshots(user: any, videoId: string) {
    try {
      setNotesLoading(true);
      const data = await getNotesByUserAndVideo(user.user?.email, videoId)
      if (data) {
        const screenshots = data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          description: item.description,
          timeInSeconds: parseFloat(item.timestampSeconds),
          capturedAt: new Date(item.createdAt),
          imageUrl: item.image, 
        }));
        setScreenshots(screenshots);
      }
    } catch (error) {
      console.log("error ",error);
    }finally{
      setNotesLoading(false);
    }

  }

  useEffect(() => {
    // Get video ID from URL
    const videoParam = searchParams.get("v")
    if (videoParam) {
      setVideoId(videoParam)
      getAllScreenshots(user, videoParam);
    } else {
      setVideoId("dpw9EHDh2bM")
    }
    setIsLoading(false)
  }, [searchParams,user])

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your learning session...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header showSettings={showSettings} setShowSettings={setShowSettings} />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Half - Video/Notes */}
        <div className="flex-1 lg:w-1/2 overflow-hidden">
          <VideoSection screenshots={screenshots} setScreenshots={setScreenshots} videoId={videoId || "dpw9EHDh2bM"} notesLoading={notesLoading} />
        </div>

        {/* Right Half - AI Assistant */}
        <div className="flex-1 lg:w-1/2 border-l border-border overflow-hidden">
          <AIAssistant setShowSettings={setShowSettings} screenshots={screenshots} videoId={videoId || "dpw9EHDh2bM"} />
        </div>
      </div>
    </div>
  )
}
