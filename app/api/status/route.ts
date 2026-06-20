/* /api/status/route.ts */
// Returns site stats: total visits, article count, last updated, categories
// Reads from Google Sheets ANALYTICS tab + data/posts.json

import { NextResponse } from "next/server"
import { JWT } from "google-auth-library"
import { getAllPosts, getCategories } from "@/lib/data-source"

export const runtime = "nodejs"

const SHEET_ID = process.env.GOOGLE_SHEET_ID!

async function getAccessToken(): Promise<string> {
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })
  const credentials = await client.authorize()
  if (!credentials.access_token) throw new Error("No token")
  return credentials.access_token
}

async function getVisitCount(): Promise<number> {
  try {
    const token = await getAccessToken()
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("ANALYTICS!B2")}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return 0
    const data = await res.json()
    const val = data.values?.[0]?.[0]
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

export async function GET() {
  try {
    const [posts, categories, visits] = await Promise.all([
      getAllPosts(),
      getCategories(),
      getVisitCount(),
    ])

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayCount = posts.filter(p =>
      new Date(p.publishedAt) >= todayStart
    ).length

    const weekCount = posts.filter(p =>
      new Date(p.publishedAt) >= weekStart
    ).length

    const lastUpdated = posts.length > 0
      ? posts[0].publishedAt
      : null

    return NextResponse.json({
      totalArticles: posts.length,
      todayArticles: todayCount,
      weekArticles: weekCount,
      totalVisits: visits,
      categories: categories.length,
      categoryBreakdown: categories.slice(0, 5),
      lastUpdated,
      timestamp: now.toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" }
    })
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
