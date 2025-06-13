"use client"

import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { SettingsModal } from "@/components/settings-modal"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserButton } from "@civic/auth-web3/react"

interface HeaderProps {
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

export function Header({ showSettings, setShowSettings }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center space-x-4">
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
            </a>

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
              <UserButton
                style={{
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                className="hover:!text-black !text-black dark:!text-white font-semibold text-sm !rounded-md"
              />

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

      </header>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
