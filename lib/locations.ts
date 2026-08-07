// ============================================
// STORE LOCATIONS — edit usernames/passwords here.
// NOTE: This is a demo-only credential check (hardcoded, client-side).
// For real security, this must move to a backend with hashed
// passwords and real authentication before going live.
// ============================================

export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  username: string;
  password: string;
};

export const LOCATIONS: StoreLocation[] = [
  {
    id: "btm-layout",
    name: "BTM Layout",
    address: "BTM 2nd Stage, Bengaluru",
    username: "btm_admin",
    password: "btm@2026",
  },
  {
    id: "indiranagar",
    name: "Indiranagar",
    address: "100ft Road, Indiranagar, Bengaluru",
    username: "indiranagar_admin",
    password: "indira@2026",
  },
  {
    id: "koramangala",
    name: "Koramangala",
    address: "5th Block, Koramangala, Bengaluru",
    username: "koramangala_admin",
    password: "kora@2026",
  },
];

export function getLocationById(id: string) {
  return LOCATIONS.find((l) => l.id === id);
}