// lib/static-data.ts
// Reads from data/posts.json — zero Google Sheets calls at runtime
// This file replaces google-sheets.ts as the serving layer

import type { NewsPost, Category } from "./types"

let cachedPosts: NewsPost[] | null = null

function slugifyCategory(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-")
}

function loadPosts(): NewsPost[] {
  if (cachedPosts) return cachedPosts

  try {
    // Dynamic require so Next.js doesn't try to bundle the JSON at compile time
    // posts.json lives in data/ at the project root
    const data = require("../data/posts.json")
    cachedPosts = Array.isArray(data) ? data : []
  } catch {
    console.warn("⚠️ data/posts.json not found — returning empty posts array")
    cachedPosts = []
  }

  return cachedPosts!
}

/* =========================
   PUBLIC: PAGINATED POSTS
   ========================= */
export async function getPublishedPosts(
  page = 1,
  limit = 20
): Promise<NewsPost[]> {
  const posts = loadPosts()
  const start = (page - 1) * limit
  return posts.slice(start, start + limit)
}

/* =========================
   SINGLE POST
   ========================= */
export async function getPostBySlug(slug: string): Promise<NewsPost | null> {
  const posts = loadPosts()
  return posts.find((p) => p.slug === slug) || null
}

/* =========================
   CATEGORY FILTER — fixed slug matching
   ========================= */
export async function getPostsByCategory(
  categorySlug: string
): Promise<NewsPost[]> {
  const posts = loadPosts()
  return posts.filter((p) => {
    if (!p.category) return false
    return slugifyCategory(p.category) === categorySlug
  })
}

/* =========================
   CATEGORIES
   ========================= */
export async function getCategories(): Promise<Category[]> {
  const posts = loadPosts()
  const map = new Map<string, number>()

  posts.forEach((p) => {
    const name = String(p.category || "").trim()
    if (!name) return
    map.set(name, (map.get(name) || 0) + 1)
  })

  return Array.from(map.entries()).map(([name, count]) => ({
    name,
    slug: slugifyCategory(name),
    count,
  }))
}

/* =========================
   FEATURED
   ========================= */
export async function getFeaturedPosts(): Promise<NewsPost[]> {
  const posts = loadPosts()
  return posts.filter((p) => p.isFeatured).slice(0, 3)
}

/* =========================
   BREAKING
   ========================= */
export async function getBreakingNews(): Promise<NewsPost | null> {
  const posts = loadPosts()
  return posts[0] || null
}

/* =========================
   SEARCH
   ========================= */
export async function searchPosts(query: string): Promise<NewsPost[]> {
  if (!query?.trim()) return []

  const q = query.trim().toLowerCase()
  const posts = loadPosts()

  return posts.filter((p) => {
    const title = (p.title || "").toLowerCase()
    const content = (p.content || "").toLowerCase()
    const category = (p.category || "").toLowerCase()
    const author = (p.author || "").toLowerCase()

    return (
      title.includes(q) ||
      content.includes(q) ||
      category.includes(q) ||
      author.includes(q)
    )
  })
}

/* =========================
   GET ALL POSTS
   ========================= */
export async function getAllPosts(): Promise<NewsPost[]> {
  return loadPosts()
}
