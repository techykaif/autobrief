/* /api/categories/route.ts */

import { NextResponse } from "next/server"
import { getCategories } from "@/lib/data-source"

export const runtime = "nodejs"

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
