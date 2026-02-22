import { Suspense } from "react";
import HelpClient from "./components/HelpClient";

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading help...</p>
          </div>
        </div>
      }
    >
      <HelpClient />
    </Suspense>
  );
}
