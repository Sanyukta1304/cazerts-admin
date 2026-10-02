"use client";

import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  X,
  Plus,
  ChevronRight,
  Check,
} from "lucide-react";

type Access = "none" | "view" | "edit";

type MemberStatus = "active" | "paused" | "invited";

type Member = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: MemberStatus;
};

type Role = {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<string, Access>;
};

const PAGES = [
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
];

const ROLE_COLORS = [
  "#EC008C",
  "#7167E8",
  "#35AD88",
  "#E2B33F",
];

const INITIAL_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full control of every page and every location",
    color: "#EC008C",
    permissions: {
      Dashboard: "edit",
      Sales: "edit",
      Inventory: "edit",
      Pickup: "edit",
      "Live tracking": "edit",
      "Store status": "edit",
      Feedback: "edit",
      Photos: "edit",
      Leaderboard: "edit",
      Team: "edit",
    },
  },
  {
    id: "store-manager",
    name: "Store manager",
    description: "Manage day-to-day store operations",
    color: "#7167E8",
    permissions: {
      Dashboard: "edit",
      Sales: "edit",
      Inventory: "edit",
      Pickup: "edit",
      "Live tracking": "view",
      "Store status": "edit",
      Feedback: "edit",
      Photos: "edit",
      Leaderboard: "view",
      Team: "view",
    },
  },
  {
    id: "counter-staff",
    name: "Counter staff",
    description: "Access for everyday counter operations",
    color: "#35AD88",
    permissions: {
      Dashboard: "view",
      Sales: "edit",
      Inventory: "view",
      Pickup: "view",
      "Live tracking": "view",
      "Store status": "view",
      Feedback: "edit",
      Photos: "view",
      Leaderboard: "view",
      Team: "none",
    },
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Access to sales and account-related information",
    color: "#E2B33F",
    permissions: {
      Dashboard: "view",
      Sales: "view",
      Inventory: "none",
      Pickup: "none",
      "Live tracking": "none",
      "Store status": "none",
      Feedback: "none",
      Photos: "none",
      Leaderboard: "none",
      Team: "none",
    },
  },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Sanyukta Das",
    email: "sanyukta@example.com",
    roleId: "owner",
    status: "active",
  },
  {
    id: "2",
    name: "Store Manager",
    email: "manager@example.com",
    roleId: "owner",
    status: "active",
  },
];

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  paused: "Paused",
  invited: "Invite sent",
};

