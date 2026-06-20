"use client"

// Silent visit tracker — fires once per 5 minutes per browser
// Placed in layout so it tracks all pages

import { useEffect } from "react"

export function VisitTracker() {
  useEffect(() => {
    const key = "ab_last_track"
    const last = localStorage.getItem(key)
    const now = Date.now()

    // Track at most once per 5 minutes per browser session
    if (!last || now - parseInt(last) > 5 * 60 * 1000) {
      fetch("/api/track", { method: "POST" }).catch(() => {})
      localStorage.setItem(key, String(now))
    }
  }, [])

  return null
}
