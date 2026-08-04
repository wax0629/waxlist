/** Reserved tag — pink「友情」badge (e.g. mixing clients). Only staff should set. */

export const FRIEND_TAG = "友情";

export function hasFriendTag(tags: string[] | undefined | null): boolean {
  if (!tags?.length) return false;
  return tags.some((t) => t.trim() === FRIEND_TAG);
}

/** Tags shown as ordinary chips (exclude reserved friend badge). */
export function displayTags(tags: string[] | undefined | null): string[] {
  if (!tags?.length) return [];
  return tags.filter((t) => t.trim() !== FRIEND_TAG);
}

export function withFriendTag(tags: string[] | undefined | null): string[] {
  const base = (tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (base.includes(FRIEND_TAG)) return base;
  return [...base, FRIEND_TAG];
}

export function withoutFriendTag(tags: string[] | undefined | null): string[] {
  return displayTags(tags);
}

export function mergeFriendFlag(
  existing: string[] | undefined | null,
  friend: boolean,
): string[] {
  return friend ? withFriendTag(existing) : withoutFriendTag(existing);
}
