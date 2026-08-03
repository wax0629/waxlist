import type { Session } from "@/lib/types";
import { appendTurn, runPipelineTurn, type RunTurnResult } from "./pipeline";

/**
 * v0.2 entry: fixed search pipeline (Intent → queries → multi-search → score).
 * Free-form tool-calling remains available later; pipeline guarantees DoD fields.
 */
export async function runAgentTurn(
  session: Session,
  message: string,
  refUrl?: string,
): Promise<RunTurnResult> {
  return runPipelineTurn(session, message, refUrl);
}

export { appendTurn };
export type { RunTurnResult };
