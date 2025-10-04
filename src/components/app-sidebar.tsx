'use client';

import {
  SidebarContent,
  Sidebar,
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
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useState } from 'react';

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
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { auth } = useFirebase();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
            MyClimateGuard
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  icon={<item.icon />}
                >
                  {item.title}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
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
