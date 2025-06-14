"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface YouTubePlayerProps {
  videoId: string
  isVisible: boolean
  onPlayerReady: (player: any) => void
  initialTime?: number
  initialPlaying?: boolean
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({
  videoId,
  isVisible,
  onPlayerReady,
  initialTime = 0,
  initialPlaying = false,
}: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<any>(null)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [duration, setDuration] = useState("00:00")
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlayerMounted, setIsPlayerMounted] = useState(false)
  const { toast } = useToast()
  const timeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    return () => {
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current)
      }
    }
  }, [])

  // Initialize or reinitialize player when visibility changes
  useEffect(() => {
    if (isVisible && playerRef.current) {
      if (!isPlayerMounted) {
        initializePlayer()
      } else if (playerInstanceRef.current) {
        const playerElement = playerRef.current
        if (playerElement && playerElement.childNodes.length === 0) {
          initializePlayer()
        }
      }
    }
  }, [isVisible, isPlayerMounted])

  const initializePlayer = () => {
    if (!playerRef.current) return

    while (playerRef.current.firstChild) {
      playerRef.current.removeChild(playerRef.current.firstChild)
    }

    const setupPlayer = () => {
      if (!playerRef.current) return

      const ytPlayer = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          autoplay: initialPlaying ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          controls: 1,
          start: Math.floor(initialTime || 0),
        },
        events: {
          onReady: (event: any) => {
            const player = event.target
            playerInstanceRef.current = player
            onPlayerReady(player)
            setIsLoaded(true)
            setIsPlayerMounted(true)

            const videoDuration = player.getDuration()
            setDuration(formatTime(videoDuration))

            if (initialTime && initialTime > 0) {
              player.seekTo(initialTime, true)
              if (initialPlaying) {
                player.playVideo()
              }
            }

            startTimeTracking(player)
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startTimeTracking(event.target)
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      setupPlayer()
    } else {
      window.onYouTubeIframeAPIReady = setupPlayer
    }
  }

  const startTimeTracking = (ytPlayer: any) => {
    if (timeTrackingIntervalRef.current) {
      clearInterval(timeTrackingIntervalRef.current)
    }

    timeTrackingIntervalRef.current = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime) {
        try {
          const timeInSeconds = ytPlayer.getCurrentTime()
          const formattedTime = formatTime(timeInSeconds)
          setCurrentTime(formattedTime)
        } catch (error) {
          console.error("Error getting current time:", error)
        }
      }
    }, 1000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Video Container */}
      <div className="flex-1 relative">
        <div className="relative w-full h-full">
          <div
            ref={playerRef}
            className="absolute inset-0 rounded-lg overflow-hidden w-full mx-auto"
            id="youtube-player-container"
          />
        </div>
      </div>

      {/* Simple Controls */}
      <div className="flex-shrink-0 flex items-center justify-center p-2">
        <div className="text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            Duration: {duration} | Current: {currentTime}
          </span>
          <span className="sm:hidden">{currentTime}</span>
        </div>
      </div>
    </div>
  )
}
