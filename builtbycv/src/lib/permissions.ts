import type { Role } from "./db/schema";

/**
 * What each role may do. Only admin exists today. To add office/sales/field
 * staff later, adjust these lists — every CRM action already checks a permission.
 */
export const PERMISSIONS = [
  "leads:read",
  "leads:write",
  "customers:read",
  "customers:write",
  "projects:read",
  "projects:write",
  "pipeline:configure",
  "tasks:write",
  "photos:write",
  "users:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  office: [
    "leads:read", "leads:write", "customers:read", "customers:write",
    "projects:read", "projects:write", "tasks:write", "photos:write",
  ],
  sales: [
    "leads:read", "leads:write", "customers:read", "customers:write",
    "projects:read", "projects:write", "tasks:write", "photos:write",
  ],
  field: ["projects:read", "customers:read", "tasks:write", "photos:write"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
