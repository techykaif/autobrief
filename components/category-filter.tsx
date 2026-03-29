"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap gap-3">

      {/* ALL BUTTON */}
      <Link
        href="/"
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
          "hover:scale-105 active:scale-95",
          pathname === "/"
            ? "bg-primary text-primary-foreground shadow-sm border-primary"
            : "bg-muted/60 text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground"
        )}
      >
        All
      </Link>

      {/* CATEGORY BUTTONS */}
      {categories.map((category) => {
        const isActive = pathname === `/category/${category.slug}`

        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className={cn(
              "group px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
              "hover:scale-105 active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm border-primary"
                : "bg-muted/60 text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span>{category.name}</span>

            <span className="ml-1.5 text-xs opacity-60 group-hover:opacity-90 transition">
              ({category.count})
            </span>
          </Link>
        )
      })}
    </div>
  )
}