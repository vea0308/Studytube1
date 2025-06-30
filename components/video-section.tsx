"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Play, FileText, Save, Plus, Clock, Grid, Maximize, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { YouTubePlayer } from "./youtube-player"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

type Mode = "video" | "notes"
type NotesView = "grid" | "full"

export interface Screenshot {
  id: string
  timestamp: string
  description: string
  timeInSeconds: number
  capturedAt: Date
  imageUrl?: string
}

interface VideoSectionProps {
  screenshots: Screenshot[]
  setScreenshots: (screenshots: Screenshot[]) => void
  videoId?: string
  notesLoading: boolean
  onPlayerReady?: (player: any) => void
  seekToTime?: number // New prop for seeking to specific time
}

export function VideoSection({ screenshots, setScreenshots, videoId = "dpw9EHDh2bM", notesLoading, onPlayerReady, seekToTime }: VideoSectionProps) {
  const [mode, setMode] = useState<Mode>("video")
  const [notesView, setNotesView] = useState<NotesView>("grid")
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const [description, setDescription] = useState("")
  const [newNoteTimestamp, setNewNoteTimestamp] = useState("")
  const [newNoteDescription, setNewNoteDescription] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const { toast } = useToast()
  const [playerInstance, setPlayerInstance] = useState<any>(null)
  const [playerState, setPlayerState] = useState({
    currentTime: 0,
    isPlaying: false,
  })

  // Parse timestamp from URL
  const [urlTimestamp, setUrlTimestamp] = useState<number>(0)

  useEffect(() => {
    // Extract timestamp from URL parameter on initial load
    const urlParams = new URLSearchParams(window.location.search)
    const timestampParam = urlParams.get('t')

    if (timestampParam) {
      // Parse timestamp (supports formats like "123s", "2m3s", "1h2m3s")
      const timeInSeconds = parseYouTubeTimestamp(timestampParam)
      setUrlTimestamp(timeInSeconds)
    } else {
      setUrlTimestamp(0)
    }
  }, []) // Only run on mount

  const parseYouTubeTimestamp = (timestamp: string): number => {
    // Remove 's' at the end if present
    const cleanTimestamp = timestamp.replace(/s$/, '')

    // Handle different formats
    if (cleanTimestamp.includes('h') || cleanTimestamp.includes('m')) {
      let totalSeconds = 0

      // Extract hours
      const hoursMatch = cleanTimestamp.match(/(\d+)h/)
      if (hoursMatch) {
        totalSeconds += parseInt(hoursMatch[1]) * 3600
      }

      // Extract minutes
      const minutesMatch = cleanTimestamp.match(/(\d+)m/)
      if (minutesMatch) {
        totalSeconds += parseInt(minutesMatch[1]) * 60
      }

      // Extract seconds
      const secondsMatch = cleanTimestamp.match(/(\d+)s?$/)
      if (secondsMatch) {
        totalSeconds += parseInt(secondsMatch[1])
      }

      return totalSeconds
    } else {
      // Simple seconds format
      return parseInt(cleanTimestamp) || 0
    }
  }

  // Initialize with mock data if no screenshots provided
  const currentScreenshots = screenshots
  const currentNote = currentScreenshots[currentNoteIndex] || null

  // Handle mode switching
  const handleModeSwitch = (newMode: Mode) => {
    // Save player state before switching to notes
    if (mode === "video" && newMode === "notes" && playerInstance) {
      try {
        // Check if methods exist before calling them
        const currentTime = typeof playerInstance.getCurrentTime === 'function' 
          ? (playerInstance.getCurrentTime() || 0) 
          : 0;
        
        const playerState = typeof playerInstance.getPlayerState === 'function' 
          ? playerInstance.getPlayerState() 
          : -1; // -1 = unstarted
        
        setPlayerState({
          currentTime,
          isPlaying: playerState === 1, // 1 = playing
        })
      } catch (error) {
        console.warn('Error getting player state:', error);
        // Set default values if there's an error
        setPlayerState({
          currentTime: 0,
          isPlaying: false,
        })
      }
    }

    setMode(newMode)
  }

  const handleNoteSelect = (index: number) => {
    setCurrentNoteIndex(index)
    setDescription(currentScreenshots[index].description)
  }

  const handlePrevNote = () => {
    const newIndex = (currentNoteIndex - 1 + currentScreenshots.length) % currentScreenshots.length
    handleNoteSelect(newIndex)
  }

  const handleNextNote = () => {
    const newIndex = (currentNoteIndex + 1) % currentScreenshots.length
    handleNoteSelect(newIndex)
  }

  const handleSave = () => {
    if (currentNote) {
      const updatedScreenshots = currentScreenshots.map((s, i) => (i === currentNoteIndex ? { ...s, description } : s))
      setScreenshots(updatedScreenshots)

      toast({
        title: "Note updated",
        description: "Your study note has been updated",
      })
    }
  }

  const handleAddNote = () => {
    if (!newNoteTimestamp.trim() || !newNoteDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both timestamp and description",
        variant: "destructive",
      })
      return
    }

    // Parse timestamp (format: MM:SS or HH:MM:SS)
    const timeParts = newNoteTimestamp.split(":").map(Number)
    let timeInSeconds = 0

    if (timeParts.length === 2) {
      // MM:SS format
      timeInSeconds = timeParts[0] * 60 + timeParts[1]
    } else if (timeParts.length === 3) {
      // HH:MM:SS format
      timeInSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
    } else {
      toast({
        title: "Invalid timestamp",
        description: "Please use MM:SS or HH:MM:SS format",
        variant: "destructive",
      })
      return
    }

    const newNote: Screenshot = {
      id: Date.now().toString(),
      timestamp: newNoteTimestamp,
      description: newNoteDescription,
      timeInSeconds,
      capturedAt: new Date(),
      imageUrl: `/placeholder.svg?height=120&width=200&text=Note+${currentScreenshots.length + 1}`,
    }

    const updatedScreenshots = [...currentScreenshots, newNote].sort((a, b) => a.timeInSeconds - b.timeInSeconds)
    setScreenshots(updatedScreenshots)

    // Set current note to the new one
    const newIndex = updatedScreenshots.findIndex((s) => s.id === newNote.id)
    setCurrentNoteIndex(newIndex)

    // Clear form
    setNewNoteTimestamp("")
    setNewNoteDescription("")
    setIsAddingNote(false)

    toast({
      title: "Note added",
      description: `Study note added at ${newNoteTimestamp}`,
    })
  }

  const formatCaptureTime = (date: Date): string => {
    return date.toLocaleString()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mode Toggle */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={mode === "video" ? "default" : "outline"}
              onClick={() => handleModeSwitch("video")}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Video Mode</span>
            </Button>
            <Button
              variant={mode === "notes" ? "default" : "outline"}
              onClick={() => handleModeSwitch("notes")}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <div className="flex gap-2">
                <span>Study Notes</span>
                <span>{notesLoading ? <Loader2 className="animate-spin rotate-45" /> : `(${currentScreenshots.length})`}</span>
              </div>
            </Button>
          </div>

          {mode === "notes" && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingNote(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Note
              </Button>
              <div className="border-l border-border h-6 mx-2"></div>
              <Button
                variant={notesView === "grid" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setNotesView("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={notesView === "full" ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setNotesView("full")}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <h3 className="text-sm font-medium">Add New Study Note</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Timestamp</label>
                <Input
                  placeholder="MM:SS or HH:MM:SS"
                  value={newNoteTimestamp}
                  onChange={(e) => setNewNoteTimestamp(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">Description</label>
                <Input
                  placeholder="What happens at this timestamp?"
                  value={newNoteDescription}
                  onChange={(e) => setNewNoteDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddNote}>
                Add Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {mode === "video" ? (
          <div className="h-full p-4">
            <YouTubePlayer
              videoId={videoId}
              isVisible={mode === "video"}
              onPlayerReady={(player) => {
                setPlayerInstance(player)
                if (onPlayerReady) {
                  onPlayerReady(player)
                }
              }}
              initialTime={urlTimestamp > 0 ? urlTimestamp : playerState.currentTime}
              initialPlaying={playerState.isPlaying}
              seekToTime={seekToTime}
            />
          </div>
        ) : (
          <div className="h-full">
            {
              notesLoading ?
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <div className="max-w-md">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Hang on</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We are preparing your notes 
                      </p>
                      <Button onClick={() => setIsAddingNote(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Note
                      </Button>
                    </div>
                  </div>
                :
                currentScreenshots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <div className="max-w-md">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No study notes yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add your first note to get started with AI-powered learning.
                      </p>
                      <Button onClick={() => setIsAddingNote(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Note
                      </Button>
                    </div>
                  </div>
                ) : notesView === "full" ? (
                  <div className="h-full flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentNote?.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 p-4 flex flex-col"
                      >
                        {/* Full Screen Note View */}
                        <div className="flex-1 flex flex-col">
                          {/* Note Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-medium">
                                @note{currentNoteIndex + 1}
                              </div>
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {currentNote?.timestamp}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Note {currentNoteIndex + 1} of {currentScreenshots.length}
                            </div>
                          </div>

                          {/* Note Image */}
                          <div className="relative mb-4 flex-shrink-0">
                            <div className="aspect-video max-h-[50vh] w-full relative overflow-hidden rounded-lg border border-border">
                              <Image
                                src={currentNote?.imageUrl || "/placeholder.svg?height=400&width=600"}
                                alt={`Note ${currentNoteIndex + 1} screenshot`}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>

                          {/* Note Description */}
                          <div className="flex-1 mb-4">
                            <Textarea
                              placeholder="Edit the note description..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="min-h-[120px] h-full resize-none"
                            />
                          </div>

                          {/* Note Actions */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              <Clock className="inline-block w-3 h-3 mr-1" />
                              {formatCaptureTime(currentNote?.capturedAt || new Date())}
                            </div>
                            <Button onClick={handleSave} disabled={!description.trim()}>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="p-4 border-t border-border flex items-center justify-between">
                      <Button variant="outline" onClick={handlePrevNote} disabled={currentScreenshots.length <= 1}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous Note
                      </Button>
                      <Button variant="outline" onClick={handleNextNote} disabled={currentScreenshots.length <= 1}>
                        Next Note
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full p-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentScreenshots.map((screenshot, index) => (
                        <Card
                          key={screenshot.id}
                          className={`cursor-pointer transition-all hover:shadow-md border ${index === currentNoteIndex
                            ? "ring-2 ring-emerald-500 border-emerald-200 dark:border-emerald-800"
                            : "border-border hover:border-emerald-200 dark:hover:border-emerald-800"
                            }`}
                          onClick={() => {
                            handleNoteSelect(index)
                            setNotesView("full")
                          }}
                        >
                          <div className="p-3">
                            <div className="relative aspect-video w-full mb-3">
                              <Image
                                src={screenshot.imageUrl || "/placeholder.svg?height=120&width=200"}
                                alt={`Note ${index + 1} screenshot`}
                                fill
                                className="rounded-md object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                {screenshot.timestamp}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-medium">
                                @note{index + 1}
                              </div>
                            </div>

                            <p className="text-xs text-foreground line-clamp-2 mb-2">{screenshot.description}</p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                <Clock className="inline-block w-3 h-3 mr-1" />
                                {new Date(screenshot.capturedAt).toLocaleDateString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNoteSelect(index)
                                  setNotesView("full")
                                }}
                              >
                                <Maximize className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  )
}
