"use client"

import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"
import { UserWithPermissions } from "@/lib/types/auth"

// import { NavDocuments } from "@/components/layout/nav-documents"
import { NavUser } from "@/components/layout/nav-user"
import { DynamicNav } from "@/components/layout/dynamic-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  user: UserWithPermissions;
}

export function AppSidebar({ user, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Production System</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DynamicNav user={user} type="main" />
        <DynamicNav user={user} type="group" />
        <DynamicNav user={user} type="secondary" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
