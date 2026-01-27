import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/shared/Footer";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect to dashboard if already logged in
  if (userId) {
    redirect("/disputes");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">DisputeHub</h1>
            <Badge variant="info" className="hidden sm:inline-flex">
              AI-Powered
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="default" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="default" asChild>
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust Badge */}
            <Badge variant="secondary" className="mb-6">
              ✨ AI-Powered Legal Analysis
            </Badge>

            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Fight Unfair Charges with
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {" "}
                AI-Powered{" "}
              </span>
              Dispute Letters
            </h2>

            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Generate professional, legally-sound dispute letters in minutes.
              From parking tickets to unfair fees, our AI analyzes your case and
              creates send-ready documents.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="xl" asChild>
                <Link href="/register">Start Your Free Dispute</Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-col items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-blue-400 to-blue-600" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-green-400 to-green-600" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-purple-400 to-purple-600" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-orange-400 to-orange-600" />
                </div>
                <span className="font-medium">
                  Join hundreds of users successfully resolving disputes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h3 className="mb-3 text-3xl font-bold">How It Works</h3>
              <p className="text-muted-foreground">
                Three simple steps to your professional dispute letter
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-lg border bg-card p-6 text-center shadow-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  1
                </div>
                <h4 className="mb-2 text-lg font-semibold">
                  Describe Your Dispute
                </h4>
                <p className="text-sm text-muted-foreground">
                  Tell us what happened in your own words. Our wizard guides you
                  through the process step by step.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-lg border bg-card p-6 text-center shadow-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  2
                </div>
                <h4 className="mb-2 text-lg font-semibold">
                  AI Analyzes Your Case
                </h4>
                <p className="text-sm text-muted-foreground">
                  Our AI reviews your situation, identifies legal grounds, and
                  assesses the strength of your case.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-lg border bg-card p-6 text-center shadow-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  3
                </div>
                <h4 className="mb-2 text-lg font-semibold">
                  Get Your Letter
                </h4>
                <p className="text-sm text-muted-foreground">
                  Receive a professional, send-ready dispute letter with legal
                  references and submission instructions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h3 className="mb-3 text-3xl font-bold">Why Choose DisputeHub?</h3>
              <p className="text-muted-foreground">
                Professional dispute resolution made simple and affordable
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">⚡</div>
                <h4 className="mb-2 font-semibold">Fast & Easy</h4>
                <p className="text-sm text-muted-foreground">
                  Generate professional letters in minutes, not hours. No legal
                  expertise required.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">💰</div>
                <h4 className="mb-2 font-semibold">Affordable</h4>
                <p className="text-sm text-muted-foreground">
                  Pay only £9.99 per dispute. No subscriptions, no hidden fees.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">🎯</div>
                <h4 className="mb-2 font-semibold">Accurate Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered legal analysis identifies the strongest arguments for
                  your case.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">📄</div>
                <h4 className="mb-2 font-semibold">Professional Format</h4>
                <p className="text-sm text-muted-foreground">
                  Send-ready letters with proper legal formatting and tone.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">🔒</div>
                <h4 className="mb-2 font-semibold">Secure & Private</h4>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted and never shared. Complete privacy
                  guaranteed.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <div className="mb-3 text-3xl">📱</div>
                <h4 className="mb-2 font-semibold">Works Everywhere</h4>
                <p className="text-sm text-muted-foreground">
                  Access from any device. Mobile-optimized for on-the-go use.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="mb-4 text-3xl font-bold">
              Ready to Fight Back?
            </h3>
            <p className="mb-8 text-lg text-muted-foreground">
              Join hundreds of users who have successfully challenged unfair
              charges
            </p>
            <Button size="xl" asChild>
              <Link href="/register">Create Your First Dispute</Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Free preview • Pay only if you want the full letter
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
