/* /api/posts/route.ts */

import { NextRequest, NextResponse } from "next/server"
import { getPublishedPosts } from "@/lib/data-source"

const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") || 18)))

    if (isNaN(page) || isNaN(limit)) {
      return NextResponse.json({ error: "Invalid page or limit" }, { status: 400 })
    }

    const posts = await getPublishedPosts(page, limit)

    return NextResponse.json(posts, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (error) {
    console.error("Posts API error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
