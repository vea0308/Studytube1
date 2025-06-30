"use client"

import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Menu, X, FileText } from "lucide-react"
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">StudyTube</span>
                </div>
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
