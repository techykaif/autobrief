"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"

type HealthStatus = "OK" | "DOWN" | "CHECKING"

interface StatusData {
  status: HealthStatus
  timestamp: number
  responseTime: number
  uptime?: number
}

function formatUptime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ago`
  return "now"
}

function getStatusIcon(status: HealthStatus): string {
  switch (status) {
    case "OK":
      return "◆"
    case "DOWN":
      return "◆"
    case "CHECKING":
      return "◐"
    default:
      return "?"
  }
}

interface HistoryEntry {
  status: HealthStatus
  time: number
  responseTime: number
}

export default function StatusPage() {
  const [status, setStatus] = useState<HealthStatus>("CHECKING")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [uptimeText, setUptimeText] = useState("")
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkHealth = useCallback(async () => {
    const start = performance.now()
    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      const time = Math.round(performance.now() - start)

      setResponseTime(time)

      if (!res.ok) throw new Error()

      const data = await res.json()
      const newStatus: HealthStatus = data.status === "OK" ? "OK" : "DOWN"

      setStatus(newStatus)
      setLastChecked(new Date())

      setHistory(prev => [
        { status: newStatus, time: Date.now(), responseTime: time },
        ...prev.slice(0, 59),
      ])
    } catch {
      const time = Math.round(performance.now() - start)
      setResponseTime(time)
      setStatus("DOWN")
      setLastChecked(new Date())

      setHistory(prev => [
        { status: "DOWN", time: Date.now(), responseTime: time },
        ...prev.slice(0, 59),
      ])
    }
  }, [])

  useEffect(() => {
    if (mounted) checkHealth()
  }, [mounted, checkHealth])

  useEffect(() => {
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  useEffect(() => {
    const key = "uptimeStart"

    if (status === "OK") {
      let start = localStorage.getItem(key)
      if (!start) {
        start = Date.now().toString()
        localStorage.setItem(key, start)
      }

      const update = () => {
        const uptimeMs = Date.now() - Number(start)
        setUptimeText(formatUptime(uptimeMs))
      }

      update()
      animationRef.current = setInterval(update, 60000)
    } else {
      localStorage.removeItem(key)
      setUptimeText("")
      if (animationRef.current) clearInterval(animationRef.current)
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
    }
  }, [status])

  const uptimePercentage = useMemo(() => {
    if (history.length === 0) return 100
    const ok = history.filter(h => h.status === "OK").length
    return Math.round((ok / history.length) * 100)
  }, [history])

  const avgResponse = useMemo(() => {
    if (history.length === 0) return 0
    const total = history.reduce((sum, h) => sum + h.responseTime, 0)
    return Math.round(total / history.length)
  }, [history])

  if (!mounted) return null

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-4xl">

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">

          {/* HEADER */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">
              {getStatusIcon(status)}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              System Status
            </h1>

            <p className="text-muted-foreground text-sm">
              Real-time monitoring
            </p>

            <div className="mt-4 text-lg font-semibold">
              {status === "CHECKING" && "Checking..."}
              {status === "OK" && "Operational"}
              {status === "DOWN" && "Unavailable"}
            </div>

            {uptimeText && (
              <div className="text-sm text-muted-foreground mt-1">
                Online {uptimeText}
              </div>
            )}

            {responseTime !== null && (
              <div className="text-xs text-muted-foreground mt-1">
                Response: {responseTime}ms
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

            <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent transition">
              <div className="text-xs text-muted-foreground mb-1">Uptime</div>
              <div className="text-xl font-semibold">{uptimePercentage}%</div>
            </div>

            <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent transition">
              <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
              <div className="text-xl font-semibold">{avgResponse}ms</div>
            </div>

            <div className="p-4 border border-border rounded-lg bg-card hover:bg-accent transition">
              <div className="text-xs text-muted-foreground mb-1">Last Check</div>
              <div className="text-sm">
                {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
              </div>
            </div>

          </div>

          {/* HISTORY */}
          {history.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Status History
              </div>

              <div className="flex gap-1 h-12">
                {history.slice(0, 60).map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded ${
                      h.status === "OK"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      height: `${Math.max(h.responseTime / 2, 20)}%`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          Auto-refresh every 30 seconds
        </div>

      </div>
    </div>
  )
}