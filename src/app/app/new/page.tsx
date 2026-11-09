import type { Metadata } from "next";
import { NewAnalysisForm } from "@/features/analysis/components/new-analysis-form";
import { isStorageConfigured } from "@/server/storage";

export const metadata: Metadata = { title: "New analysis" };

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New analysis</h1>
        <p className="text-sm text-muted-foreground">
          Upload a chart screenshot. We remove hidden photo data (like location) before storing it
          privately.
        </p>
      </div>
      {isStorageConfigured() ? (
        <NewAnalysisForm />
      ) : (
        <p role="alert" className="rounded-2xl border bg-muted/50 p-5 text-sm">
          Chart uploads aren&apos;t available right now. Please try again later.
        </p>
      )}
    </div>
  );
}
