/** Shared action icons: ❤️ 收藏 · 👍 推荐 — fixed optical center in circle buttons */

const emojiShell =
  "inline-flex h-full w-full items-center justify-center leading-none select-none";

/** Rounded heart — favorite / 收藏 */
export function HeartIcon({
  filled,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`${emojiShell} ${className}`}
      style={{
        // emoji often sits slightly high/low; nudge for visual center
        transform: "translateY(0.5px)",
        fontSize: "1.05em",
      }}
      aria-hidden
    >
      {filled ? "❤️" : "🤍"}
    </span>
  );
}

/** Thumbs-up — like / 推荐 */
export function LikeIcon({
  filled,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`${emojiShell} ${filled ? "" : "opacity-75"} ${className}`}
      style={{
        transform: "translateY(0.5px)",
        fontSize: "1.05em",
      }}
      aria-hidden
    >
      👍
    </span>
  );
}
