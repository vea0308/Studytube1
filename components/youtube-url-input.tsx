"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useUser } from "@civic/auth-web3/react"

export function YouTubeUrlInput() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null)

  const router = useRouter()
  const { signIn, user } = useUser()

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("Please enter a YouTube URL")
      return
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError("Invalid YouTube URL. Please check and try again.")
      return
    }

    if (!user) {
      // Start loading while user signs in
      setIsLoading(true)
      setPendingVideoId(videoId)
      signIn()
      return
    }

    // If already signed in, redirect
    setIsLoading(true)
    router.push(`/dashboard/learn?v=${videoId}`)
  }

  useEffect(() => {
    if (user && pendingVideoId) {
      router.push(`/dashboard/learn?v=${pendingVideoId}`)
      setPendingVideoId(null)
    }
  }, [user, pendingVideoId, router])

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="Paste a YouTube URL to start learning..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="h-11 pl-4 pr-10 text-sm border-gray-200 dark:border-gray-800 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          {url && !isLoading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="sr-only">Clear input</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="absolute right-0 top-0 h-11 px-3 rounded-l-none"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Error message with animation */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute mt-1 flex items-center text-red-500 text-xs"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </motion.div>
        )}
      </form>

      <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        Try{" "}
        <button
          type="button"
          onClick={() => setUrl("https://www.youtube.com/watch?v=dpw9EHDh2bM")}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          React Hooks
        </button>{" "}
        or{" "}
        <button
          type="button"
          onClick={() => setUrl("https://www.youtube.com/watch?v=w7ejDZ8SWv8")}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          React crash course
        </button>
      </div>
    </div>
  )
}
