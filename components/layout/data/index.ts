import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings, IconChartBar, IconFileText, IconTrendingUp, IconUsers, IconUser, IconBook, IconCode, IconApps, IconCurrencyDollar, IconReceipt, IconCash, IconWallet, IconCut, IconScissors } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"], // All users can access
    },
    {
      title: "Platform",
      url: "/platform",
      icon: IconApps,
      isActive: false,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
    },
    {
      title: "Production Reports",
      url: "/production-reports",
      icon: IconFileText,
      isActive: false,
      roles: ["ADMIN", "SUPER_ADMIN"], // Admin and Super Admin only
    },
    {
      title: "Profit & Loss",
      url: "/profit-loss",
      icon: IconTrendingUp,
      isActive: false,
      roles: ["ADMIN", "SUPER_ADMIN"], // Financial reports
    },
  ],
  navGroup: [
    {
      title: "Production",
      icon: IconChartBar,
      roles: ["ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Production List",
          url: "/production-list",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Target",
          url: "/target",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Target Report",
          url: "/target/daily-report",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Comprehensive Target Report",
          url: "/target/comprehensive-report",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Lines",
          url: "/lines",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Production",
          url: "/daily-production",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
      ],
    },
    {
      title: "Expense",
      icon: IconCurrencyDollar,
      roles: ["ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Manpower",
          url: "/expenses/manpower",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Salary",
          url: "/expenses/daily-salary",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Expense",
          url: "/expenses/daily-expense",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
      ],
    },
    {
      title: "Cashbook",
      icon: IconWallet,
      roles: ["ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Summary",
          url: "/cashbook",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Cash Received",
          url: "/cashbook/cash-received",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Expense",
          url: "/cashbook/daily-expense",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Monthly Express Report",
          url: "/cashbook/monthly-express-report",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
      ],
    },
    {
      title: "Cutting",
      icon: IconScissors,
      roles: ["ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Summary",
          url: "/cutting",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Input",
          url: "/cutting/daily-input",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Output",
          url: "/cutting/daily-output",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Monthly Report",
          url: "/cutting/monthly-report",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
      ],
    },
    {
      title: "Administration",
      icon: IconSettings,
      roles: ["SUPER_ADMIN", "ADMIN"], // Super Admin and Admin can access
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          roles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
          title: "User Management",
          url: "/admin/users",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "Permissions",
          url: "/admin/permissions",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "Role Management",
          url: "/admin/roles",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "System Settings",
          url: "/admin/settings",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "API Routes",
          url: "/admin/api-routes",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "System Logs",
          url: "/admin/logs",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "Database Manager",
          url: "/admin/database",
          roles: ["SUPER_ADMIN"],
        },
        {
          title: "Backup & Recovery",
          url: "/admin/backup",
          roles: ["SUPER_ADMIN"],
        },
      ],
    },
    {
      title: "Shipments",
      icon: IconReport,
      roles: ["ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "All Shipments",
          url: "/shipments",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Create Shipment",
          url: "/shipments/create",
          roles: ["ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Shipment Reports",
          url: "/shipments/reports",
          roles: ["ADMIN", "SUPER_ADMIN"],
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
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
      isActive: false,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
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