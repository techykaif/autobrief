import Link from "next/link"
import { Clock, Eye, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { NewsPost } from "@/lib/types"

interface NewsCardProps {
  post: NewsPost
  variant?: "default" | "compact" | "featured"
}
export function NewsCard({ post, variant = "default" }: NewsCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const excerpt =
    post.content?.substring(0, 140).trim() || "Read full article..."

  /* =========================
     COMPACT
     ========================= */
  if (variant === "compact") {
    return (
      <article className="group py-4 border-b border-border last:border-0 transition-colors">
        <Link href={`/news/${post.slug}`} prefetch>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
            {post.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="opacity-80">{post.category}</span>
          <span>-</span>
          <time dateTime={post.publishedAt}>{formattedDate}</time>
        </div>
      </article>
    )
  }

  /* =========================
     FEATURED
     ========================= */
  if (variant === "featured") {
    return (
      <article className="group transition-all duration-300 hover:-translate-y-1">
        <Link href={`/news/${post.slug}`} prefetch>
          <div className="flex flex-col gap-3">

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs shadow-sm">
                {post.category}
              </Badge>
              <time
                dateTime={post.publishedAt}
                className="text-xs text-muted-foreground"
              >
                {formattedDate}
              </time>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {post.title}
            </h2>

            <p className="text-muted-foreground line-clamp-2">
              {excerpt}...
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {post.author}
                </span>
              )}

              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readingTime} min read
                </span>
              )}
            </div>

          </div>
        </Link>
      </article>
    )
  }

  /* =========================
     DEFAULT (PREMIUM)
     ========================= */
  return (
    <article className="group relative border border-border rounded-xl p-5 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">

      {/* subtle hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none ring-1 ring-primary/10" />

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="text-xs shadow-sm">
          {post.category}
        </Badge>

        <time
          dateTime={post.publishedAt}
          className="text-xs text-muted-foreground"
        >
          {formattedDate}
        </time>
      </div>

      <Link href={`/news/${post.slug}`} prefetch>
        <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
          {post.title}
        </h2>
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {excerpt}...
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">

        <div className="flex items-center gap-3">
          {post.readingTime && (
            <span className="flex items-center gap-1 hover:text-foreground transition">
              <Clock className="w-3 h-3" />
              {post.readingTime} min
            </span>
          )}

          {post.views && (
            <span className="flex items-center gap-1 hover:text-foreground transition">
              <Eye className="w-3 h-3" />
              {post.views.toLocaleString()}
            </span>
          )}
        </div>

        {post.author && (
          <span className="opacity-80 group-hover:opacity-100 transition">
            By {post.author}
          </span>
        )}
      </div>
    </article>
  )
}