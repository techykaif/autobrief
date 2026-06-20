// lib/data-source.ts
// Swap DATA_PROVIDER env var to switch data source
// Default is "static" (reads from data/posts.json — zero Sheets calls at runtime)
// Set DATA_PROVIDER=sheets to fall back to live Google Sheets (dev/debug only)

import * as staticData from "./static-data"
import * as sheets from "./google-sheets"

const provider = process.env.DATA_PROVIDER || "static"

const service = provider === "sheets" ? sheets : staticData

export const getPublishedPosts = service.getPublishedPosts
export const getPostBySlug = service.getPostBySlug
export const getPostsByCategory = service.getPostsByCategory
export const getCategories = service.getCategories
export const getFeaturedPosts = service.getFeaturedPosts
export const getBreakingNews = service.getBreakingNews
export const searchPosts = service.searchPosts
export const getAllPosts = service.getAllPosts
