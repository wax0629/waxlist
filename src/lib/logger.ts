export type LogLevel = "info" | "warn" | "error";

export function logEvent(
  event: string,
  payload: Record<string, unknown>,
  level: LogLevel = "info",
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...payload,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