const STATUS_DOT: Record<MemberStatus, string> = {
  active: "bg-emerald-500",
  paused: "bg-gray-400",
  invited: "bg-amber-400",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function accessLabel(access: Access) {
  if (access === "edit") return "Edit";
  if (access === "view") return "View";
  return "No access";
}

export default function TeamPage() {
  const [tab, setTab] = useState<"people" | "roles">("roles");

  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  const [selectedRoleId, setSelectedRoleId] = useState("owner");

  const [roleSection, setRoleSection] = useState<
    "overview" | "pages" | "data"
  >("overview");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("counter-staff");

  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) ?? roles[0];

  const memberCount = (roleId: string) =>
    members.filter((member) => member.roleId === roleId).length;

  const visibleMembers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return members.filter((member) => {
      const matchesRole =
        roleFilter === "all" || member.roleId === roleFilter;

      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [members, query, roleFilter]);

  const pagesWithAccess = selectedRole
    ? PAGES.filter(
        (page) => selectedRole.permissions[page] !== "none"
      ).length
    : 0;

  const editPages = selectedRole
    ? PAGES.filter(
        (page) => selectedRole.permissions[page] === "edit"
      )
    : [];

  function updatePermission(page: string, access: Access) {
    setRoles((current) =>
      current.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [page]: access,
              },
            }
          : role
      )
    );
  }

  function changeMemberRole(memberId: string, roleId: string) {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? { ...member, roleId }
          : member
      )
    );
  }

  function toggleMember(memberId: string) {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              status:
                member.status === "active"
                  ? "paused"
                  : "active",
            }
          : member
      )
    );
  }

  function cancelInvite(memberId: string) {
    setMembers((current) =>
      current.filter((member) => member.id !== memberId)
    );
  }

  function sendInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      roleId: inviteRole,
      status: "invited",
    };

    setMembers((current) => [newMember, ...current]);

    setInviteName("");
    setInviteEmail("");
    setDrawerOpen(false);
  }

  function createRole() {
    const name = newRoleName.trim();

    if (!name) return;

    const id =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now();

    const permissions: Record<string, Access> = {};

    PAGES.forEach((page) => {
      permissions[page] = "none";
    });

    const role: Role = {
      id,
      name,
      description: "Custom team role",
      color: ROLE_COLORS[roles.length % ROLE_COLORS.length],
      permissions,
    };

    setRoles((current) => [...current, role]);
    setSelectedRoleId(id);
    setNewRoleName("");
    setNewRoleOpen(false);
  }

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--color-cream)]">
      {/* HEADER */}
      <header className="shrink-0 px-6 pb-5 pt-7 md:px-10 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-magenta)]">
              Team
            </p>

            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black md:text-[36px]">
              Who can do what
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Manage people, roles and access across your store.
            </p>
          </div>

          <div className="flex shrink-0 rounded-full bg-black p-1">
            <button
              type="button"
              onClick={() => setTab("people")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                tab === "people"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              People
            </button>

            <button
              type="button"
              onClick={() => setTab("roles")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                tab === "roles"
                  ? "bg-[var(--color-magenta)] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Roles
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 md:px-10 lg:px-12">
        <div className="mx-auto h-full max-w-[1500px]">
          {/* ===================================================== */}
          {/* PEOPLE TAB                                            */}
          {/* ===================================================== */}

          {tab === "people" && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-[430px]">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                  />

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="Search people"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-magenta)] px-6 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
                >
                  <UserPlus size={17} />
                  Invite person
                </button>
              </div>

              <div className="mt-4 flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    roleFilter === "all"
                      ? "bg-black text-white"
                      : "bg-white text-black/55"
                  }`}
                >
                  Everyone · {members.length}
                </button>

                {roles.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => setRoleFilter(role.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                      roleFilter === role.id
                        ? "bg-black text-white"
                        : "bg-white text-black/55"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: role.color }}
                    />

                    {role.name} · {memberCount(role.id)}
                  </button>
                ))}
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleMembers.map((member) => {
                    const role = roles.find(
                      (item) => item.id === member.roleId
                    );

                    return (
                      <div
                        key={member.id}
                        className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                            style={{
                              background:
                                role?.color ?? "#999",
                            }}
                          >
                            {initials(member.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-display text-base font-bold">
                              {member.name}
                            </p>

                            <p className="truncate text-xs text-black/45">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <select
                            value={member.roleId}
                            onChange={(event) =>
                              changeMemberRole(
                                member.id,
                                event.target.value
                              )
                            }
                            className="h-10 min-w-0 flex-1 rounded-xl border border-black/10 bg-[var(--color-cream)] px-3 text-xs outline-none"
                          >
                            {roles.map((roleOption) => (
                              <option
                                key={roleOption.id}
                                value={roleOption.id}
                              >
                                {roleOption.name}
                              </option>
                            ))}
                          </select>

                          {member.status === "invited" ? (
                            <button
                              type="button"
                              onClick={() =>
                                cancelInvite(member.id)
                              }
                              className="rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-500"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                toggleMember(member.id)
                              }
                              className={`relative h-7 w-12 self-center rounded-full ${
                                member.status === "active"
                                  ? "bg-emerald-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${
                                  member.status === "active"
                                    ? "left-6"
                                    : "left-1"
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs text-black/45">
                          <span
                            className={`h-2 w-2 rounded-full ${STATUS_DOT[member.status]}`}
                          />

                          {STATUS_LABEL[member.status]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleMembers.length === 0 && (
                  <div className="flex h-40 items-center justify-center text-sm text-black/40">
                    No people match your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* ROLES TAB                                             */}
          {/* ===================================================== */}

          {tab === "roles" && selectedRole && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:grid-cols-[235px_1fr]">
                {/* ROLE LIST */}
                <aside className="min-h-0 overflow-y-auto border-b border-black/5 bg-[#fffdfb] lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between px-5 pb-3 pt-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
                        Roles
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {roles.length} roles
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNewRoleOpen(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition hover:bg-black/80"
                      aria-label="Create role"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="px-3 pb-4">
                    {roles.map((role) => {
                      const active =
                        role.id === selectedRoleId;

                      return (
                        <button
                          type="button"
                          key={role.id}
                          onClick={() =>
                            setSelectedRoleId(role.id)
                          }
                          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                            active
                              ? "bg-black/[0.06]"
                              : "hover:bg-black/[0.035]"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background: role.color,
                            }}
                          />

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                active
                                  ? "text-black"
                                  : "text-black/75"
                              }`}
                            >
                              {role.name}
                            </span>

                            <span className="mt-0.5 block text-[11px] text-black/40">
                              {memberCount(role.id)}{" "}
                              {memberCount(role.id) === 1
                                ? "person"
                                : "people"}
                            </span>
                          </span>

                          <ChevronRight
                            size={15}
                            className={`shrink-0 transition ${
                              active
                                ? "text-black"
                                : "text-black/15 group-hover:text-black/30"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {newRoleOpen && (
                    <div className="mx-3 mb-4 rounded-xl border border-black/10 bg-white p-3">
                      <input
                        autoFocus
                        value={newRoleName}
                        onChange={(event) =>
                          setNewRoleName(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            createRole();
                          }

                          if (event.key === "Escape") {
                            setNewRoleOpen(false);
                            setNewRoleName("");
                          }
                        }}
                        placeholder="Role name"
                        className="h-9 w-full rounded-lg border border-black/10 px-3 text-xs outline-none focus:border-black/30"
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={createRole}
                          className="flex-1 rounded-lg bg-black py-2 text-xs font-semibold text-white"
                        >
                          Add
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewRoleOpen(false);
                            setNewRoleName("");
                          }}
                          className="flex-1 rounded-lg bg-black/5 py-2 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!newRoleOpen && (
                    <button
                      type="button"
                      onClick={() => setNewRoleOpen(true)}
                      className="mx-3 mb-4 flex w-[calc(100%-24px)] items-center gap-2 rounded-xl border border-dashed border-black/15 px-3 py-3 text-xs font-semibold text-black/45 transition hover:border-black/30 hover:text-black/70"
                    >
                      <Plus size={15} />
                      New role
                    </button>
                  )}
                </aside>

                {/* ROLE DETAILS */}
                <section className="flex min-h-0 flex-col overflow-hidden">
                  {/* ROLE HEADER */}
                  <div className="shrink-0 border-b border-black/5 px-6 py-5 md:px-8">
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full"
                          style={{
                            background: selectedRole.color,
                          }}
                        />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-display text-xl font-extrabold">
                              {selectedRole.name}
                            </h2>

                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold text-black/45">
                              {memberCount(
                                selectedRole.id
                              )}{" "}
                              {memberCount(
                                selectedRole.id
                              ) === 1
                                ? "person"
                                : "people"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-black/45">
                            {selectedRole.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 rounded-xl border border-black/10 px-4 py-2 text-xs font-semibold transition hover:bg-black hover:text-white"
                      >
                        Edit role
                      </button>
                    </div>

                    {/* SUB TABS */}
                    <div className="mt-5 flex w-fit rounded-xl bg-[var(--color-cream)] p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setRoleSection("overview")
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                          roleSection === "overview"
                            ? "bg-white text-black shadow-sm"
                            : "text-black/45"
                        }`}
                      >
                        Overview
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRoleSection("pages")
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                          roleSection === "pages"
                            ? "bg-white text-black shadow-sm"
                            : "text-black/45"
                        }`}
                      >
                        Pages & access
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRoleSection("data")
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                          roleSection === "data"
                            ? "bg-white text-black shadow-sm"
                            : "text-black/45"
                        }`}
                      >
                        Data access
                      </button>
                    </div>
                  </div>

                  {/* DETAILS CONTENT */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8">
                    {/* OVERVIEW */}
                    {roleSection === "overview" && (
                      <div className="max-w-3xl">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-[var(--color-cream)] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/35">
                              Members
                            </p>

                            <p className="mt-2 font-display text-2xl font-extrabold">
                              {memberCount(
                                selectedRole.id
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[var(--color-cream)] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/35">
                              Pages
                            </p>

                            <p className="mt-2 font-display text-2xl font-extrabold">
                              {pagesWithAccess}
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              of {PAGES.length} accessible
                            </p>
                          </div>

                          <div className="rounded-xl bg-[var(--color-cream)] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/35">
                              Edit access
                            </p>

                            <p className="mt-2 font-display text-2xl font-extrabold">
                              {editPages.length}
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              pages
                            </p>
                          </div>
                        </div>

                        <div className="mt-7">
                          <h3 className="text-sm font-bold">
                            Access summary
                          </h3>

                          <p className="mt-1 text-xs text-black/40">
                            A quick overview of what this role
                            can access.
                          </p>

                          <div className="mt-4 divide-y divide-black/5">
                            {PAGES.map((page) => {
                              const access =
                                selectedRole.permissions[
                                  page
                                ];

                              return (
                                <div
                                  key={page}
                                  className="flex items-center justify-between py-3"
                                >
                                  <span className="text-sm font-medium">
                                    {page}
                                  </span>

                                  <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                      access === "edit"
                                        ? "bg-[var(--color-magenta)] text-white"
                                        : access === "view"
                                        ? "bg-black/5 text-black/60"
                                        : "bg-black/[0.03] text-black/25"
                                    }`}
                                  >
                                    {accessLabel(access)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PAGES & ACCESS */}
                    {roleSection === "pages" && (
                      <div>
                        <div className="mb-5">
                          <h3 className="text-sm font-bold">
                            Pages & access
                          </h3>

                          <p className="mt-1 text-xs text-black/40">
                            Choose what this role can see and
                            edit.
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-black/5">
                          <div className="grid grid-cols-[1fr_330px] bg-black/[0.025] px-4 py-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-black/35">
                              Page
                            </span>

                            <div className="grid grid-cols-3 text-center text-[10px] font-bold uppercase tracking-wider text-black/35">
                              <span>No access</span>
                              <span>View</span>
                              <span>Edit</span>
                            </div>
                          </div>

                          {PAGES.map((page) => {
                            const current =
                              selectedRole.permissions[page];

                            return (
                              <div
                                key={page}
                                className="grid grid-cols-[1fr_330px] items-center border-t border-black/5 px-4 py-3"
                              >
                                <span className="text-sm font-medium">
                                  {page}
                                </span>

                                <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--color-cream)] p-1">
                                  {(
                                    [
                                      "none",
                                      "view",
                                      "edit",
                                    ] as Access[]
                                  ).map((access) => {
                                    const active =
                                      current === access;

                                    return (
                                      <button
                                        type="button"
                                        key={access}
                                        onClick={() =>
                                          updatePermission(
                                            page,
                                            access
                                          )
                                        }
                                        className={`rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                                          active
                                            ? access ===
                                              "edit"
                                              ? "bg-[var(--color-magenta)] text-white shadow-sm"
                                              : access ===
                                                "view"
                                              ? "bg-black text-white shadow-sm"
                                              : "bg-black/25 text-white"
                                            : "text-black/30 hover:bg-white hover:text-black/60"
                                        }`}
                                      >
                                        {accessLabel(
                                          access
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DATA ACCESS */}
                    {roleSection === "data" && (
                      <div className="max-w-2xl">
                        <h3 className="text-sm font-bold">
                          Data access
                        </h3>

                        <p className="mt-1 text-xs text-black/40">
                          Configure which store information this
                          role can access.
                        </p>

                        <div className="mt-5 space-y-3">
                          {[
                            [
                              "Current store",
                              "Access data for the current store",
                            ],
                            [
                              "Sales data",
                              "View sales and transaction information",
                            ],
                            [
                              "Inventory data",
                              "View inventory and stock information",
                            ],
                            [
                              "Customer information",
                              "Access customer details",
                            ],
                          ].map(([title, description]) => (
                            <div
                              key={title}
                              className="flex items-center justify-between rounded-xl border border-black/5 p-4"
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  {title}
                                </p>

                                <p className="mt-1 text-xs text-black/40">
                                  {description}
                                </p>
                              </div>

                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                                <Check size={15} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* INVITE OVERLAY                                            */}
      {/* ========================================================= */}

      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity ${
          drawerOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white p-7 shadow-2xl transition-transform duration-300 ${
          drawerOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-magenta)]">
              Team
            </p>

            <h2 className="mt-1 font-display text-2xl font-extrabold">
              Invite someone
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Add a person and choose their role.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/50 hover:bg-black/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Full name
            </label>

            <input
              value={inviteName}
              onChange={(event) =>
                setInviteName(event.target.value)
              }
              placeholder="e.g. Priya Sharma"
              className="h-12 w-full rounded-xl border border-black/10 bg-[var(--color-cream)] px-4 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Email address
            </label>

            <input
              type="email"
              value={inviteEmail}
              onChange={(event) =>
                setInviteEmail(event.target.value)
              }
              placeholder="name@example.com"
              className="h-12 w-full rounded-xl border border-black/10 bg-[var(--color-cream)] px-4 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-black/60">
              Role
            </label>

            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => setInviteRole(role.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    inviteRole === role.id
                      ? "border-black bg-black/[0.04]"
                      : "border-black/5 hover:bg-black/[0.025]"
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: role.color }}
                  />

                  <span className="flex-1 text-sm font-semibold">
                    {role.name}
                  </span>

                  {inviteRole === role.id && (
                    <Check size={16} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-black/5 pt-5">
          <button
            type="button"
            onClick={sendInvite}
            disabled={
              !inviteName.trim() ||
              !inviteEmail.trim()
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-magenta)] text-sm font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UserPlus size={17} />
            Send invite
          </button>
        </div>
      </aside>
    </main>
  );
}