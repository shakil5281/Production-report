// lib/rbac.ts
export const canExportReport = (role: string) => {
  return ["Admin", "Manager", "SuperAdmin"].includes(role);
};
