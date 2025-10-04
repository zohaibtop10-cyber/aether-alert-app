import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { LocationProvider } from '@/hooks/use-location';
import { FirebaseClientProvider } from '@/firebase';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { EcoBotChatWidget } from '@/components/ecobot/ecobot-chat-widget';

export const metadata: Metadata = {
  title: 'MyClimateGuard 2.0',
  description: 'Real-time environmental conditions, weather predictions, and health alerts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <ThemeProvider>
            <LocationProvider>
              <SidebarProvider>
                <Sidebar>
                  <AppSidebar />
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
                <EcoBotChatWidget />
              </SidebarProvider>
              <Toaster />
            </LocationProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
