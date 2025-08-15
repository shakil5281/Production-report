'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserWithPermissions } from '@/lib/types/auth';
import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  isPublic: boolean;
  children?: NavigationItem[];
}

interface DynamicNavProps {
  user: UserWithPermissions;
  type: 'main' | 'group' | 'secondary';
}

export function DynamicNav({ user, type }: DynamicNavProps) {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    fetchNavigation();
  }, [user]);

  const fetchNavigation = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/navigation', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch navigation');
      }
      
      const data = await response.json();
      setNavigationItems(data.data || []);
    } catch (err) {
      console.error('Error fetching navigation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (url: string) => {
    router.push(url);
    setOpenMobile(false);
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    
    // @ts-ignore - Dynamic icon access
    const IconComponent = TablerIcons[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const filterItemsByType = (items: NavigationItem[]) => {
    switch (type) {
      case 'main':
        // Main navigation items (no parent, no children)
        return items.filter(item => 
          !item.parentId && 
          (!item.children || item.children.length === 0)
        );
      case 'group':
        // Group navigation items (no parent, has children)
        return items.filter(item => 
          !item.parentId && 
          item.children && 
          item.children.length > 0
        );
      case 'secondary':
        // Secondary navigation items (based on URL patterns)
        return items.filter(item => 
          !item.parentId && 
          (item.url.includes('/profile') || item.url.includes('/help'))
        );
      default:
        return items;
    }
  };

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const filteredItems = filterItemsByType(navigationItems);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => {
            const isActive = pathname === item.url;
            const hasChildren = item.children && item.children.length > 0;
            
            if (hasChildren) {
              return (
                <Collapsible key={item.id} asChild defaultOpen={false}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="cursor-pointer min-h-10 md:min-h-8"
                      >
                        {getIconComponent(item.icon)}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children?.map((child) => {
                          const isChildActive = pathname === child.url;
                          return (
                            <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isChildActive}
                                className="cursor-pointer"
                              >
                                <button onClick={() => handleNavigation(child.url)}>
                                  {getIconComponent(child.icon)}
                                  <span>{child.title}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            } else {
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="cursor-pointer min-h-10 md:min-h-8"
                  >
                    <button onClick={() => handleNavigation(item.url)}>
                      {getIconComponent(item.icon)}
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
