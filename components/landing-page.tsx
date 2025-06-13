"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Brain,
  MessageCircle,
  FileText,
  Zap,
  Star,
  BookOpen,
  Target,
  Menu,
  X,
  Github,
  Twitter,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import Image from "next/image"
import { YouTubeUrlInput } from "./youtube-url-input"

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroHeight, setHeroHeight] = useState(0)

  useEffect(() => {
    if (heroRef.current) {
      setHeroHeight(heroRef.current.offsetHeight)
    }
  }, [])

  const features = [
    {
      icon: Play,
      title: "Smart Video Learning",
      description: "Watch YouTube videos with intelligent note-taking capabilities and timestamp tracking.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "Video player with timestamp notes",
    },
    {
      icon: Brain,
      title: "AI Study Assistant",
      description: "Get instant help with AI that understands your notes and can answer specific questions.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "AI assistant answering questions",
    },
    {
      icon: MessageCircle,
      title: "Note Referencing",
      description: "Reference specific notes in AI conversations using @note1, @note2 syntax for targeted help.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "Note referencing in action",
    },
    {
      icon: FileText,
      title: "Organized Study Notes",
      description: "Create, edit, and organize timestamped notes with easy-to-use grid and fullscreen views.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "Study notes organization",
    },
    {
      icon: Zap,
      title: "Instant Flashcards",
      description: "Generate flashcards from your notes and video content for effective memorization.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "Flashcard generation demo",
    },
    {
      icon: Target,
      title: "Focused Learning",
      description: "Stay focused with distraction-free interface designed specifically for educational content.",
      gifUrl: "/placeholder.svg?height=200&width=350",
      gifAlt: "Focused learning interface",
    },
  ]

  const howToUseSteps = [
    {
      title: "Load any YouTube video",
      description: "Simply paste a YouTube URL or search for content directly within the app.",
      gifUrl: "/placeholder.svg?height=300&width=500",
      gifAlt: "Loading a YouTube video",
    },
    {
      title: "Take timestamped notes",
      description: "Click to capture important moments with automatic timestamps and add your notes.",
      gifUrl: "/placeholder.svg?height=300&width=500",
      gifAlt: "Taking timestamped notes",
    },
    {
      title: "Chat with AI about specific notes",
      description: "Reference your notes with @note1, @note2 syntax to get targeted AI assistance.",
      gifUrl: "/placeholder.svg?height=300&width=500",
      gifAlt: "Chatting with AI about notes",
    },
    {
      title: "Generate study materials",
      description: "Create flashcards, summaries, and study guides from your notes with one click.",
      gifUrl: "/placeholder.svg?height=300&width=500",
      gifAlt: "Generating study materials",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content: "This tool transformed how I study programming tutorials. The AI referencing is incredible!",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Marcus Johnson",
      role: "Medical Student",
      content: "Perfect for anatomy videos. I can reference specific timestamps and get detailed explanations.",
      rating: 5,
      avatar: "MJ",
    },
    {
      name: "Elena Rodriguez",
      role: "Language Learner",
      content: "The note organization and AI help make learning languages from YouTube so much easier.",
      rating: 5,
      avatar: "ER",
    },
  ]

  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "50K+", label: "Study Notes Created" },
    { number: "95%", label: "Improved Learning" },
    { number: "24/7", label: "AI Assistance" },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13m0-13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">StudyTube</span>
              </motion.div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8 ml-8">
                {["Features", "How It Works", "Testimonials", "Pricing"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Sign In / Start Project buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign in
                </Button>
                <Button
                  onClick={onGetStarted}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Start learning
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            >
              <div className="container mx-auto px-4 py-4">
                <nav className="flex flex-col space-y-4">
                  {["Features", "How It Works", "Testimonials", "Pricing"].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={onGetStarted}
                      size="sm"
                      className="justify-start bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                    >
                      Start learning
                    </Button>
                  </div>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] py-16 px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <Badge className="mb-6 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
            AI-Powered Learning Platform
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 tracking-tight">
            What YouTube video would you like to study?
          </h1>

          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Transform how you learn from videos with AI-powered notes, chat, and study tools.
          </p>
        </div>

        {/* Centered YouTube URL Input */}
        <div className="w-full max-w-xl mx-auto">
          <YouTubeUrlInput />
        </div>

        <div className="mt-12 flex items-center space-x-4">
          <div className="flex -space-x-2">
            {["SC", "MJ", "ER"].map((initials, i) => (
              <div
                key={initials}
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-black"
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">10,000+</span> students already learning
          </p>
        </div>

        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to make learning from videos more effective and engaging.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <Card className="h-full bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={feature.gifUrl || "/placeholder.svg"}
                        alt={feature.gifAlt}
                        width={350}
                        height={200}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="p-4 text-white">
                          <div className="flex items-center space-x-2 mb-1">
                            <feature.icon className="w-4 h-4" />
                            <h3 className="text-base font-semibold">{feature.title}</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section
        id="how-it-works"
        className="py-20 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Tutorial
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
              How to use StudyTube
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Follow these simple steps to transform your learning experience.
            </p>
          </motion.div>

          <div className="space-y-24">
            {howToUseSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}
              >
                <div className="lg:w-1/2">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700 rounded-lg blur opacity-30"></div>
                    <div className="relative bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                      <Image
                        src={step.gifUrl || "/placeholder.svg"}
                        alt={step.gifAlt}
                        width={500}
                        height={300}
                        className="w-full object-cover"
                      />
                    </div>

                    {/* Step number */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>

                <div className="lg:w-1/2">
                  <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-4">{step.title}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{step.description}</p>

                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <p className="text-gray-600 dark:text-gray-400">
                          {index === 0 && item === 1 && "Works with any YouTube educational content"}
                          {index === 0 && item === 2 && "No account required to get started"}
                          {index === 0 && item === 3 && "Bookmark videos for later viewing"}

                          {index === 1 && item === 1 && "One-click timestamp capture"}
                          {index === 1 && item === 2 && "Automatic organization by topic"}
                          {index === 1 && item === 3 && "Edit and enhance notes anytime"}

                          {index === 2 && item === 1 && "Simple @note reference system"}
                          {index === 2 && item === 2 && "AI understands context from your notes"}
                          {index === 2 && item === 3 && "Get explanations, examples, and more"}

                          {index === 3 && item === 1 && "Flashcards with spaced repetition"}
                          {index === 3 && item === 2 && "Comprehensive study summaries"}
                          {index === 3 && item === 3 && "Export to PDF, Notion, or Markdown"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Button variant="outline" className="group">
                      Learn more
                      <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4 tracking-tight">
              Loved by students
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See how StudyTube is transforming the way students learn from video content.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                viewport={{ once: true }}
                whileHover={{ y: -2 }}
              >
                <Card className="h-full bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-emerald-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-black">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-black dark:text-white text-sm">{testimonial.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="pricing"
        className="py-20 border-t border-gray-200 dark:border-gray-800 bg-emerald-600 dark:bg-emerald-700 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Ready to transform your learning?</h2>
            <p className="text-sm text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already learning smarter with StudyTube.
            </p>
            <div className="max-w-xl mx-auto">
              <YouTubeUrlInput />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold text-black dark:text-white">StudyTube</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <div className="text-xs text-gray-400">© 2024 StudyTube. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
