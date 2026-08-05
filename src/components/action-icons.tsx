/** Shared action icons: ❤️ 收藏 · 👍 推荐 — fixed optical center in circle buttons */

/** 勿用 h-full/w-full：与文字并排时会把文案挤成竖排 */
const emojiShell =
  "inline-flex shrink-0 items-center justify-center leading-none select-none";

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
