import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings, IconChartBar, IconFileText, IconTrendingUp, IconUsers, IconUser, IconBook, IconCode } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "Daily Production",
      url: "/daily-production",
      icon: IconChartBar,
      isActive: false,
    },
    {
      title: "Production Reports",
      url: "/production-reports",
      icon: IconFileText,
      isActive: false,
    },
    {
      title: "Profit & Loss",
      url: "/profit-loss",
      icon: IconTrendingUp,
      isActive: false,
    },
  ],
  navGroup: [
    {
      title: "Administration",
      icon: IconSettings,
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
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
      isActive: false,
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