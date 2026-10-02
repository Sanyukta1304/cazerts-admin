export const PAGES = [
  "Dashboard",
  "Sales",
  "Inventory",
  "Pickup",
  "Live tracking",
  "Store status",
  "Feedback",
  "Photos",
  "Leaderboard",
  "Team",
] as const;

export type PageName = (typeof PAGES)[number];
export type Access = "none" | "view" | "edit";

export type Role = {
  id: string;
  name: string;
  color: string;
  description: string;
  permissions: Record<PageName, Access>;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "invited" | "paused";
};

export const ROLE_COLORS = ["#e6007e", "#d4a017", "#4f46e5", "#059669", "#ea580c", "#e11d48"];

export function emptyPerms(): Record<PageName, Access> {
  return Object.fromEntries(PAGES.map((p) => [p, "none"])) as Record<PageName, Access>;
}

function perms(map: Partial<Record<PageName, Access>>): Record<PageName, Access> {
  return { ...emptyPerms(), ...map };
}

export const INITIAL_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    color: ROLE_COLORS[0],
    description: "Full control of every page and every location",
    permissions: perms(Object.fromEntries(PAGES.map((p) => [p, "edit"])) as Record<PageName, Access>),
  },
  {
    id: "manager",
    name: "Store manager",
    color: ROLE_COLORS[2],
    description: "Runs a store day to day",
    permissions: perms({
      Dashboard: "edit",
      Sales: "view",
      Inventory: "edit",
      Pickup: "edit",
      "Live tracking": "edit",
      "Store status": "edit",
      Feedback: "view",
      Photos: "edit",
      Leaderboard: "view",
    }),
  },
  {
    id: "counter",
    name: "Counter staff",
    color: ROLE_COLORS[3],
    description: "Handles walk-in and delivery orders",
    permissions: perms({ Dashboard: "view", Pickup: "edit", "Live tracking": "view" }),
  },
  {
    id: "accounts",
    name: "Accounts",
    color: ROLE_COLORS[1],
    description: "Sales numbers only",
    permissions: perms({ Dashboard: "view", Sales: "view", Leaderboard: "view" }),
  },
];

// TODO: replace with real staff from Supabase
export const INITIAL_MEMBERS: Member[] = [
  { id: "1", name: "Sanyukta", email: "sanyukta@relogfoods.com", roleId: "owner", status: "active" }
];