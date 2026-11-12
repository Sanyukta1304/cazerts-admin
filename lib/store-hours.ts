// Shared opening-hours rules. Keep this file identical in both projects.

export const OPEN_HOUR = 14; // 2:00 PM India time
export const CLOSE_HOUR = 24; // 12:00 AM (midnight) India time
export const HOURS_LABEL = "2:00 PM – 12:00 AM";

// India time is UTC+5:30 and has no daylight saving.
const IST_OFFSET_MS = 330 * 60 * 1000;

export type StoreOverride = {
  isClosed: boolean; // admin closed the store (reason applies)
  reason: string;
  forceOpenUntil: string | null; // admin opened early, valid until this time
};

export type StoreState =
  | { state: "open"; source: "schedule" | "admin" }
  | { state: "closed"; source: "admin"; reason: string }
  | { state: "closed"; source: "schedule" };

function istHour(now: Date): number {
  return new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
}

// True between 2:00 PM and 12:00 AM India time.
export function isWithinHours(now: Date = new Date()): boolean {
  const h = istHour(now);
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

// The next 12:00 AM India time. An early opening lasts until then.
export function endOfTodayIST(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1) -
      IST_OFFSET_MS
  );
}

// Milliseconds until the next 2:00 PM India time.
export function msUntilOpening(now: Date = new Date()): number {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();

  let openAt = Date.UTC(y, m, d, OPEN_HOUR) - IST_OFFSET_MS;
  if (now.getTime() >= openAt) {
    openAt = Date.UTC(y, m, d + 1, OPEN_HOUR) - IST_OFFSET_MS;
  }
  return openAt - now.getTime();
}

// The single place that decides if a store is open right now:
// 1. Admin closed it        -> closed (with the admin's reason)
// 2. Admin opened it early  -> open until 12:00 AM
// 3. Otherwise              -> follow the 2:00 PM to 12:00 AM hours
export function resolveStoreState(
  override: StoreOverride | null | undefined,
  now: Date = new Date()
): StoreState {
  if (override?.isClosed) {
    return { state: "closed", source: "admin", reason: override.reason };
  }

  if (
    override?.forceOpenUntil &&
    now.getTime() < new Date(override.forceOpenUntil).getTime()
  ) {
    return { state: "open", source: "admin" };
  }

  return isWithinHours(now)
    ? { state: "open", source: "schedule" }
    : { state: "closed", source: "schedule" };
}