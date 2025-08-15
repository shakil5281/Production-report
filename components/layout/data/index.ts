import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings, IconChartBar, IconFileText, IconTrendingUp, IconUsers, IconUser, IconBook, IconCode, IconApps, IconCurrencyDollar, IconReceipt, IconCash, IconWallet, IconCut, IconScissors } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN", "CASHBOOK_MANAGER", "PRODUCTION_MANAGER", "CUTTING_MANAGER", "REPORT_VIEWER"], // All users can access
    },
    {
      title: "Platform",
      url: "/platform",
      icon: IconApps,
      isActive: false,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN", "CASHBOOK_MANAGER", "PRODUCTION_MANAGER", "CUTTING_MANAGER", "REPORT_VIEWER"],
    },
    {
      title: "Production Reports",
      url: "/production-reports",
      icon: IconFileText,
      isActive: false,
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "PRODUCTION_MANAGER", "REPORT_VIEWER"], // Production related roles
    },
    {
      title: "Profit & Loss",
      url: "/profit-loss",
      icon: IconTrendingUp,
      isActive: false,
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"], // Financial reports
    },
  ],
  navGroup: [
    {
      title: "Production",
      icon: IconChartBar,
      roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
      items: [
        {
          title: "Production List",
          url: "/production-list",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Target",
          url: "/target",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Daily Target Report",
          url: "/target/daily-report",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Comprehensive Target Report",
          url: "/target/comprehensive-report",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Lines",
          url: "/lines",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Daily Production",
          url: "/daily-production",
          roles: ["PRODUCTION_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
      ],
    },
    {
      title: "Expense",
      icon: IconCurrencyDollar,
      roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
      items: [
        {
          title: "Manpower",
          url: "/expenses/manpower",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Daily Salary",
          url: "/expenses/daily-salary",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Daily Expense",
          url: "/expenses/daily-expense",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
      ],
    },
    {
      title: "Cashbook",
      icon: IconWallet,
      roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
      items: [
        {
          title: "Summary",
          url: "/cashbook",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Cash Received",
          url: "/cashbook/cash-received",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Expense",
          url: "/cashbook/daily-expense",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Monthly Express Report",
          url: "/cashbook/monthly-express-report",
          roles: ["CASHBOOK_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
      ],
    },
    {
      title: "Cutting",
      icon: IconScissors,
      roles: ["CUTTING_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
      items: [
        {
          title: "Summary",
          url: "/cutting",
          roles: ["CUTTING_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
        {
          title: "Daily Input",
          url: "/cutting/daily-input",
          roles: ["CUTTING_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Daily Output",
          url: "/cutting/daily-output",
          roles: ["CUTTING_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        },
        {
          title: "Monthly Report",
          url: "/cutting/monthly-report",
          roles: ["CUTTING_MANAGER", "MANAGER", "ADMIN", "SUPER_ADMIN", "REPORT_VIEWER"],
        },
      ],
    },
    {
      title: "Administration",
      icon: IconSettings,
      roles: ["SUPER_ADMIN"], // Only Super Admin can manage users
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          roles: ["SUPER_ADMIN"],
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
          title: "System Settings",
          url: "/admin/settings",
          roles: ["SUPER_ADMIN"],
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
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN", "CASHBOOK_MANAGER", "PRODUCTION_MANAGER", "CUTTING_MANAGER", "REPORT_VIEWER"],
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
      isActive: false,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN", "CASHBOOK_MANAGER", "PRODUCTION_MANAGER", "CUTTING_MANAGER", "REPORT_VIEWER"],
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