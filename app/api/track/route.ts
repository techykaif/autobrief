/* /api/track/route.ts */
// Increments total visit count in Google Sheets ANALYTICS tab

import { NextResponse } from "next/server"
import { JWT } from "google-auth-library"

export const runtime = "nodejs"

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const ANALYTICS_RANGE = "ANALYTICS!B2"

async function getAccessToken(): Promise<string> {
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
  const credentials = await client.authorize()
  if (!credentials.access_token) throw new Error("No token")
  return credentials.access_token
}

async function fetchCell(range: string, token: string): Promise<number> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const val = data.values?.[0]?.[0]
  return val ? parseInt(val, 10) : 0
}

async function updateCell(range: string, value: number, token: string) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [[value]] }),
    }
  )
  if (!res.ok) throw new Error(await res.text())
}

export async function POST() {
  try {
    const token = await getAccessToken()
    const current = await fetchCell(ANALYTICS_RANGE, token)
    const newCount = (isNaN(current) ? 0 : current) + 1
    await updateCell(ANALYTICS_RANGE, newCount, token)

    return NextResponse.json({ visits: newCount }, {
      headers: { "Cache-Control": "no-store" }
    })
  } catch (error) {
    console.error("Track error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
