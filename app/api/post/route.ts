/* /api/post/route.ts */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getPostBySlug } from "@/lib/data-source"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 })
    }

    const post = await getPostBySlug(slug)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    })
  } catch (error) {
    console.error("Post API error:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
