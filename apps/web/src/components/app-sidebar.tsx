"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Shield,
} from 'lucide-react';

import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import Link from 'next/link';

const data = {
  navMain: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          title: "Users",
          url: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Roles",
          url: "/dashboard/admin/roles",
          icon: Shield,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-2 py-3 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-sm">NP</span>
          </div>
          <span className="font-semibold text-lg">NextPress</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname == item.url}>
                      <Link href={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user!}/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
