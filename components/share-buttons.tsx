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

      <span className="text-sm text-muted-foreground font-medium">
        Share:
      </span>

      {/* Icons */}
      <div className="flex items-center gap-2">

        {/* Twitter */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-blue-500/10"
          asChild
        >
          <a href={shareLinks.twitter} target="_blank">
            <Twitter className="w-4 h-4 text-blue-500" />
          </a>
        </Button>

        {/* Facebook */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-blue-600/10"
          asChild
        >
          <a href={shareLinks.facebook} target="_blank">
            <Facebook className="w-4 h-4 text-blue-600" />
          </a>
        </Button>

        {/* LinkedIn */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-sky-600/10"
          asChild
        >
          <a href={shareLinks.linkedin} target="_blank">
            <Linkedin className="w-4 h-4 text-sky-600" />
          </a>
        </Button>

        {/* Copy */}
        <Button
          variant="ghost"
          size="icon"
          onClick={copyLink}
          className="relative h-9 w-9 rounded-full transition-all hover:scale-110 hover:bg-green-500/10"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}

          {/* Tooltip */}
          <span className="absolute -bottom-8 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            {copied ? "Copied!" : "Copy link"}
          </span>
        </Button>

      </div>
    </div>
  )
}