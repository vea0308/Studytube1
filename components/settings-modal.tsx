"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Eye, EyeOff } from "lucide-react"

interface APIKeys {
  openai: string
  gemini: string
  groq: string
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    openai: "",
    gemini: "",
    groq: "",
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    groq: false,
  })

  useEffect(() => {
    // Load API keys from localStorage
    const savedKeys = localStorage.getItem("youtube-study-api-keys")
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("youtube-study-api-keys", JSON.stringify(apiKeys))
    onOpenChange(false)
  }

  const toggleShowKey = (provider: keyof APIKeys) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <div className="space-y-4">
              {Object.entries(apiKeys).map(([provider, key]) => (
                <div key={provider} className="space-y-2">
                  <Label htmlFor={provider} className="capitalize">
                    {provider} API Key
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id={provider}
                      type={showKeys[provider as keyof APIKeys] ? "text" : "password"}
                      placeholder={`Enter your ${provider} API key`}
                      value={key}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          [provider]: e.target.value,
                        }))
                      }
                    />
                    <Button variant="outline" size="icon" onClick={() => toggleShowKey(provider as keyof APIKeys)}>
                      {showKeys[provider as keyof APIKeys] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="text-sm text-muted-foreground">Preferences settings will be added here.</div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
