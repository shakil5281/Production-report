import { IconDashboard, IconDatabase, IconFileWord, IconHelp, IconReport, IconSearch, IconSettings } from "@tabler/icons-react"
import { Book, ShieldCheck } from "lucide-react"


export const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: IconDashboard,
      }
    ],
    navGroup: [
      {
        title: "Production Reports",
        url: "#",
        icon: ShieldCheck,
        isActive: true,
        items: [
          {
            title: "List",
            url: "/production-reports",
          },
          {
            title: "Daily Production",
            url: "/daily-production",
          },
          {
            title: "Profit & Loss",
            url: "/profit-loss",
          },
        ],
      },
      {
        title: "Daily Expense",
        url: "#",
        icon: Book,
        isActive: false,
        items: [
          {
            title: "List",
            url: "/production-reports",
          },
          {
            title: "Daily Production",
            url: "/daily-production",
          },
          {
            title: "Profit & Loss",
            url: "/profit-loss",
          },
        ],
      },
    ],
  
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
      {
        name: "Reports",
        url: "#",
        icon: IconReport,
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: IconFileWord,
      },
    ],
  }