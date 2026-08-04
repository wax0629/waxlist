"use client";

/**
 * NetEase-style tracklist: numbered rows with checkboxes to pick recommended tracks.
 */

export function TrackSelectList({
  tracks,
  selected,
  onChange,
  disabled,
}: {
  tracks: string[];
  /** Indices of selected tracks */
  selected: number[];
  onChange: (indices: number[]) => void;
  disabled?: boolean;
}) {
  if (!tracks.length) {
    return (
      <p className="mt-1.5 text-sm text-white/58">
        暂无曲目列表。请先解析网易云链接。
      </p>
    );
  }

  const selectedSet = new Set(selected);
  const allSelected = selected.length === tracks.length && tracks.length > 0;

  function toggle(i: number) {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange([...next].sort((a, b) => a - b));
  }

  function selectAll() {
    if (disabled) return;
    onChange(tracks.map((_, i) => i));
  }

  function clearAll() {
    if (disabled) return;
    onChange([]);
  }

  return (
    <div className="glass-rim mt-1.5 overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/18 px-3 py-2">
        <p className="text-xs text-white/62">
          共 {tracks.length} 首
          {selected.length > 0 ? (
            <span className="text-white/70"> · 已选 {selected.length}</span>
          ) : (
            <span> · 可选推荐曲目（可不选）</span>
          )}
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            disabled={disabled || allSelected}
            onClick={selectAll}
            className="text-white/72 hover:text-white/85 disabled:opacity-40"
          >
            全选
          </button>
          <button
            type="button"
            disabled={disabled || selected.length === 0}
            onClick={clearAll}
            className="text-white/72 hover:text-white/85 disabled:opacity-40"
          >
            清空
          </button>
        </div>
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-white/[0.06]">
        {tracks.map((name, i) => {
          const checked = selectedSet.has(i);
          return (
            <li key={`${i}-${name}`}>
              <label
                className={
                  checked
                    ? "flex cursor-pointer items-center gap-3 bg-white/[0.06] px-3 py-2.5 transition hover:bg-white/[0.08]"
                    : "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.04]"
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 shrink-0 rounded border-white/30 bg-transparent text-[#ff6b9e] focus:ring-[#ff6b9e]/40"
                />
                <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={
                    checked
                      ? "min-w-0 flex-1 truncate text-sm text-white"
                      : "min-w-0 flex-1 truncate text-sm text-white/75"
                  }
                >
                  {name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Join selected track names for API storage */
export function formatSelectedTracks(
  tracks: string[],
  selected: number[],
): string | undefined {
  const names = selected
    .map((i) => tracks[i]?.trim())
    .filter((n): n is string => Boolean(n));
  return names.length ? names.join("\n") : undefined;
}
