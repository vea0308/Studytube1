"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, FileText } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded flex items-center justify-center flex-shrink-0">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">StudyTube</span>
        </div>

        {/* 404 Message */}
        <h1 className="text-6xl font-bold text-gray-400 dark:text-gray-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Back to Home Button */}
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
