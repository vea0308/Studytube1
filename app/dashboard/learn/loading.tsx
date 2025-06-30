import { FileText } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded flex items-center justify-center flex-shrink-0">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">StudyTube</span>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your learning session...</p>
    </div>
  )
}
