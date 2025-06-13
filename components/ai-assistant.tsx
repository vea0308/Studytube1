"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
}

interface Flashcard {
  id: string
  question: string
  answer: string
}

interface AIAssistantProps {
  setShowSettings: (show: boolean) => void
  screenshots: Screenshot[]
}

const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    question: "What is the useState hook used for in React?",
    answer:
      "useState is a React hook that allows you to add state to functional components. It returns an array with the current state value and a function to update it.",
  },
  {
    id: "2",
    question: "When does useEffect run by default?",
    answer: "useEffect runs after every render by default, including the first render and after every update.",
  },
  {
    id: "3",
    question: "How do you create a custom hook?",
    answer:
      'A custom hook is a JavaScript function whose name starts with "use" and that may call other hooks. It allows you to extract component logic into reusable functions.',
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

export function AIAssistant({ setShowSettings, screenshots }: AIAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>("chat")
  const [provider, setProvider] = useState<AIProvider>("openai")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentFlashcard, setCurrentFlashcard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [missingProvider, setMissingProvider] = useState<AIProvider | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  // Parse @note references from the input and silently attach note descriptions
  const parseNoteReferences = (text: string): { enhancedPrompt: string; referencedNotes: Screenshot[] } => {
    const noteRegex = /@note(\d+)/g
    const matches = [...text.matchAll(noteRegex)]
    const referencedNotes: Screenshot[] = []
    let enhancedPrompt = text

    // Collect referenced notes
    matches.forEach((match) => {
      const noteNumber = Number.parseInt(match[1])
      const noteIndex = noteNumber - 1
      if (noteIndex >= 0 && noteIndex < screenshots.length) {
        referencedNotes.push(screenshots[noteIndex])
      }
    })

    // If there are referenced notes, silently attach their descriptions to the prompt
    if (referencedNotes.length > 0) {
      let contextText = "\n\n[Context from referenced notes:\n"
      referencedNotes.forEach((note, index) => {
        const noteNumber = screenshots.findIndex((s) => s.id === note.id) + 1
        contextText += `Note ${noteNumber} (${note.timestamp}): ${note.description}\n`
      })
      contextText += "]\n"

      // Replace @note references with cleaner text for display
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    if (!checkApiKey(provider)) {
      setMissingProvider(provider)
      setShowApiKeyDialog(true)
      return
    }

    const { enhancedPrompt, referencedNotes } = parseNoteReferences(inputValue)

    // Display the clean user message (without the context)
    const displayText = inputValue.replace(/@note(\d+)/g, (match, number) => {
      const noteIndex = Number.parseInt(number) - 1
      if (noteIndex >= 0 && noteIndex < screenshots.length) {
        return `note ${number} (${screenshots[noteIndex].timestamp})`
      }
      return match
    })

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: displayText,
      timestamp: new Date(),
      referencedNotes,
    }

    // Generate AI response based on the enhanced prompt (with context)
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: `I understand you're asking about "${displayText}". ${
        referencedNotes.length > 0
          ? `Based on your referenced notes from ${referencedNotes.map((n) => n.timestamp).join(", ")}, here's what I can help you with:`
          : "Based on the React hooks video content, here's what I can help you with:"
      }

${
  referencedNotes.length > 0
    ? referencedNotes
        .map((note, index) => {
          const noteNumber = screenshots.findIndex((s) => s.id === note.id) + 1
          return `**From Note ${noteNumber} (${note.timestamp}):**
${note.description}

This section covers important concepts that relate to your question. Let me provide more detailed insights based on this content...`
        })
        .join("\n\n")
    : "Let me provide you with detailed information about React hooks and how they work..."
}

Feel free to reference specific notes using @note1, @note2, etc. to ask more targeted questions!`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInputValue("")
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      <ReactMarkdown>{message.content}</ReactMarkdown>
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
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
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
