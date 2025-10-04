'use client';

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Bell,
  Home,
  LineChart,
  User,
  LogOut,
  AirVent,
  ChevronsLeft,
  Users,
  GitCompare,
  CalendarDays,
  MessageSquare,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const sidebarNav = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Alerts',
    href: '/alerts',
    icon: Bell,
  },
  {
    title: 'History',
    href: '/history',
    icon: LineChart,
  },
  {
    title: 'Compare',
    href: '/compare',
    icon: GitCompare,
  },
];

const communityNav = [
  {
    title: 'Events',
    href: '/community/events',
    icon: CalendarDays
  },
  {
    title: 'Posts',
    href: '/community/posts',
    icon: MessageSquare
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { auth } = useFirebase();
  const router = useRouter();

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.push('/login');
    });
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <AirVent className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Aether Alert
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <Collapsible>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                    <Users />
                    <span className="group-data-[collapsible=icon]:hidden">Community</span>
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-none">
              <SidebarMenuSub>
                {communityNav.map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        {item.title}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/profile'}>
              <Link href="/profile">
                <User />
                <span className="group-data-[collapsible=icon]:hidden">
                  Profile
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut />
        </Button>
        <SidebarTrigger>
          <ChevronsLeft />
        </SidebarTrigger>
      </SidebarFooter>
    </>
  );
}
