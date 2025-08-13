"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { type Icon } from "@tabler/icons-react"
import { usePathname, useRouter } from "next/navigation"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { UserWithPermissions } from "@/lib/types/auth"
import Link from "next/link"

export function NavGroup({
    items,
    user,
}: {
    items: {
        title: string
        url?: string
        icon?: Icon
        isActive?: boolean
        roles?: string[]
        items?: {
            title: string
            url: string
        }[]
    }[]
    user: UserWithPermissions
}) {
    // Track which collapsible is open to enforce single-open behavior
    const [openKey, setOpenKey] = React.useState<string | null>(
        items.find((i) => i.isActive)?.title ?? null
    )
    const pathname = usePathname()
    const router = useRouter()
    const { setOpenMobile } = useSidebar()
    
    // Filter items based on user role using the roles array from data
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
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {filteredItems.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        open={openKey === item.title}
                        onOpenChange={(nextOpen) =>
                            setOpenKey(nextOpen ? item.title : null)
                        }
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={item.title} className="relative transition-all duration-200 ease-in-out">
                                    {/* Active indicator line */}
                                    <span
                                        aria-hidden
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary opacity-0 transition-opacity duration-200 group-data-[state=open]/collapsible:opacity-100"
                                    />
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronRight className="ml-auto transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {item.items?.map((subItem) => {
                                        const isSubActive = pathname === subItem.url
                                        return (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton 
                                                    asChild
                                                    isActive={isSubActive}
                                                >
                                                    <Link 
                                                        href={subItem.url}
                                                        onClick={() => setOpenMobile(false)}
                                                    >
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )
                                    })}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
