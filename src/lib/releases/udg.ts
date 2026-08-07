export const UDG_TAG = "UDG";

export function hasUdgTag(tags: string[] | undefined | null): boolean {
  return Boolean(tags?.some((tag) => tag.trim().toLocaleLowerCase() === "udg"));
}

export function withoutUdgTag(tags: string[] | undefined | null): string[] {
  return (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => tag.toLocaleLowerCase() !== "udg");
}

export function withUdgTag(tags: string[] | undefined | null): string[] {
  return [...withoutUdgTag(tags), UDG_TAG];
}

export function mergeUdgFlag(
  tags: string[] | undefined | null,
  enabled: boolean,
): string[] {
  return enabled ? withUdgTag(tags) : withoutUdgTag(tags);
}
