import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import {dark}from "@clerk/themes"
import { checkUser } from '../lib/checkUser'
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"]
 
});

export const metadata = {
  title: "AI Carrer Coach - Muskan Ghedta",
  description: " Sensai AI Carrer Coach - Full Stack React Project",
};

export default async function RootLayout({ children }) {
  await checkUser()
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-background text-foreground`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen pt-16">
              {children}
            </main>
            <Toaster richColors/>

            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>© 2026 Muskan Ghedta. Built with passion ❤️‍🔥</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
