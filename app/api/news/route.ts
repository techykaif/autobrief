/* /api/news/route.ts */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getPublishedPosts, getPostsByCategory } from "@/lib/data-source"

export const runtime = "nodejs"

const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limitParam = searchParams.get("limit")

    let posts = category
      ? await getPostsByCategory(category)
      : await getPublishedPosts()

    if (limitParam) {
      const n = Math.min(MAX_LIMIT, Math.max(1, parseInt(limitParam, 10)))
      if (!isNaN(n)) posts = posts.slice(0, n)
    }

    return NextResponse.json(posts, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (error) {
    console.error("News API error:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
