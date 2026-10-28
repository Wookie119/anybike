// AnyBike onboarding activation safety policy
// Global sending is disabled until manually approved.
// Before enabling, review all pending items due more than 24 hours ago.
// Do not send stale items automatically. Require explicit review and a new due date.
// Avoid re-enabling old customer journeys without an approved recipient cohort.
export const STALE_PENDING_HOURS = 24;
export function isStalePending(status: string, dueAt: string, now = Date.now()): boolean {
  return status === "pending" && new Date(dueAt).getTime() < now - STALE_PENDING_HOURS * 3600000;
}
