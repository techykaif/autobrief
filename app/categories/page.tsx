/* /categories/page.tsx */

import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder } from "lucide-react"
import { getCategories } from "@/lib/data-source"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Categories | AutoBrief",
  description: "Browse all news categories on AutoBrief.",
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 container mx-auto px-4 py-10">

        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Categories
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse news by category
          </p>
        </div>

        {/* EMPTY STATE */}
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            No categories available.
          </p>
        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {categories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`}>

                <Card className="group relative h-full border border-border rounded-xl bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">

                  {/* subtle hover glow */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none ring-1 ring-primary/10" />

                  <CardHeader className="flex flex-row items-center gap-4">

                    {/* ICON */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 transition-all group-hover:scale-110">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>

                    {/* TEXT */}
                    <div className="flex flex-col">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>

                      <p className="text-sm text-muted-foreground">
                        {category.count} article{category.count !== 1 ? "s" : ""}
                      </p>
                    </div>

                  </CardHeader>
                </Card>

              </Link>
            ))}

          </div>
        )}

      </main>
    </div>
  )
}