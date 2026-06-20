import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { NewsCard } from "@/components/news-card"
import { CategoryFilter } from "@/components/category-filter"
import {
  getPostsByCategory,
  getCategories,
} from "@/lib/data-source"

export const revalidate = false

interface PageProps {
  params: Promise<{ slug: string }>
}

/* =========================
   STATIC PARAMS
   ========================= */
export async function generateStaticParams() {
  const categories = await getCategories()

  return categories.map((category) => ({
    slug: category.slug,
  }))
}

/* =========================
   METADATA
   ========================= */
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {

  const { slug } = await params

  const categoryName =
    slug.charAt(0).toUpperCase() + slug.slice(1)

  return {
    title: `${categoryName} News | AutoBrief`,
    description: `Latest ${slug} news and articles from AutoBrief.`,
  }
}

/* =========================
   PAGE
   ========================= */
export default async function CategoryPage({ params }: PageProps) {

  const { slug } = await params

  const [posts, categories] = await Promise.all([
    getPostsByCategory(slug),
    getCategories(),
  ])

  if (posts.length === 0 && !categories.find((c) => c.slug === slug)) {
    notFound()
  }

  const categoryName =
    slug.charAt(0).toUpperCase() + slug.slice(1)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {categoryName}
          </h1>
          <p className="text-muted-foreground">
            {posts.length} article{posts.length !== 1 ? "s" : ""} in this category
          </p>
        </div>

        <div className="mb-8">
          <CategoryFilter categories={categories} />
        </div>

        {posts.length === 0 ? (
          <p className="text-center py-12">
            No articles in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}