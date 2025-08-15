"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { UserWithPermissions } from "@/lib/types/auth"

export function NavMain({
  items,
  user,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    roles?: string[]
  }[]
  user: UserWithPermissions
}) {

  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  
  // Filter items based on user permissions
  const filteredItems = items.filter(item => {
    // Check role-based access first
    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }
    
    // For SuperAdmin, allow access to everything
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }
    
    // Check URL-based permissions if URL exists
    if (item.url) {
      const { canAccessRoute } = require('@/lib/permissions');
      const userPermissions = user.permissions || [];
      return canAccessRoute(user.role, userPermissions, item.url);
    }
    
    return true;
  })
  
  const handleNavigation = (url: string) => {
    router.push(url)
    // Close mobile sidebar when navigating
    setOpenMobile(false)
  }
  
  // const url = items.find((item) => item.title === "Dashboard")?.url || "/dashboard"
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-secondary text-primary ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {filteredItems.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  className={`cursor-pointer ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} 
                  onClick={() => handleNavigation(item.url)} 
                  tooltip={item.title}
                  isActive={isActive}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
