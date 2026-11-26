"use client";

import { useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Check,
  Loader2,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const MAX_OUTPUT_SIDE = 2000; // pixels, keeps uploads light
const PREVIEW_SIDE = 480;

type Props = {
  file: File;
  title: string;
  /** Width / height of the card this photo will sit in (e.g. 4 / 3) */
  cardAspect: number;
  /** Label for that shape (e.g. "4:3") */
  cardLabel: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

// Rotates the image and cuts out the chosen area (scaled down if very large).
function renderCrop(
  image: HTMLImageElement,
  area: Area,
  rotation: number,
  maxSide: number
): HTMLCanvasElement {
  const rad = (rotation * Math.PI) / 180;
  const boxW =
    Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
  const boxH =
    Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

  // 1. Draw the rotated image
  const rotated = document.createElement("canvas");
  rotated.width = boxW;
  rotated.height = boxH;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Your browser can't crop images.");
  rctx.translate(boxW / 2, boxH / 2);
  rctx.rotate(rad);
  rctx.translate(-image.width / 2, -image.height / 2);
  rctx.drawImage(image, 0, 0);

  // 2. Cut out the selected area
  const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(area.width * scale));
  out.height = Math.max(1, Math.round(area.height * scale));
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Your browser can't crop images.");
  octx.fillStyle = "#ffffff"; // JPEG has no transparency
  octx.fillRect(0, 0, out.width, out.height);
  octx.drawImage(
    rotated,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    out.width,
    out.height
  );
  return out;
}

export default function ImageCropModal({
  file,
  title,
  cardAspect,
  cardLabel,
  onCancel,
  onConfirm,
}: Props) {
  const [src, setSrc] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Preview link for the chosen file, and the loaded image.
  // The "cancelled" flag ignores a load that was cleaned up (React runs
  // effects twice in development), so it can't show a false error.
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setImage(null);
    setError("");

    loadImage(url)
      .then((img) => {
        if (!cancelled) setImage(img);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't read that image.");
      });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Stop the page behind from scrolling, and close with Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onCancel();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [saving, onCancel]);

  // Live preview inside the card shape
  useEffect(() => {
    if (!image || !area) return;
    const t = setTimeout(() => {
      try {
        const canvas = renderCrop(image, area, rotation, PREVIEW_SIDE);
        setPreviewUrl(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        // preview is optional
      }
    }, 120);
    return () => clearTimeout(t);
  }, [image, area, rotation]);

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError("");
  }

  async function handleConfirm() {
    if (!area || !image) return;
    setSaving(true);
    setError("");
    try {
      const canvas = renderCrop(image, area, rotation, MAX_OUTPUT_SIDE);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) throw new Error("Couldn't create the cropped photo.");

      const base = file.name.replace(/\.[^/.]+$/, "") || "photo";
      onConfirm(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
    } catch (err: any) {
      setError(err?.message || "Couldn't crop the photo. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm"
      onClick={() => !saving && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-extrabold">Adjust photo</h3>
            <p className="mt-0.5 truncate text-xs text-black/45">{title}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Cancel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_190px]">
            {/* Left: adjust area + controls */}
            <div>
              <div className="relative h-[44vh] min-h-[260px] overflow-hidden rounded-2xl bg-black">
                {src && (
                  <Cropper
                    image={src}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={cardAspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixels) => setArea(pixels)}
                    showGrid
                  />
                )}
              </div>

              <p className="mt-3 text-xs text-black/45">
                Drag the photo to move it. Use the slider or mouse wheel to zoom. The frame is the
                exact {cardLabel} shape of the card.
              </p>

              {/* Zoom + rotate + reset */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex min-w-[180px] flex-1 items-center gap-3">
                  <ZoomOut size={16} className="text-black/40" />
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label="Zoom"
                    className="h-1.5 w-full cursor-pointer accent-[var(--color-magenta)]"
                  />
                  <ZoomIn size={16} className="text-black/40" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 270) % 360)}
                    aria-label="Rotate left"
                    title="Rotate left"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    aria-label="Rotate right"
                    title="Rotate right"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/5 px-4 text-xs font-bold text-black/60 hover:bg-black/10 hover:text-black"
                  >
                    <Undo2 size={14} />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right: live preview in the card */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                Preview in card
              </p>
              <div className="mx-auto w-full max-w-[190px] rounded-2xl border border-black/10 bg-white p-2 shadow-card">
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-black/5"
                  style={{ aspectRatio: String(cardAspect) }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-black/30" />
                    </div>
                  )}
                </div>
                <div className="mt-2.5 h-2 w-3/4 rounded bg-black/10" />
                <div className="mb-1 mt-1.5 h-2 w-1/3 rounded bg-black/5" />
              </div>
              <p className="mt-2 text-center text-[11px] text-black/40">
                This is exactly how it will look.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onConfirm(file)}
              disabled={saving}
              className="text-xs font-semibold text-black/45 underline decoration-dotted hover:text-black disabled:opacity-40"
            >
              Skip crop, use original
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex-1 rounded-full bg-black/5 px-6 py-3 text-sm font-bold text-black/60 hover:bg-black/10 disabled:opacity-40 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving || !area || !image}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-magenta)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 sm:flex-none"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Crop &amp; upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}