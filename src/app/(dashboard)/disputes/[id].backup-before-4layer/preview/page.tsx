import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { isDisputeUnlocked } from "@/lib/payments";
import { StrengthIndicator } from "@/components/features/dispute-preview/StrengthIndicator";
import { LockedContent } from "@/components/features/dispute-preview/LockedContent";
import { UnlockButton } from "@/components/features/dispute-preview/UnlockButton";
import { FullAnalysisLoader } from "@/components/features/dispute-preview/FullAnalysisLoader";
import Link from "next/link";

interface PreviewPageProps {
  params: {
    id: string;
  };
  searchParams: {
    success?: string;
    canceled?: string;
  };
}

export default async function PreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
  });

  if (!dispute) {
    notFound();
  }

  // Verify ownership
  if (dispute.userId !== userId) {
    redirect("/disputes");
  }

  const preview = dispute.aiPreview as any;
  const fullAnalysis = dispute.aiFullAnalysis as any;

  if (!preview) {
    redirect(`/disputes/${params.id}`);
  }

  // Check if dispute is unlocked (single source of truth)
  const isUnlocked = await isDisputeUnlocked(params.id);
  const bypassEnabled = process.env.BYPASS_PAYWALL === "true";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Success/Cancel Messages */}
      {searchParams.success === "true" && isUnlocked && (
        <div
          className="animate-slide-in-top rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="font-medium">
              Payment successful! Your content is now unlocked 🎉
            </span>
          </div>
        </div>
      )}

      {searchParams.canceled === "true" && (
        <div
          className="animate-slide-in-top rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800"
          role="alert"
          aria-live="polite"
        >
          <span className="font-medium">
            Payment canceled. You can try again when ready.
          </span>
        </div>
      )}

      {/* Full Analysis Loader - triggers generation on unlock */}
      {(isUnlocked || bypassEnabled) && (
        <FullAnalysisLoader
          disputeId={params.id}
          hasFullAnalysis={!!fullAnalysis}
          isUnlocked={isUnlocked}
          bypassEnabled={bypassEnabled}
        />
      )}

      {/* Header */}
      <div>
        <Link
          href="/disputes"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to disputes list"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Disputes
        </Link>
        <h1 className="text-3xl font-bold">{dispute.title}</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Your AI-Generated Analysis</p>
          {isUnlocked && (
            <span
              className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
              role="status"
              aria-label="Content unlocked"
            >
              Unlocked
            </span>
          )}
        </div>
      </div>

      {/* Strength Indicator */}
      <StrengthIndicator strength={preview.strength} />

      {/* Case Summary */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Case Summary</h2>
        <p className="leading-relaxed text-muted-foreground">
          {preview.summary}
        </p>
      </div>

      {/* Key Points */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Key Points Identified</h2>
        <ul className="space-y-3">
          {(isUnlocked
            ? preview.keyPoints
            : preview.keyPoints.slice(0, 3)
          ).map((point: string, index: number) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
        {!isUnlocked && preview.keyPoints.length > 3 && (
          <p className="mt-4 text-sm text-muted-foreground">
            + {preview.keyPoints.length - 3} more points in full analysis
          </p>
        )}
      </div>

      {/* Full Dispute Letter */}
      {isUnlocked || bypassEnabled ? (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Full Dispute Letter</h2>
          <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {fullAnalysis?.fullLetter || preview.lockedContent.fullLetter}
          </div>
        </div>
      ) : (
        <LockedContent
          title="Full Dispute Letter"
          preview={preview.fullLetterPreview}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              [Detailed legal argument and supporting evidence...]
            </p>
            <p className="text-sm text-muted-foreground">
              [Professional formatting and tone...]
            </p>
            <p className="text-sm text-muted-foreground">
              [Ready for submission...]
            </p>
          </div>
        </LockedContent>
      )}

      {/* Legal Grounds */}
      {(isUnlocked || bypassEnabled) && fullAnalysis?.legalGrounds && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Legal Grounds</h2>
          <ul className="space-y-3">
            {fullAnalysis.legalGrounds.map((ground: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {index + 1}
                </span>
                <span className="text-sm text-muted-foreground">{ground}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal References */}
      {isUnlocked || bypassEnabled ? (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Legal References & Precedents
          </h2>
          <ul className="space-y-2">
            {(fullAnalysis?.legalReferences ||
              preview.lockedContent.legalReferences).map(
              (ref: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {ref}
                </li>
              )
            )}
          </ul>
        </div>
      ) : (
        <LockedContent title="Legal References & Precedents">
          <ul className="space-y-2">
            {preview.lockedContent.legalReferences.map(
              (ref: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {ref}
                </li>
              )
            )}
          </ul>
        </LockedContent>
      )}

      {/* Submission Guide */}
      {isUnlocked || bypassEnabled ? (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Next Steps & Submission Guide
          </h2>
          <ol className="space-y-2">
            {(fullAnalysis?.nextSteps ||
              preview.lockedContent.submissionSteps).map(
              (step: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {index + 1}. {step}
                </li>
              )
            )}
          </ol>
        </div>
      ) : (
        <LockedContent title="Step-by-Step Submission Guide">
          <ol className="space-y-2">
            {preview.lockedContent.submissionSteps.map(
              (step: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {index + 1}. {step}
                </li>
              )
            )}
          </ol>
        </LockedContent>
      )}

      {/* CTA Section - Only show if not unlocked */}
      {!isUnlocked && (
        <section
          className="sticky bottom-0 rounded-lg border-2 border-primary bg-card p-6 shadow-lg"
          aria-label="Unlock full analysis"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold">Unlock Full Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Get your complete dispute letter, legal references, and
                submission guide
              </p>
            </div>
            <UnlockButton disputeId={params.id} />
          </div>

          {/* Benefits List */}
          <ul
            className="mt-4 grid gap-2 border-t pt-4 text-sm md:grid-cols-2"
            aria-label="Benefits of unlocking"
          >
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-primary"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Complete dispute letter</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-primary"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Downloadable PDF</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-primary"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Legal references</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-primary"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Submission instructions</span>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
