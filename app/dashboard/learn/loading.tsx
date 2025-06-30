import Image from "next/image"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center space-x-3 mb-8">
        <Image
          src="/logo.png"
          alt="StudyTube Logo"
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
        <span className="text-2xl font-semibold text-foreground">StudyTube</span>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your learning session...</p>
    </div>
  )
}
