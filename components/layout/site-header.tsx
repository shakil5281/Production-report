'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserWithPermissions } from "@/lib/types/auth"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

interface SiteHeaderProps {
  user: UserWithPermissions;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      // no-op
    } finally {
      router.push('/login')
      router.refresh()
    }
  }, [router])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-3 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 hidden sm:block"
        />
        <h1 className="text-sm sm:text-base font-medium truncate">Production Dashboard</h1>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{user.name}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full truncate">
              {user.role.replace('_', ' ')}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
