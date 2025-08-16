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
            roles?: string[]
        }[]
    }[]
    user: UserWithPermissions
}) {
    // Track which collapsibles are open - allows multiple open at once
    const [openKeys, setOpenKeys] = React.useState<Set<string>>(new Set())
    const pathname = usePathname()
    const router = useRouter()
    const { setOpenMobile } = useSidebar()
    
    // Filter items based on user permissions and roles
    const filteredItems = React.useMemo(() => {
        return items.filter(item => {
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
                const { canAccessPage } = require('@/lib/permissions');
                if (!canAccessPage(user, item.url)) {
                    return false;
                }
            }
            
            // Filter sub-items based on permissions
            if (item.items) {
                const { canAccessPage } = require('@/lib/permissions');
                
                item.items = item.items.filter(subItem => {
                    // Check role-based access
                    if (subItem.roles && !subItem.roles.includes(user.role)) {
                        return false;
                    }
                    
                    // SuperAdmin can access everything
                    if (user.role === 'SUPER_ADMIN') {
                        return true;
                    }
                    
                    // Check URL permissions
                    if (subItem.url) {
                        return canAccessPage(user, subItem.url);
                    }
                    
                    return true;
                });
                
                // If no sub-items remain and main item has no direct URL, hide the group
                if (item.items.length === 0 && !item.url) {
                    return false;
                }
            }
            
            return true;
        })
    }, [items, user.role, user.permissions])

    // Check if any item in a group is active and auto-expand that group
    React.useEffect(() => {
        const activeGroups = new Set<string>()
        
        for (const item of filteredItems) {
            // Check if the main group URL is active
            const isMainGroupActive = item.url && pathname === item.url
            
            // Check if any sub-item is active
            const hasActiveSubItem = item.items?.some(subItem => pathname === subItem.url)
            
            if (isMainGroupActive || hasActiveSubItem) {
                activeGroups.add(item.title)
            }
        }
        
        // Only update if there are new active groups that aren't already open
        setOpenKeys(prevKeys => {
            const hasNewGroups = Array.from(activeGroups).some(group => !prevKeys.has(group))
            
            if (hasNewGroups) {
                const newKeys = new Set(prevKeys)
                activeGroups.forEach(group => newKeys.add(group))
                return newKeys
            }
            
            return prevKeys // Return the same reference to prevent re-renders
        })
    }, [pathname, filteredItems])
    
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
                        open={openKeys.has(item.title)}
                        onOpenChange={(nextOpen) => {
                            const newOpenKeys = new Set(openKeys)
                            if (nextOpen) {
                                newOpenKeys.add(item.title)
                            } else {
                                newOpenKeys.delete(item.title)
                            }
                            setOpenKeys(newOpenKeys)
                        }}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton 
                                    tooltip={item.title} 
                                    className="relative transition-all duration-200 ease-in-out"
                                    onClick={(e) => {
                                        // If the item has a URL, navigate to it
                                        if (item.url) {
                                            e.preventDefault()
                                            handleNavigation(item.url)
                                        }
                                    }}
                                >
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
                                    {item.items?.filter(subItem => {
                                        // Filter sub-items based on user role
                                        if (!subItem.roles) return true
                                        return subItem.roles.includes(user.role)
                                    }).map((subItem) => {
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
