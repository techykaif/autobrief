"use client"

import { Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface ShareButtonsProps {
  title: string
}

export function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState("")

  useEffect(() => {
    setFullUrl(window.location.href)
  }, [])

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
  }

  const copyLink = async () => {
    if (!fullUrl) return
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground font-medium">Share:</span>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-blue-500/10"
          asChild
        >
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
            <Twitter className="w-4 h-4 text-blue-500" />
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-blue-600/10"
          asChild
        >
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
            <Facebook className="w-4 h-4 text-blue-600" />
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-sky-600/10"
          asChild
        >
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
            <Linkedin className="w-4 h-4 text-sky-600" />
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={copyLink}
          className="relative group h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-green-500/10"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            {copied ? "Copied!" : "Copy link"}
          </span>
        </Button>
      </div>
    </div>
  )
}
