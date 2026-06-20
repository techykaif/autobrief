/* /news/[slug]/page.tsx */

import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ShareButtons } from "@/components/share-buttons"
import { NewsCard } from "@/components/news-card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Calendar } from "lucide-react"
import {
  getPostBySlug,
  getPostsByCategory,
  getAllPosts,
} from "@/lib/data-source"

export const revalidate = false

interface PageProps {
  params: Promise<{ slug: string }>
}

/* =========================
   STATIC PARAMS
   ========================= */
export async function generateStaticParams() {
  const posts = await getAllPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

/* =========================
   METADATA
   ========================= */
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {

  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: "Post Not Found | AutoBrief" }
  }

  const description = post.content.substring(0, 160)

  return {
    title: `${post.title} | AutoBrief`,
    description,
    alternates: {
      canonical: `/news/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      url: `/news/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  }
}

/* =========================
   PAGE
   ========================= */
export default async function NewsPostPage({ params }: PageProps) {

  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const categoryPosts = await getPostsByCategory(post.category)
  const relatedPosts = categoryPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)

  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )

  const paragraphs = post.content.split("\n\n").filter(Boolean)

  /* Structured Data (SEO Boost) */
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author || "AutoBrief",
    },
    publisher: {
      "@type": "Organization",
      name: "AutoBrief",
    },
    description: post.content.substring(0, 160),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://autobrief-ai.netlify.app/news/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8">

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to news
          </Link>

          <div className="max-w-3xl mx-auto">

            <header className="mb-8 pb-8 border-b border-border">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge>{post.category}</Badge>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {post.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.publishedAt}>
                    {formattedDate}
                  </time>
                </span>
              </div>
            </header>

            <div className="flex justify-end mb-8">
              <ShareButtons title={post.title} />
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            {relatedPosts.length > 0 && (
              <section className="border-t border-border pt-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Related Articles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((related) => (
                    <NewsCard key={related.id} post={related} />
                  ))}
                </div>
              </section>
            )}

          </div>
        </article>
      </main>
    </div>
  )
}