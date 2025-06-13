"use client"
import { useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { VideoSection } from "@/components/video-section"
import { AIAssistant } from "@/components/ai-assistant"
import { Header } from "@/components/header"
import type { Screenshot } from "@/components/video-section"

export default function StudyTool() {
  const [showApp, setShowApp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])

  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header showSettings={showSettings} setShowSettings={setShowSettings} />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Half - Video/Notes */}
        <div className="flex-1 lg:w-1/2 overflow-hidden">
          <VideoSection screenshots={screenshots} setScreenshots={setScreenshots} />
        </div>

        {/* Right Half - AI Assistant */}
        <div className="flex-1 lg:w-1/2 border-l border-border overflow-hidden">
          <AIAssistant setShowSettings={setShowSettings} screenshots={screenshots} />
        </div>
      </div>
    </div>
  )
}
