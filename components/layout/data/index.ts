import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings, IconChartBar, IconFileText, IconTrendingUp, IconUsers, IconUser, IconBook, IconCode, IconApps, IconCurrencyDollar, IconReceipt, IconCash, IconWallet, IconCut, IconScissors } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"], // All users can access
    },
    {
      title: "Platform",
      url: "/platform",
      icon: IconApps,
      isActive: false,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    },
    {
      title: "Production Reports",
      url: "/production-reports",
      icon: IconFileText,
      isActive: false,
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"], // Managers and above
    },
    {
      title: "Profit & Loss",
      url: "/profit-loss",
      icon: IconTrendingUp,
      isActive: false,
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"], // Managers and above
    },
  ],
  navGroup: [
    {
      title: "Production",
      icon: IconChartBar,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Production List",
          url: "/production-list",
        },
        {
          title: "Target",
          url: "/target",
        },
            {
      title: "Daily Target Report",
      url: "/target/daily-report",
    },
    {
      title: "Comprehensive Target Report",
      url: "/target/comprehensive-report",
    },
        {
          title: "Lines",
          url: "/lines",
        },
        {
          title: "Daily Production",
          url: "/daily-production",
        },
      ],
    },
    {
      title: "Expense",
      icon: IconCurrencyDollar,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Manpower",
          url: "/expenses/manpower",
        },
        {
          title: "Daily Salary",
          url: "/expenses/daily-salary",
        },
        {
          title: "Daily Expense",
          url: "/expenses/daily-expense",
        },
      ],
    },
    {
      title: "Cashbook",
      icon: IconWallet,
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Summary",
          url: "/cashbook",
        },
        {
          title: "Cash Received",
          url: "/cashbook/cash-received",
        },
        {
          title: "Daily Expense",
          url: "/cashbook/daily-expense",
        },
        {
          title: "Monthly Express Report",
          url: "/cashbook/monthly-express-report",
        },
      ],
    },
    {
      title: "Cutting",
      icon: IconScissors,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Summary",
          url: "/cutting",
        },
        {
          title: "Daily Input",
          url: "/cutting/daily-input",
        },
        {
          title: "Daily Output",
          url: "/cutting/daily-output",
        },
        {
          title: "Monthly Report",
          url: "/cutting/monthly-report",
        },
      ],
    },
    {
      title: "Administration",
      icon: IconSettings,
      roles: ["ADMIN", "SUPER_ADMIN"], // Only show for admin users
      items: [
        {
          title: "User Management",
          url: "/admin/users",
        },
        {
          title: "System Settings",
          url: "/admin/settings",
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
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
      isActive: false,
      roles: ["USER", "MANAGER", "ADMIN", "SUPER_ADMIN"],
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