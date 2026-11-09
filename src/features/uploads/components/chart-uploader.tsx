"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CropIcon,
  ImageUpIcon,
  Loader2Icon,
  RefreshCwIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTR } from "../limits";
import { formatBytes, prepareForUpload, validateSourceFile } from "../lib/prepare-image";
import { UploadError, uploadImage } from "../lib/upload-request";
import type { ChartImageView } from "../server/upload.service";

type Selected = {
  file: File;
  previewUrl: string;
  /** Natural (orientation-corrected) size, needed to turn a percent crop into a real aspect ratio. */
  naturalWidth: number;
  naturalHeight: number;
  crop: PercentCrop | null;
};

type State =
  | { kind: "empty"; error: string | null }
  | { kind: "selected"; selected: Selected; cropping: boolean; error: string | null }
  | {
      kind: "uploading";
      selected: Selected;
      progress: number;
      phase: "preparing" | "uploading" | "processing";
    }
  | { kind: "uploaded"; image: ChartImageView };

export function ChartUploader({
  onUploaded,
}: {
  onUploaded?: (image: ChartImageView | null) => void;
}) {
  const [state, setState] = useState<State>({ kind: "empty", error: null });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const revokePreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  };
  useEffect(() => revokePreview, []);

  const selectFile = useCallback(
    async (file: File) => {
      const error = validateSourceFile(file);
      if (error) {
        setState({ kind: "empty", error });
        return;
      }
      revokePreview();
      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      const probe = new Image();
      probe.src = previewUrl;
      try {
        await probe.decode();
      } catch {
        revokePreview();
        setState({
          kind: "empty",
          error: "We couldn't open this image. Try taking the screenshot again.",
        });
        return;
      }
      setState({
        kind: "selected",
        selected: {
          file,
          previewUrl,
          naturalWidth: probe.naturalWidth,
          naturalHeight: probe.naturalHeight,
          crop: null,
        },
        cropping: false,
        error: null,
      });
      onUploaded?.(null);
    },
    [onUploaded],
  );

  // Paste from clipboard (desktop): Ctrl/Cmd+V anywhere on the page.
  const canPick = state.kind === "empty" || state.kind === "selected";
  useEffect(() => {
    if (!canPick) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void selectFile(new File([file], "pasted-chart", { type: file.type }));
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [canPick, selectFile]);

  function onDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void selectFile(file);
  }

  async function upload(selected: Selected) {
    setState({ kind: "uploading", selected, progress: 0, phase: "preparing" });
    try {
      const crop =
        selected.crop && selected.crop.width > 0 && selected.crop.height > 0
          ? selected.crop
          : undefined;
      const blob = await prepareForUpload(selected.file, crop);
      setState({ kind: "uploading", selected, progress: 0, phase: "uploading" });
      const image = await uploadImage(blob, (p) =>
        setState((s) =>
          s.kind === "uploading"
            ? { ...s, progress: p, phase: p >= 1 ? "processing" : "uploading" }
            : s,
        ),
      );
      revokePreview();
      setState({ kind: "uploaded", image });
      onUploaded?.(image);
    } catch (e) {
      const message =
        e instanceof UploadError
          ? e.message
          : "Something went wrong preparing the image. Please try again.";
      setState({ kind: "selected", selected, cropping: false, error: message });
    }
  }

  function reset() {
    revokePreview();
    setState({ kind: "empty", error: null });
    onUploaded?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT_ATTR}
      className="sr-only"
      aria-label="Choose a chart image"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void selectFile(file);
      }}
    />
  );

  if (state.kind === "empty") {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            "hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            dragging ? "border-primary bg-primary/10" : "border-border",
          )}
        >
          <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <ImageUpIcon className="size-7" aria-hidden />
          </span>
          <span className="text-base font-medium">Tap to choose a chart screenshot</span>
          <span className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">Drag &amp; drop, or paste with Ctrl/⌘ + V. </span>
            PNG, JPG or WEBP.
          </span>
        </button>
        {fileInput}
        {state.error && <ErrorNote message={state.error} />}
        <Tips />
      </div>
    );
  }

  if (state.kind === "uploaded") {
    const { image } = state;
    return (
      <div className="flex flex-col gap-3">
        <figure className="overflow-hidden rounded-2xl border bg-muted/30">
          {/* Signed, short-lived URL from private storage; next/image can't optimise it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt="Your uploaded chart, as the AI will see it"
            width={image.width}
            height={image.height}
            className="h-auto max-h-[70vh] w-full object-contain"
          />
          <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-3 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-bullish">
              <CheckCircle2Icon className="size-4" aria-hidden />
              {image.reused ? "Already uploaded" : "Uploaded"}
            </span>
            <span className="text-muted-foreground">
              This is exactly what the AI will see · {image.width}×{image.height} ·{" "}
              {formatBytes(image.bytes)}
            </span>
          </figcaption>
        </figure>
        <Button variant="outline" className="h-11 self-start" onClick={reset}>
          <RefreshCwIcon aria-hidden />
          Use a different image
        </Button>
      </div>
    );
  }

  const { selected } = state;
  const uploading = state.kind === "uploading";
  const cropping = state.kind === "selected" && state.cropping;

  return (
    <div className="flex flex-col gap-3" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="flex justify-center overflow-hidden rounded-2xl border bg-muted/30 p-2">
        {cropping ? (
          <ReactCrop
            crop={selected.crop ?? undefined}
            onChange={(_px, percent) =>
              setState((s) =>
                s.kind === "selected" ? { ...s, selected: { ...s.selected, crop: percent } } : s,
              )
            }
            minWidth={40}
            minHeight={40}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.previewUrl} alt="Chart to crop" className="max-h-[65vh] w-auto" />
          </ReactCrop>
        ) : (
          <CroppedPreview selected={selected} dimmed={uploading} />
        )}
      </div>

      {uploading ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center gap-2 text-sm">
            <Loader2Icon className="size-4 animate-spin text-primary" aria-hidden />
            {state.phase === "preparing" && "Preparing image…"}
            {state.phase === "uploading" && `Uploading… ${Math.round(state.progress * 100)}%`}
            {state.phase === "processing" && "Securing and optimising your image…"}
          </div>
          <Progress value={state.phase === "processing" ? 100 : Math.round(state.progress * 100)} />
        </div>
      ) : cropping ? (
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-sm text-muted-foreground">
            Drag to select the part of the chart to keep. Crop out account names or balances.
          </p>
          <Button
            className="h-11"
            onClick={() => setState({ kind: "selected", selected, cropping: false, error: null })}
          >
            Done
          </Button>
          <Button
            variant="ghost"
            className="h-11"
            onClick={() =>
              setState({
                kind: "selected",
                selected: { ...selected, crop: null },
                cropping: false,
                error: null,
              })
            }
          >
            Cancel crop
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 flex-1 sm:flex-none" onClick={() => upload(selected)}>
              <ImageUpIcon aria-hidden />
              Upload chart
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setState({ kind: "selected", selected, cropping: true, error: null })}
            >
              <CropIcon aria-hidden />
              {selected.crop ? "Edit crop" : "Crop"}
            </Button>
            {selected.crop && (
              <Button
                variant="ghost"
                className="h-11"
                onClick={() =>
                  setState({
                    kind: "selected",
                    selected: { ...selected, crop: null },
                    cropping: false,
                    error: null,
                  })
                }
              >
                <UndoIcon aria-hidden />
                Undo crop
              </Button>
            )}
            <Button variant="ghost" className="h-11" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
          </div>
          {fileInput}
          {state.kind === "selected" && state.error && <ErrorNote message={state.error} />}
        </>
      )}
    </div>
  );
}

/** Shows the chosen image, clipped to the crop rectangle when one is set. */
function CroppedPreview({ selected, dimmed }: { selected: Selected; dimmed: boolean }) {
  const { crop } = selected;
  const hasCrop = crop && crop.width > 0 && crop.height > 0;
  return (
    <div
      className={cn("relative max-w-full overflow-hidden", dimmed && "opacity-60")}
      style={
        hasCrop
          ? {
              aspectRatio: `${crop.width * selected.naturalWidth} / ${crop.height * selected.naturalHeight}`,
              width: "100%",
              maxHeight: "65vh",
            }
          : undefined
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={selected.previewUrl}
        alt="Selected chart preview"
        className={hasCrop ? "absolute max-w-none" : "max-h-[65vh] w-auto"}
        style={
          hasCrop
            ? {
                width: `${(100 / crop.width) * 100}%`,
                left: `${(-crop.x / crop.width) * 100}%`,
                top: `${(-crop.y / crop.height) * 100}%`,
              }
            : undefined
        }
      />
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      {message}
    </p>
  );
}

function Tips() {
  return (
    <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-3">
      <li>• Include the price axis on the right</li>
      <li>• Show at least 50–100 candles</li>
      <li>• Crop out account names or balances</li>
    </ul>
  );
}
