"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import {
  MessageCircle,
  Brain,
  FileText,
  ImageIcon,
  Send,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Paperclip,
  Hash,
} from "lucide-react"
import type { Screenshot } from "./video-section"

type AssistantMode = "chat" | "flashcards" | "summary"
type AIProvider = "openai" | "gemini" | "groq"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  referencedNotes?: Screenshot[]
  isLoading?: boolean
}

interface Flashcard {
  id: string
  question: string
  answer: string
}

interface AIAssistantProps {
  setShowSettings: (show: boolean) => void
  screenshots: Screenshot[]
  videoId: string
  onTimestampClick?: (timeInSeconds: number) => void
  transcript: any[] | null
}

const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    question: "What is the useState hook used for in React?",
    answer: "useState is a React hook that allows you to add state to functional components. It returns an array with the current state value and a function to update it.",
  },
  {
    id: "2",
    question: "When does useEffect run by default?",
    answer: "useEffect runs after every render by default, including the first render and after every update.",
  },
  {
    id: "3",
    question: "How do you create a custom hook?",
    answer: 'A custom hook is a JavaScript function whose name starts with "use" and that may call other hooks. It allows you to extract component logic into reusable functions.',
  },
]

export function AIAssistant({ setShowSettings, screenshots, videoId, onTimestampClick, transcript }: AIAssistantProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<AssistantMode>("chat")
  const [provider, setProvider] = useState<AIProvider>("gemini")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentFlashcard, setCurrentFlashcard] = useState(0) 
  const [showAnswer, setShowAnswer] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [missingProvider, setMissingProvider] = useState<AIProvider | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState<string>("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const summaryContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Generate summary from transcript
  const generateSummary = async () => {
    if (!transcript || transcript.length === 0) {
      toast({
        title: "No Transcript Available",
        description: "Cannot generate summary without video transcript.",
        variant: "destructive",
      })
      return
    }

    if (!checkApiKey(provider)) {
      toast({
        title: "API Key Required",
        description: `Please set up your ${provider.toUpperCase()} API key in settings to generate summary.`,
        variant: "destructive",
      })
      setMissingProvider(provider)
      setShowApiKeyDialog(true)
      return
    }

    setSummaryLoading(true)
    
    try {
      const savedKeys = localStorage.getItem("youtube-study-api-keys")
      const apiKey = savedKeys ? JSON.parse(savedKeys)[provider] : null

      const summaryPrompt = `You are StudyTube AI, a helpful learning assistant. Generate a comprehensive summary of this YouTube video based on the transcript.

**Subtitles (with timestamps):**
\`\`\`json
${JSON.stringify(transcript)}
\`\`\`

**Video ID:** ${videoId}

**INSTRUCTIONS:**

Generate a well-structured markdown summary with the following requirements:

## Summary Structure:
* **Title (# heading):** Create an engaging title for the video content
* **Overview (## heading):** Brief 2-3 sentence overview of the main topic  
* **Key Topics (## headings):** Organize content into main sections with subheadings (### for subsections)
* **Important Points:** Use bullet points (*) for key concepts
* **Detailed Content:** Provide comprehensive explanations with examples
* **Timestamps:** Include clickable timestamp links at the end of each paragraph/point

## Timestamp Link Format:
* **CRITICAL:** Use this exact format for timestamp links: [SECONDS](?v=${videoId}&t=SECONDS)
* Always use exact second values from the subtitle timestamps
* Place ONE timestamp link at the end of each paragraph/point
* Use format like: "This concept is explained in detail [245](?v=${videoId}&t=245)."

## Content Guidelines:
1. **Comprehensive:** Cover all major topics discussed in detail
2. **Well-organized:** Use proper markdown hierarchy (# ## ### ####)
3. **Educational:** Focus on learning objectives and key takeaways
4. **Timestamp-rich:** Include relevant timestamps for easy navigation
5. **Detailed:** Provide sufficient detail for study purposes
6. **Structured:** Use bullet points, numbered lists, and subheadings effectively

## Example Format:
\`\`\`markdown
# Video Title Here

## Overview
Brief overview of what the video covers and main learning objectives [15](?v=${videoId}&t=15).

## Main Topic 1
Detailed explanation of the first major topic discussed in the video [45](?v=${videoId}&t=45).

### Subtopic 1.1
* **Key Point 1:** Detailed explanation with context [120](?v=${videoId}&t=120).
* **Key Point 2:** Another important concept covered [185](?v=${videoId}&t=185).

### Subtopic 1.2
Further details and examples provided in this section [245](?v=${videoId}&t=245).

## Main Topic 2
Discussion of the second major theme [320](?v=${videoId}&t=320).

## Key Takeaways
* Summary point 1 [450](?v=${videoId}&t=450)
* Summary point 2 [480](?v=${videoId}&t=480)
\`\`\`

Generate a complete summary that students can use for studying and quick reference with rich timestamp navigation.`

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ 
          text: summaryPrompt,
          videoId: videoId,
          provider: provider,
          transcript: transcript,
          context: null
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      if (!response.body) {
        throw new Error("No response received")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        result += decoder.decode(value)
        setGeneratedSummary(result) // This will cause real-time streaming updates
        
        // Auto-scroll to bottom during summary generation
        if (summaryContainerRef.current) {
          summaryContainerRef.current.scrollTop = summaryContainerRef.current.scrollHeight
        }
      }

      toast({
        title: "Summary Generated",
        description: "Video summary has been created successfully!",
      })

    } catch (error) {
      console.error("Error generating summary:", error)
      toast({
        title: "Summary Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  // Auto-generate summary when switching to summary mode and transcript is available
  useEffect(() => {
    if (mode === "summary" && transcript && transcript.length > 0 && !generatedSummary && !summaryLoading) {
      generateSummary()
    }
  }, [mode, transcript])

  // Reset summary when video changes
  useEffect(() => {
    setGeneratedSummary("")
  }, [videoId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll to bottom for any new message, unless user has scrolled up
  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom();
    }
  }, [messages, isUserScrolledUp]);

  // Handle scroll event to detect if user scrolled up during streaming
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer) return

    let lastScrollTop = messagesContainer.scrollTop

    const handleScroll = () => {
      const currentScrollTop = messagesContainer.scrollTop
      
      // If user scrolled up during streaming, stop auto-scroll
      if (isLoading && currentScrollTop < lastScrollTop) {
        setIsUserScrolledUp(true)
      }
      
      lastScrollTop = currentScrollTop
    }

    messagesContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isLoading])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 4 * 24 // 4 lines * 24px line height
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  const checkApiKey = (provider: AIProvider): boolean => {
    const savedKeys = localStorage.getItem("youtube-study-api-keys")
    if (savedKeys) {
      const keys = JSON.parse(savedKeys)
      return !!keys[provider]
    }
    return false
  }

  const parseNoteReferences = (text: string): { enhancedPrompt: string; referencedNotes: Screenshot[] } => {
    const noteRegex = /@note(\d+)/g
    const matches = [...text.matchAll(noteRegex)]
    const referencedNotes: Screenshot[] = []
    let enhancedPrompt = text

    matches.forEach((match) => {
      const noteNumber = Number.parseInt(match[1])
      const noteIndex = noteNumber - 1
      if (noteIndex >= 0 && noteIndex < screenshots.length) {
        referencedNotes.push(screenshots[noteIndex])
      }
    })

    if (referencedNotes.length > 0) {
      let contextText = "\n\n[Context from referenced notes:\n"
      referencedNotes.forEach((note, index) => {
        const noteNumber = screenshots.findIndex((s) => s.id === note.id) + 1
        contextText += `Note ${noteNumber} (${note.timestamp}): ${note.description}\n`
      })
      contextText += "]\n"

      const cleanText = text.replace(noteRegex, (match, number) => {
        const noteIndex = Number.parseInt(number) - 1
        if (noteIndex >= 0 && noteIndex < screenshots.length) {
          return `note ${number} (${screenshots[noteIndex].timestamp})`
        }
        return match
      })

      enhancedPrompt = cleanText + contextText
    }

    return { enhancedPrompt, referencedNotes }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    if (!checkApiKey(provider)) {
      toast({
        title: "API Key Required",
        description: `Please set up your ${provider.toUpperCase()} API key in settings to use the AI assistant.`,
        variant: "destructive",
      })
      setMissingProvider(provider)
      setShowApiKeyDialog(true)
      return
    }

    // Check if transcript is available
    if (transcript === null) {
      toast({
        title: "Transcript Loading",
        description: "Please wait for the video transcript to load before asking questions.",
        variant: "destructive",
      })
      return
    }

    // Check if transcript failed to load
    if (transcript.length === 0) {
      toast({
        title: "Transcript Unavailable",
        description: "Video transcript could not be loaded. You can still ask general questions.",
        variant: "destructive",
      })
      // Allow to continue even without transcript for general questions
    }

    const { enhancedPrompt, referencedNotes } = parseNoteReferences(inputValue)

    // Get the user's API key from localStorage
    const savedKeys = localStorage.getItem("youtube-study-api-keys")
    const apiKey = savedKeys ? JSON.parse(savedKeys)[provider] : null

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.replace(/@note(\d+)/g, (match, number) => {
        const noteIndex = Number.parseInt(number) - 1
        if (noteIndex >= 0 && noteIndex < screenshots.length) {
          return `note ${number} (${screenshots[noteIndex].timestamp})`
        }
        return match
      }),
      timestamp: new Date(),
      referencedNotes,
    }


    setInputValue("")
    setMessages((prev) => [...prev, userMessage])
    setIsUserScrolledUp(false) // Resume auto-scroll for this new user message

    const assistantMessageId = (Date.now() + 1).toString()
    const loadingMessage: Message = {
      id: assistantMessageId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true
    }
    
    setMessages((prev) => [...prev, loadingMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`, // Pass user's API key in headers
        },
        body: JSON.stringify({ 
          text: enhancedPrompt,
          videoId: videoId,
          provider: provider, // Tell the API which provider to use
          transcript: transcript, // Send transcript data instead of fetching it
          context: referencedNotes.length > 0 ? {
            notes: referencedNotes.map(note => ({
              timestamp: note.timestamp,
              description: note.description
            }))
          } : null
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to get response from AI"
        
        try {
          const errorData = await response.json()
          
          // Handle different error response formats
          if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.details && Array.isArray(errorData.details)) {
            // Handle Google API error format with details array
            const detail = errorData.details.find((d: any) => d.message)
            if (detail && detail.message) {
              errorMessage = detail.message
            }
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
          
          // Check for specific API key related errors
          if (errorMessage.toLowerCase().includes('api key not valid') || 
              errorMessage.toLowerCase().includes('invalid api key') ||
              errorMessage.toLowerCase().includes('please pass a valid api key')) {
            errorMessage = `Invalid ${provider.toUpperCase()} API key. Please check your API key in settings and make sure it's valid.`
          }
          
        } catch {
          // If we can't parse JSON, use status-based messages
          if (response.status === 401) {
            errorMessage = `Invalid ${provider.toUpperCase()} API key. Please check your API key in settings.`
          } else if (response.status === 403) {
            errorMessage = "Access denied. Please verify your API key permissions."
          } else if (response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later."
          } else if (response.status >= 500) {
            errorMessage = "AI service is temporarily unavailable. Please try again."
          }
        }
        
        toast({
          title: "API Error",
          description: errorMessage,
          variant: "destructive",
        })
        
        throw new Error(errorMessage)
      }

      if (!response.body) {
        const errorMsg = "No response received from AI service"
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        throw new Error(errorMsg)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        result += decoder.decode(value)
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: result, isLoading: false } 
            : msg
        ))
        
        // Do not auto-scroll during streaming/assistant messages
      }
    } catch (error) {
      console.error("Error calling AI API:", error)
      
      // Check if this is an API key error that we've already handled
      const isApiKeyError = error instanceof Error && (
        error.message.toLowerCase().includes('invalid') && error.message.toLowerCase().includes('api key')
      )
      
      // Only show additional toast if we haven't already shown an API key error
      if (!isApiKeyError) {
        // Handle network errors and other unexpected errors
        let userFriendlyMessage = "Unable to connect to AI service. Please check your internet connection and try again."
        
        if (error instanceof TypeError && error.message.includes("fetch")) {
          userFriendlyMessage = "Network error. Please check your internet connection."
        } else if (error instanceof Error) {
          // If we have a specific error message that's not generic, use it
          if (!error.message.includes("Failed to get response") && 
              !error.message.includes("No response received")) {
            userFriendlyMessage = error.message
          }
        }
        
        toast({
          title: "Connection Error",
          description: userFriendlyMessage,
          variant: "destructive",
        })
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: "⚠️ Sorry, there was an error processing your request. Please try again.", 
              isLoading: false 
            } 
          : msg
      ))
    } finally {
      setIsLoading(false)
      // Don't reset scroll state - let user control it
    }
  }

  const nextFlashcard = () => {
    setCurrentFlashcard((prev) => (prev + 1) % mockFlashcards.length)
    setShowAnswer(false)
  }

  const prevFlashcard = () => {
    setCurrentFlashcard((prev) => (prev - 1 + mockFlashcards.length) % mockFlashcards.length)
    setShowAnswer(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const insertNoteReference = (noteIndex: number) => {
    const noteRef = `@note${noteIndex + 1} `
    setInputValue((prev) => prev + noteRef)
    textareaRef.current?.focus()
  }

  const handleTimestampClick = (timestamp: number) => {
    // Permanently prevent auto-scroll when timestamp is clicked
    setIsUserScrolledUp(true)
    
    if (onTimestampClick) {
      onTimestampClick(timestamp)
    }
  }

  // Convert seconds to MM:SS or HH:MM:SS format
  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  // Enhanced markdown renderer with clickable timestamps
  const renderMessageContent = (content: string) => {
    console.log('Rendering content length:', content.length);
    console.log('Content preview:', content.substring(0, 200));
    
    if (!content || content.trim() === '') {
      return <div>No content to display</div>;
    }

    // Clean up the content - remove markdown code block wrapper if present
    let cleanContent = content.trim();
    
    // Remove ```markdown at the beginning and ``` at the end
    if (cleanContent.startsWith('```markdown')) {
      cleanContent = cleanContent.replace(/^```markdown\s*/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '');
    }
    
    // Remove trailing ``` if present
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.replace(/\s*```$/, '');
    }
    
    console.log('Cleaned content preview:', cleanContent.substring(0, 200));
    
    // Custom components for ReactMarkdown
    const components = {
      // Custom link renderer for timestamp links
      a: ({ href, children, ...props }: any) => {
        console.log('Link detected:', { href, children });
        
        // Check if this is a timestamp link - expects: [SECONDS](?v=videoId&t=SECONDS)
        // Now also handles decimal seconds like 569.16
        const timestampMatch = href?.match(/^\?v=([^&]+)&t=(\d+(\.\d+)?)$/);
        
        if (timestampMatch) {
          const videoId = timestampMatch[1];
          const seconds = Math.floor(parseFloat(timestampMatch[2])); // Convert to integer seconds
          const displayTime = formatTimestamp(seconds); 
          
          console.log('Timestamp link found:', { href, children, videoId, seconds, displayTime });
          
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Timestamp button clicked: ${seconds}s (${displayTime})`);
                handleTimestampClick(seconds); // Use local handler to prevent auto-scroll
              }}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-105 transform transition-all duration-150 cursor-pointer underline decoration-blue-400 hover:decoration-blue-600"
              title={`Jump to ${displayTime}`}
              type="button"
            >
              {displayTime}
            </button>
          );
        }
        
        console.log('Regular link detected:', { href, children });
        
        // Regular link - render as span to prevent navigation
        return (
          <span
            className="text-blue-600 dark:text-blue-400 cursor-default"
            {...props}
          >
            {children}
          </span>
        );
      },
      // Ensure other markdown elements render properly with better styling
      p: ({ children, ...props }: any) => <p className="mb-3 last:mb-0 text-gray-800 dark:text-gray-200 leading-relaxed" {...props}>{children}</p>,
      h1: ({ children, ...props }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2" {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100" {...props}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100" {...props}>{children}</h3>,
      h4: ({ children, ...props }: any) => <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100" {...props}>{children}</h4>,
      ul: ({ children, ...props }: any) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props}>{children}</ul>,
      ol: ({ children, ...props }: any) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props}>{children}</ol>,
      li: ({ children, ...props }: any) => <li className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>{children}</li>,
      code: ({ inline, children, ...props }: any) => 
        inline ? (
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400" {...props}>{children}</code>
        ) : (
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3" {...props}>
            <code>{children}</code>
          </pre>
        ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic my-3 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r" {...props}>{children}</blockquote>
      ),
      strong: ({ children, ...props }: any) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>,
      em: ({ children, ...props }: any) => <em className="italic text-gray-700 dark:text-gray-300" {...props}>{children}</em>,
    };
    
    console.log('About to render ReactMarkdown with components:', Object.keys(components));
    
    try {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown components={components}>
            {cleanContent}
          </ReactMarkdown>
        </div>
      );
    } catch (error) {
      console.error('ReactMarkdown error:', error);
      return (
        <div className="text-red-500">
          <p>Error rendering markdown content</p>
          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">{cleanContent}</pre>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mode Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "chat" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("chat")}
            className="flex items-center space-x-1"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat</span>
          </Button>
          <Button
            variant={mode === "flashcards" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("flashcards")}
            className="flex items-center space-x-1"
          >
            <Brain className="w-4 h-4" />
            <span>Flashcards</span>
          </Button>
          <Button
            variant={mode === "summary" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("summary")}
            className="flex items-center space-x-1"
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Summary</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {mode === "chat" && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground space-y-4 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto opacity-50" />
                  <div>
                    <h3 className="font-medium mb-2">AI Study Assistant</h3>
                    {transcript === null ? (
                      <p className="text-sm mb-4 text-yellow-600 dark:text-yellow-400">
                        Loading video transcript... Please wait before asking questions.
                      </p>
                    ) : transcript.length === 0 ? (
                      <p className="text-sm mb-4 text-orange-600 dark:text-orange-400">
                        Video transcript could not be loaded. You can still ask general questions.
                      </p>
                    ) : (
                      <p className="text-sm mb-4">
                        Ask questions about the video content or reference specific study notes using @note1, @note2, etc.
                      </p>
                    )}
                    {screenshots.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Available Notes:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {screenshots.slice(0, 6).map((note, index) => (
                            <Button
                              key={note.id}
                              variant="outline"
                              size="sm"
                              onClick={() => insertNoteReference(index)}
                              className="text-xs h-6"
                            >
                              @note{index + 1} ({note.timestamp})
                            </Button>
                          ))}
                          {screenshots.length > 6 && (
                            <span className="text-xs text-muted-foreground">+{screenshots.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm">
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-100"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-200"></div>
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      ) : message.content ? (
                        renderMessageContent(message.content)
                      ) : null}
                    </div>
                    {message.referencedNotes && message.referencedNotes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <div className="text-xs opacity-70 mb-1">Referenced Notes:</div>
                        <div className="space-y-1">
                          {message.referencedNotes.map((note) => {
                            const noteNumber = screenshots.findIndex((s) => s.id === note.id) + 1
                            return (
                              <div key={note.id} className="text-xs bg-background/20 p-1 rounded">
                                @note{noteNumber} ({note.timestamp})
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mt-1 opacity-70`}>{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border space-y-3">
              {/* Quick Note References */}
              {screenshots.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex space-x-1">
                    {screenshots.slice(0, 8).map((note, index) => (
                      <Button
                        key={note.id}
                        variant="outline"
                        size="sm"
                        onClick={() => insertNoteReference(index)}
                        className="text-xs h-6 shrink-0"
                      >
                        @note{index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <Paperclip className="w-4 h-4" />
                    <span>Document</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <ImageIcon className="w-4 h-4" />
                    <span>Image</span>
                  </Button>
                </div>

                <Select value={provider} onValueChange={(value: AIProvider) => setProvider(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="groq">Groq</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Input */}
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder={
                      transcript === null 
                        ? "Loading transcript..." 
                        : "Ask about the video or reference notes with @note1, @note2..."
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px] max-h-[96px] resize-none pr-12"
                    rows={1}
                    disabled={isLoading || transcript === null}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isLoading || transcript === null} 
                  size="icon" 
                  className="shrink-0"
                  title={transcript === null ? "Waiting for transcript to load..." : "Send message"}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {mode === "flashcards" && (
          <div className="flex flex-col h-full p-4">
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-md p-6">
                <div className="text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Card {currentFlashcard + 1} of {mockFlashcards.length}
                  </div>

                  <div className="min-h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-4">{showAnswer ? "Answer:" : "Question:"}</h3>
                      <p className="text-foreground">
                        {showAnswer
                          ? mockFlashcards[currentFlashcard].answer
                          : mockFlashcards[currentFlashcard].question}
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => setShowAnswer(!showAnswer)} variant="outline" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {showAnswer ? "Show Question" : "Show Answer"}
                  </Button>
                </div>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button onClick={prevFlashcard} variant="outline">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button onClick={nextFlashcard} variant="outline">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {mode === "summary" && (
          <div ref={summaryContainerRef} className="h-full overflow-y-auto p-4">
            {transcript === null ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Loading Transcript</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we load the video transcript to generate a summary.
                  </p>
                </div>
              </div>
            ) : transcript.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Transcript Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Cannot generate summary because the video transcript could not be loaded.
                  </p>
                </div>
              </div>
            ) : summaryLoading ? (
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h2 className="text-lg font-semibold">Video Summary</h2>
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-600"></div>
                    <span className="text-sm text-muted-foreground">Generating...</span>
                  </div>
                </div>
                {generatedSummary ? (
                  <div className="animate-in fade-in duration-300">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMessageContent(generatedSummary)}
                    </div>
                    <div className="mt-4 flex items-center space-x-2 text-muted-foreground border-t border-border pt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse delay-200"></div>
                      </div>
                      <span className="text-xs">AI is writing summary...</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="max-w-md">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium mb-2">Generating Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        AI is analyzing the video transcript to create a comprehensive summary...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : generatedSummary ? (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h2 className="text-lg font-semibold">Video Summary</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setGeneratedSummary("")
                      generateSummary()
                    }}
                    disabled={summaryLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {renderMessageContent(generatedSummary)}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Generate Summary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an AI-powered summary of this video with clickable timestamps.
                  </p>
                  <Button onClick={generateSummary} disabled={!transcript || transcript.length === 0}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Summary
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to set up your {missingProvider} API key to use this AI provider. Please go to Settings to add
              your API key.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowApiKeyDialog(false)
                  setShowSettings(true)
                }}
              >
                Open Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}