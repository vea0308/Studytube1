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
  const [notesLoading, setNotesLoading] = useState(false)
  const [playerInstance, setPlayerInstance] = useState<any>(null)
  const [currentSeekTime, setCurrentSeekTime] = useState<number>(0)
  const [transcript, setTranscript] = useState<any[] | null>(null)
  const [transcriptFetched, setTranscriptFetched] = useState(false)
  const searchParams = useSearchParams()
  const user = useUser()

  async function fetchTranscript(videoId: string) {
    // Prevent multiple fetches for the same video
    if (transcriptFetched) return
    
    try {
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setTranscript(data.transcript)
      } else {
        console.error('Failed to fetch transcript')
        setTranscript([]) // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
      setTranscript([]) // Set empty array as fallback
    } finally {
      setTranscriptFetched(true)
    }
  }

  async function getAllScreenshots(user: any, videoId: string) {
    if (!user?.user?.email || !videoId) {
      console.log('Missing user email or videoId for notes fetch')
      setNotesLoading(false)
      return
    }

    try {
      setNotesLoading(true);
      console.log(`Fetching notes for user: ${user.user.email}, video: ${videoId}`)
      const data = await getNotesByUserAndVideo(user.user.email, videoId)
      if (data && Array.isArray(data)) {
        const screenshots = data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          description: item.description,
          timeInSeconds: parseFloat(item.timestampSeconds) || 0,
          capturedAt: new Date(item.createdAt),
          imageUrl: item.image || `/placeholder.svg?height=120&width=200&text=Note`, 
        }));
        console.log(`Loaded ${screenshots.length} notes`)
        setScreenshots(screenshots);
      } else {
        console.log('No notes found, setting empty array')
        setScreenshots([])
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      setScreenshots([]) // Reset to empty array on error
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => {
    // Get video ID from URL
    const videoParam = searchParams.get("v")
    const newVideoId = videoParam || "dpw9EHDh2bM"
    
    // Check if video changed
    const videoChanged = newVideoId !== videoId
    
    if (videoChanged) {
      console.log(`Video changed from ${videoId} to ${newVideoId}`)
      setVideoId(newVideoId)
      
      // Reset transcript state for new video
      setTranscript(null)
      setTranscriptFetched(false)
      
      // Reset notes for new video
      setScreenshots([])
    }
    
    // Fetch transcript if not fetched yet or video changed
    if (!transcriptFetched || videoChanged) {
      fetchTranscript(newVideoId)
    }
    
    // Fetch notes if user is available and video is available
    if (user?.user?.email && newVideoId && (videoChanged || screenshots.length === 0)) {
      console.log('Fetching notes for user and video')
      getAllScreenshots(user, newVideoId)
    } else if (!user?.user?.email) {
      console.log('No user email available, skipping notes fetch')
      setNotesLoading(false)
    }
    
    setIsLoading(false)
  }, [searchParams, user?.user?.email, videoId]) // Include user.user.email as dependency

  // Handle timestamp clicks from AI assistant
  const handleTimestampClick = (timeInSeconds: number) => {
    console.log(`Jumping to timestamp: ${timeInSeconds}s`)
    
    // Update the seekTime prop to trigger video seeking
    setCurrentSeekTime(timeInSeconds)
    
    // Optional: Update URL for better UX (without redirecting)
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('t', `${timeInSeconds}s`)
    window.history.replaceState({}, '', currentUrl.toString()) // Use replaceState instead of pushState
  }

  if (isLoading || !transcriptFetched) {
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
          <VideoSection 
            screenshots={screenshots} 
            setScreenshots={setScreenshots} 
            videoId={videoId || "dpw9EHDh2bM"} 
            notesLoading={notesLoading}
            onPlayerReady={setPlayerInstance}
            seekToTime={currentSeekTime}
          />
        </div>

        {/* Right Half - AI Assistant */}
        <div className="flex-1 lg:w-1/2 border-l border-border overflow-hidden">
          <AIAssistant 
            setShowSettings={setShowSettings} 
            screenshots={screenshots} 
            videoId={videoId || "dpw9EHDh2bM"}
            onTimestampClick={handleTimestampClick}
            transcript={transcript}
          />
        </div>
      </div>
    </div>
  )
}
