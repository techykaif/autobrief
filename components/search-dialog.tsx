"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { NewsPost } from "@/lib/types"

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  const searchPosts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
        { signal: controller.signal }
      )

      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Search error:", error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPosts(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchPosts])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setLoading(false)
      abortRef.current?.abort()
    }
  }, [open])

  const handleSelect = (slug: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(`/news/${slug}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-muted-foreground w-full sm:w-auto justify-start bg-background/50 backdrop-blur-md hover:bg-accent transition-all"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search articles...</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden md:inline-flex pointer-events-none h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] ml-auto">
            ⌘ K
          </kbd>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 border bg-background shadow-xl rounded-xl [&>button]:hidden">
        
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="sr-only">Search articles</DialogTitle>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            <Input
              placeholder="Search news, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-lg focus:ring-2 focus:ring-primary/40"
              autoFocus
            />

            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-2">

          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
              Searching articles...
            </div>

          ) : results.length > 0 ? (

            <div className="space-y-1">
              {results.map((post) => (
                <button
                  key={`${post.id}-${post.slug}`}
                  onClick={() => handleSelect(post.slug)}
                  className="w-full text-left p-3 rounded-lg transition-all hover:bg-accent hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="text-xs font-medium text-primary">
                    {post.category}
                  </span>

                  <p className="font-medium text-sm line-clamp-1 mt-1">
                    {post.title}
                  </p>
                </button>
              ))}
            </div>

          ) : query ? (

            <div className="p-6 text-center text-sm text-muted-foreground">
              No results found
            </div>

          ) : (

            <div className="p-6 text-center text-sm text-muted-foreground">
              Start typing to search articles
            </div>

          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}