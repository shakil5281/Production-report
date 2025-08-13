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
  
  // Filter items based on user role
  const filteredItems = items.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user.role)
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
