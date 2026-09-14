/**
 * Control-room roles. Shared by the server (which enforces them) and the UI
 * (which only uses them to hide what a person can't open anyway).
 */

export type Permission = "catalog" | "documents" | "health" | "team";

export const ROLES = {
  developer: {
    label: "Developer",
    description: "Full access, including site health and the team list. Only developers can change developer accounts.",
    grants: ["catalog", "documents", "health", "team"],
  },
  admin: {
    label: "Administrator",
    description: "Full access, including site health and adding or removing people.",
    grants: ["catalog", "documents", "health", "team"],
  },
  editor: {
    label: "Editor",
    description: "Products, collections and the document generators. Can't manage the team.",
    grants: ["catalog", "documents"],
  },
} as const satisfies Record<string, { label: string; description: string; grants: Permission[] }>;

export type Role = keyof typeof ROLES;

export const ROLE_IDS = Object.keys(ROLES) as Role[];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in ROLES;
}

export function can(role: Role, permission: Permission) {
  return (ROLES[role].grants as readonly Permission[]).includes(permission);
}

/** Usernames: letters, digits, dot, dash, underscore. Matched case-insensitively. */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;
export const PASSWORD_MIN = 4;
