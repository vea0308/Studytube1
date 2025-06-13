"use client"

import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { SettingsModal } from "@/components/settings-modal"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

export function Header({ showSettings, setShowSettings }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { label: "Features", href: "#features" },
    { label: "Docs", href: "#docs" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "#blog" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">StudyTube</span>
              </motion.div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8 ml-8">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>

              {/* Sign In / Dashboard buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Start project
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            >
              <div className="container mx-auto px-4 py-4">
                <nav className="flex flex-col space-y-4">
                  {navigationItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
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
                      size="sm"
                      className="justify-start bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                    >
                      Start project
                    </Button>
                  </div>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
