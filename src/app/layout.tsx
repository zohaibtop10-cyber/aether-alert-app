import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { LocationProvider } from '@/hooks/use-location';
import { FirebaseClientProvider } from '@/firebase';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { EcoBotChatWidget } from '@/components/ecobot/ecobot-chat-widget';
import Header from '@/components/dashboard/header';
import { MotionWrapper } from '@/components/motion-wrapper';

export const metadata: Metadata = {
  title: 'Aether Alert',
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
                    <div className="flex flex-col h-screen">
                        <Header />
                        <main className="flex-1 overflow-y-auto">
                            <MotionWrapper>{children}</MotionWrapper>
                        </main>
                    </div>
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
