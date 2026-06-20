/* /api/search/route.ts */

import { type NextRequest, NextResponse } from "next/server"
import { searchPosts } from "@/lib/data-source"

export const runtime = "nodejs"

const MAX_QUERY_LENGTH = 200
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const limitParam = searchParams.get("limit")

    if (!query || query.trim() === "") {
      return NextResponse.json([])
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 })
    }

    let results = await searchPosts(query.trim())

    if (limitParam) {
      const n = Math.min(MAX_LIMIT, Math.max(1, parseInt(limitParam, 10)))
      if (!isNaN(n)) results = results.slice(0, n)
    }

    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
