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

const mockSummary = `# React Hooks Tutorial Summary

## Key Concepts Covered

### 1. Introduction to Hooks (0:00 - 2:30)
- Hooks were introduced in React 16.8
- Allow you to use state and lifecycle features in functional components
- Enable better code reuse and organization

### 2. useState Hook (2:30 - 6:00)
- Most commonly used hook for managing component state
- Returns current state value and setter function
- Can be used with primitive values, objects, and arrays

### 3. useEffect Hook (6:00 - 10:00)
- Handles side effects in functional components
- Replaces componentDidMount, componentDidUpdate, and componentWillUnmount
- Dependency array controls when effect runs

### 4. Custom Hooks (10:00 - 15:42)
- Extract component logic into reusable functions
- Must start with "use" prefix
- Can call other hooks internally
- Promote code reuse across components

## Best Practices
- Always use hooks at the top level of components
- Don't call hooks inside loops, conditions, or nested functions
- Use multiple state variables instead of one complex object when possible
- Clean up effects to prevent memory leaks

## Code Examples

\`\`\`javascript
// useState example
const [count, setCount] = useState(0);

// useEffect example
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

> **Note**: Remember to always include dependencies in the useEffect dependency array to avoid bugs.`

export function AIAssistant({ setShowSettings, screenshots, videoId, onTimestampClick }: AIAssistantProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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
          videoId:videoId,
          provider: provider, // Tell the API which provider to use
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
    console.log('Rendering content:', content);
    
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
      // Ensure other markdown elements render properly
      p: ({ children, ...props }: any) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
      h1: ({ children, ...props }: any) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0" {...props}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0" {...props}>{children}</h3>,
      ul: ({ children, ...props }: any) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
      ol: ({ children, ...props }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
      li: ({ children, ...props }: any) => <li className="text-sm" {...props}>{children}</li>,
      code: ({ inline, children, ...props }: any) => 
        inline ? (
          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
        ) : (
          <code className="block bg-muted p-2 rounded text-sm font-mono overflow-x-auto" {...props}>{children}</code>
        ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-muted pl-4 italic my-2" {...props}>{children}</blockquote>
      ),
      strong: ({ children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
      em: ({ children, ...props }: any) => <em className="italic" {...props}>{children}</em>,
    };
    
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    );
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
          >
            <FileText className="w-4 h-4" />
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
                    <p className="text-sm mb-4">
                      Ask questions about the video content or reference specific study notes using @note1, @note2, etc.
                    </p>
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
                    placeholder="Ask about the video or reference notes with @note1, @note2..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px] max-h-[96px] resize-none pr-12"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isLoading} 
                  size="icon" 
                  className="shrink-0"
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
          <div className="h-full overflow-y-auto p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{mockSummary}</ReactMarkdown>
            </div>
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