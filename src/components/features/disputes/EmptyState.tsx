import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-6xl">📋</div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No disputes yet</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first dispute. Our AI will analyze your
            case and generate a professional dispute letter in minutes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/disputes/start">Create Your First Dispute</Link>
          </Button>
        </div>
        <div className="pt-4 text-xs text-muted-foreground">
          <p>✓ Free preview • ✓ No credit card required</p>
        </div>
      </div>
    </div>
  );
}
