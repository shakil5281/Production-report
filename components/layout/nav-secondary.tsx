"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { UserWithPermissions } from "@/lib/types/auth"

export function NavSecondary({
  items,
  user,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    roles?: string[]
  }[]
  user: UserWithPermissions
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const router = useRouter()
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
  
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={() => handleNavigation(item.url)}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
