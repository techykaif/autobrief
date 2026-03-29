import Link from "next/link"
import { Metadata } from "next"

const SITE_URL = "https://autobrief-ai.netlify.app"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "About AutoBrief | Automated News Platform",
  description:
    "Learn about AutoBrief — a fully automated news platform engineered to ingest, process, and publish structured, meaningful content.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AutoBrief",
  url: SITE_URL,
  founder: {
    "@type": "Person",
    name: "Mohd Kaif Ansari",
    jobTitle: "Founder",
  },
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <main className="min-h-screen bg-background text-foreground">
        
        {/* CONTAINER */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* HERO */}
          <section className="pt-20 pb-16 text-center space-y-6">
            
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground">
              Automated News Platform
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              About AutoBrief
            </h1>

            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              AutoBrief is a fully automated news platform designed to ingest,
              process, and present structured content in a clean and readable format.
            </p>

            <p className="text-sm text-muted-foreground">
              Built by{" "}
              <span className="font-semibold text-foreground">
                Mohd Kaif Ansari
              </span>
            </p>

          </section>

          {/* DIVIDER */}
          <div className="h-px bg-border my-6" />

          {/* FOUNDATION */}
          <section className="py-12">

            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
                Core Principles
              </h2>
              <p className="text-muted-foreground text-sm">
                Built on clarity, automation, and reliability
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* CARD 1 */}
              <div className="p-6 border border-border rounded-xl bg-card hover:shadow-md transition-all duration-300">
                <div className="text-2xl mb-3">🚀</div>
                <h3 className="text-lg font-semibold mb-2">Mission</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To reduce noise and manual effort by building systems that
                  transform raw information into structured, readable news —
                  automatically.
                </p>
              </div>

              {/* CARD 2 */}
              <div className="p-6 border border-border rounded-xl bg-card hover:shadow-md transition-all duration-300">
                <div className="text-2xl mb-3">🧠</div>
                <h3 className="text-lg font-semibold mb-2">Philosophy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Built with a system-first mindset — focusing on clarity,
                  predictability, and long-term maintainability.
                </p>
              </div>

            </div>
          </section>

          {/* DIVIDER */}
          <div className="h-px bg-border my-6" />

          {/* CTA */}
          <section className="py-16 text-center">

            <div className="p-8 border border-border rounded-2xl bg-card shadow-sm space-y-5">

              <h2 className="text-2xl sm:text-3xl font-semibold">
                Explore the Platform
              </h2>

              <p className="text-muted-foreground text-sm">
                Experience how automated systems simplify news consumption.
              </p>

              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Go to Homepage
              </Link>

            </div>

          </section>

        </div>
      </main>
    </>
  )
}