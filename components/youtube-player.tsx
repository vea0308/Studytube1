"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface YouTubePlayerProps {
  videoId: string
  isVisible: boolean
  onPlayerReady: (player: any) => void
  initialTime?: number
  initialPlaying?: boolean
  seekToTime?: number // New prop for seeking to specific time
}

interface PlayerAPI {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  getDuration: () => number
}

export function YouTubePlayer({
  videoId,
  isVisible,
  onPlayerReady,
  initialTime = 0,
  initialPlaying = false,
  seekToTime,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerAPIRef = useRef<PlayerAPI | null>(null)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [duration, setDuration] = useState("00:00")
  const [isLoaded, setIsLoaded] = useState(false)
  const [embedUrl, setEmbedUrl] = useState("")
  const { toast } = useToast()
  const timeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Create embed URL with start parameter
  const createEmbedUrl = (videoId: string, startTime?: number, autoplay = false) => {
    const baseUrl = `https://www.youtube.com/embed/${videoId}`
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      controls: '1',
      enablejsapi: '1',
      origin: window.location.origin,
    })
    
    if (startTime && startTime > 0) {
      params.set('start', Math.floor(startTime).toString())
    }
    
    return `${baseUrl}?${params.toString()}`
  }

  // Update embed URL when videoId or initialTime changes
  useEffect(() => {
    const newEmbedUrl = createEmbedUrl(videoId, initialTime, initialPlaying)
    setEmbedUrl(newEmbedUrl)
  }, [videoId, initialTime, initialPlaying])

  // Handle seekToTime prop changes (for timestamp clicks)
  useEffect(() => {
    if (seekToTime && seekToTime > 0 && iframeRef.current) {
      console.log(`Seeking to timestamp: ${seekToTime}s via props`)
      const newEmbedUrl = createEmbedUrl(videoId, seekToTime, true) // Enable autoplay when seeking
      
      // Update iframe src directly to seek to the new time
      iframeRef.current.src = newEmbedUrl
    }
  }, [seekToTime, videoId])

  // Create player API object once
  useEffect(() => {
    if (playerAPIRef.current) return // Don't recreate if already exists

    const playerAPI: PlayerAPI = {
      seekTo: (seconds: number, allowSeekAhead = true) => {
        // Update the embed URL with new start time and force reload
        const newEmbedUrl = createEmbedUrl(videoId, seconds, true) // Force autoplay on seek
        
        // Clear iframe first, then set new URL to force reload
        if (iframeRef.current) {
          iframeRef.current.src = 'about:blank'
          setTimeout(() => {
            if (iframeRef.current) {
              iframeRef.current.src = newEmbedUrl
            }
          }, 100)
        }
      },
      
      playVideo: () => {
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'playVideo',
                args: []
              }),
              'https://www.youtube.com'
            )
          } catch (error) {
            console.log('PostMessage play attempt:', error)
          }
        }
      },
      
      pauseVideo: () => {
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'pauseVideo',
                args: []
              }),
              'https://www.youtube.com'
            )
          } catch (error) {
            console.log('PostMessage pause attempt:', error)
          }
        }
      },
      
      getCurrentTime: () => {
        // This is approximate - we can't get real-time data from embed
        return initialTime || 0
      },
      
      getDuration: () => {
        // This would need to be set from video metadata if needed
        return 0
      }
    }

    playerAPIRef.current = playerAPI
    setIsLoaded(true)
  }, [videoId]) // Only depend on videoId

  // Notify parent when player is ready (separate effect)
  useEffect(() => {
    if (playerAPIRef.current && onPlayerReady && isLoaded) {
      onPlayerReady(playerAPIRef.current)
    }
  }, [onPlayerReady, isLoaded])

  // Handle iframe load
  const handleIframeLoad = () => {
    console.log('YouTube iframe loaded')
    setIsLoaded(true)
  }

  // Listen for messages from YouTube iframe (if supported)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return
      
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'video-progress') {
          const timeInSeconds = data.info?.currentTime
          if (typeof timeInSeconds === 'number') {
            setCurrentTime(formatTime(timeInSeconds))
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Video Container */}
      <div className="flex-1 relative">
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          {embedUrl && (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={handleIframeLoad}
              title={`YouTube video ${videoId}`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
