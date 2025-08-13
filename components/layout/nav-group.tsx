"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { type Icon } from "@tabler/icons-react"
import { usePathname } from "next/navigation"

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
import Link from "next/link"

export function NavGroup({
    items,
}: {
    items: {
        title: string
        url?: string
        icon?: Icon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    // Track which collapsible is open to enforce single-open behavior
    const [openKey, setOpenKey] = React.useState<string | null>(
        items.find((i) => i.isActive)?.title ?? null
    )
    const pathname = usePathname()

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
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
                                                    <Link href={subItem.url}>
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
