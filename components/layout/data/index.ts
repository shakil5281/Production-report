import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings, IconChartBar, IconFileText, IconTrendingUp, IconUsers, IconUser, IconBook, IconCode, IconApps, IconCurrencyDollar, IconReceipt, IconCash, IconWallet, IconCut, IconScissors, IconClipboardData, IconTarget, IconBuilding, IconClock } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
      roles: ["USER", "SUPER_ADMIN"], // All users can access
    },
    {
      title: "Platform",
      url: "/platform",
      icon: IconApps,
      isActive: false,
      roles: ["USER", "SUPER_ADMIN"],
    },
    {
      title: "Production Reports",
      url: "/production-reports",
      icon: IconFileText,
      isActive: false,
      roles: ["USER", "SUPER_ADMIN"], // Users with READ_REPORT permission
    },
  ],
  navGroup: [
    {
      title: "Production Management",
      icon: IconBuilding,
      roles: ["USER", "SUPER_ADMIN"], // Users with production permissions
      items: [
        {
          title: "Production List",
          url: "/production-list",
          roles: ["USER", "SUPER_ADMIN"], // READ_PRODUCTION permission
        },
        {
          title: "Lines Management",
          url: "/lines",
          roles: ["USER", "SUPER_ADMIN"], // READ_LINE permission
        },


      ],
    },
    {
      title: "Production Reports",
      icon: IconClipboardData,
      roles: ["USER", "SUPER_ADMIN"], // Users with report permissions
      items: [
        {
          title: "Daily Production Report",
          url: "/daily-production-report",
          roles: ["USER", "SUPER_ADMIN"], // READ_PRODUCTION, READ_REPORT permissions
        },
        {
          title: "Production Analytics",
          url: "/production-reports",
          roles: ["USER", "SUPER_ADMIN"], // READ_REPORT permission
        },
        {
          title: "Profit & Loss Report",
          url: "/profit-loss",
          roles: ["USER", "SUPER_ADMIN"], // READ_REPORT permission
        },
      ],
    },
    {
      title: "Target Management",
      icon: IconTarget,
      roles: ["USER", "SUPER_ADMIN"], // Users with target permissions
      items: [
        {
          title: "Set Targets",
          url: "/target",
          roles: ["USER", "SUPER_ADMIN"], // READ_TARGET permission
        },

        {
          title: "Comprehensive Target Report",
          url: "/target/comprehensive-report",
          roles: ["USER", "SUPER_ADMIN"], // READ_TARGET permission
        },
      ],
    },
    {
      title: "Expense",
      icon: IconCurrencyDollar,
      roles: ["USER", "SUPER_ADMIN"], // Users with expense permissions
      items: [
        {
          title: "Daily Salary",
          url: "/expenses/daily-salary",
          roles: ["USER", "SUPER_ADMIN"], // READ_EXPENSE permission
        },
        {
          title: "Daily Expense",
          url: "/expenses/daily-expense",
          roles: ["USER", "SUPER_ADMIN"], // READ_EXPENSE permission
        },
      ],
    },
    {
      title: "Cashbook",
      icon: IconWallet,
      roles: ["USER", "SUPER_ADMIN"], // Users with cashbook permissions
      items: [
        {
          title: "Summary",
          url: "/cashbook",
          roles: ["USER", "SUPER_ADMIN"], // READ_CASHBOOK permission
        },
        {
          title: "Cash Received",
          url: "/cashbook/cash-received",
          roles: ["USER", "SUPER_ADMIN"], // CREATE_CASHBOOK permission
        },
        {
          title: "Daily Expense",
          url: "/cashbook/daily-expense",
          roles: ["USER", "SUPER_ADMIN"], // CREATE_CASHBOOK permission
        },
        {
          title: "Monthly Express Report",
          url: "/cashbook/monthly-express-report",
          roles: ["USER", "SUPER_ADMIN"], // READ_REPORT permission
        },
      ],
    },
    {
      title: "Cutting",
      icon: IconScissors,
      roles: ["USER", "SUPER_ADMIN"], // Users with cutting permissions
      items: [
        {
          title: "Summary",
          url: "/cutting",
          roles: ["USER", "SUPER_ADMIN"], // READ_CUTTING permission
        },
        {
          title: "Daily Input",
          url: "/cutting/daily-input",
          roles: ["USER", "SUPER_ADMIN"], // CREATE_CUTTING permission
        },
        {
          title: "Daily Output",
          url: "/cutting/daily-output",
          roles: ["USER", "SUPER_ADMIN"], // CREATE_CUTTING permission
        },
        {
          title: "Monthly Report",
          url: "/cutting/monthly-report",
          roles: ["USER", "SUPER_ADMIN"], // READ_REPORT permission
        },
      ],
    },
    {
      title: "Shipments",
      icon: IconReport,
      roles: ["USER", "SUPER_ADMIN"], // Users with shipment permissions
      items: [
        {
          title: "All Shipments",
          url: "/shipments",
          roles: ["USER", "SUPER_ADMIN"], // READ_SHIPMENT permission
        },
        {
          title: "Create Shipment",
          url: "/shipments/create",
          roles: ["USER", "SUPER_ADMIN"], // CREATE_SHIPMENT permission
        },
        {
          title: "Shipment Reports",
          url: "/shipments/reports",
          roles: ["USER", "SUPER_ADMIN"], // READ_REPORT permission
        },
      ],
    },
    {
      title: "Manpower Management",
      icon: IconClock,
      roles: ["USER", "SUPER_ADMIN"], // Users with attendance permissions
      items: [
        {
          title: "📊 View & Manage Data",
          url: "/attendance/summary",
          roles: ["USER", "SUPER_ADMIN"], // READ_ATTENDANCE permission
        },
        {
          title: "📤 Import from Excel",
          url: "/attendance/manpower-import",
          roles: ["USER", "SUPER_ADMIN"], // MANAGE_ATTENDANCE permission
        },
        {
          title: "⏰ Overtime Management",
          url: "/overtime/management",
          roles: ["USER", "SUPER_ADMIN"], // MANAGE_ATTENDANCE permission
        },
        {
          title: "💰 Daily Salary",
          url: "/salary/daily",
          roles: ["USER", "SUPER_ADMIN"], // MANAGE_EXPENSE permission
        },
      ],
    },
    {
      title: "Administration",
      icon: IconSettings,
      roles: ["SUPER_ADMIN"], // Only Super Admin can access administration
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
        {
          title: "User Management",
          url: "/admin/users",
          roles: ["SUPER_ADMIN"], // CREATE_USER, READ_USER, UPDATE_USER, DELETE_USER permissions
        },
        {
          title: "Permissions",
          url: "/admin/permissions",
          roles: ["SUPER_ADMIN"], // MANAGE_PERMISSIONS permission
        },
        {
          title: "Role Management",
          url: "/admin/roles",
          roles: ["SUPER_ADMIN"], // MANAGE_ROLES permission
        },
        {
          title: "System Settings",
          url: "/admin/settings",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
        {
          title: "API Routes",
          url: "/admin/api-routes",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
        {
          title: "System Logs",
          url: "/admin/logs",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
        {
          title: "Database Manager",
          url: "/admin/database",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
        {
          title: "Backup & Recovery",
          url: "/admin/backup",
          roles: ["SUPER_ADMIN"], // MANAGE_SYSTEM permission
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Profile",
      url: "/profile",
      icon: IconUser,
      isActive: false,
      roles: ["USER", "SUPER_ADMIN"], // All authenticated users can access profile
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
      isActive: false,
      roles: ["USER", "SUPER_ADMIN"], // All authenticated users can access help
    },
  ],
  documents: [
    {
      title: "Getting Started",
      url: "/docs/getting-started",
      icon: IconBook,
      isActive: false,
    },
    {
      title: "API Reference",
      url: "/docs/api",
      icon: IconCode,
      isActive: false,
    },
    {
      title: "User Guide",
      url: "/docs/user-guide",
      icon: IconFileText,
      isActive: false,
    },
  ],
}