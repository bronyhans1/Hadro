"use client";

type Props = {
  label: string;
  /** Optional image path — replace placeholder when real screenshots are ready. */
  src?: string;
  aspect?: "video" | "square" | "wide";
  className?: string;
};

const aspectClass = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[16/10]",
} as const;

/** Marketing placeholder frame — swap `src` for a real asset later. */
export function PlaceholderImage({ label, src, aspect = "video", className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${aspectClass[aspect]} ${className}`}
      style={{
        borderColor: "var(--border-soft)",
        background: "linear-gradient(145deg, var(--surface-muted) 0%, var(--surface) 55%, color-mix(in srgb, var(--ds-color-primary) 8%, var(--surface)) 100%)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <div
          className="rounded-lg border px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider"
          style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)", background: "var(--surface)" }}
        >
          Product screenshot
        </div>
        <p className="text-sm font-semibold text-theme">{label}</p>
        <p className="max-w-[14rem] text-xs leading-relaxed text-theme-muted">
          Placeholder — replace with a real capture when marketing assets are ready.
        </p>
      </div>
    </div>
  );
}
